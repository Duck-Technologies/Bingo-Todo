import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BoardPage } from './board-page';
import { provideZonelessChangeDetection } from '@angular/core';
import { BingoLocalStorage } from '../../features/persistence/bingo-local';
import { BingoApi } from '../../features/persistence/bingo-api';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { HarnessLoader } from '@angular/cdk/testing';
import { MatButtonHarness } from '@angular/material/button/testing';
import { By } from '@angular/platform-browser';
import { BoardCalculations } from '../../features/calculations/board-calculations';
import { BoardCell, BoardInfo } from '../../features/board/board';
import { MatCheckboxHarness } from '@angular/material/checkbox/testing';
import { MatDialogHarness } from '@angular/material/dialog/testing';
import { MatInputHarness } from '@angular/material/input/testing';
import { firstValueFrom, of } from 'rxjs';
import { MatSelectHarness } from '@angular/material/select/testing';
import { MatMenuHarness } from '@angular/material/menu/testing';
import { ActivatedRoute } from '@angular/router';

describe('BoardPage', () => {
  let component: BoardPage;
  let fixture: ComponentFixture<BoardPage>;
  let loader: HarnessLoader;
  let rootLoader: HarnessLoader;
  let helper: Helper;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BoardPage],
      providers: [
        provideZonelessChangeDetection(),
        {
          provide: ActivatedRoute,
          useValue: jasmine.createSpyObj<ActivatedRoute>('ActivatedRoute', [''])
        },
        {
          provide: BingoApi,
          useValue: jasmine.createSpyObj<BingoApi>(['createBoard']),
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BoardPage);
    rootLoader = TestbedHarnessEnvironment.documentRootLoader(fixture);
    loader = TestbedHarnessEnvironment.loader(fixture);
    helper = new Helper(fixture, loader);
    component = fixture.componentInstance;

    const board = new BoardInfo<BoardCell>(BingoLocalStorage.DefaultBoard);
    board.Cells = BoardCalculations.getRowIndexes(9).map(
      (i) => new BoardCell({ Name: i.toString() }, i, 3)
    );

    BingoLocalStorage.createBoard(board);

    fixture.componentRef.setInput('board', board);
    fixture.autoDetectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('available actions', () => {
    // TODO should disable/hide edit and delete if it's not the user's board
    it('should be visible by default', async () => {
      expect(await loader.getHarnessOrNull(MatMenuHarness)).not.toBeNull();
    });

    it('should be close history when mode is history', async () => {
      // select a cell
      await helper.clickButton('history');
      expect(await helper.getButtonOrNull('Close history')).not.toBeNull();
    });
  });

  describe('If a board cell is selected', () => {
    it('The main action should be save/unselect', async () => {
      // select a cell
      fixture.debugElement
        .query(By.css('app-board mat-card'))
        .triggerEventHandler('click');

      expect(component.pendingSelectCount()).toBe(1);
      expect(await helper.getButtonOrNull('edit')).toBeNull();
      expect(await helper.getButtonOrNull(/Save \(1\)*/)).not.toBeNull();
      expect(await helper.getButtonOrNull(/Unselect*/)).not.toBeNull();

      // unselect the same cell
      fixture.debugElement
        .query(By.css('app-board mat-card'))
        .triggerEventHandler('click');

      expect(component.pendingSelectCount()).toBe(0);
      expect(await loader.getHarnessOrNull(MatMenuHarness)).not.toBeNull();
    });

    it('The history button should be disabled', async () => {
      // select a cell
      fixture.debugElement
        .query(By.css('app-board mat-card'))
        .triggerEventHandler('click');

      expect(component.pendingSelectCount()).toBe(1);
      expect(
        await (await helper.getButtonOrNull('history'))?.isDisabled()
      ).toBeTrue();
    });

    it('Unselect should work', async () => {
      fixture.debugElement
        .query(By.css('app-board mat-card'))
        .triggerEventHandler('click');

      expect(component.pendingSelectCount()).toBe(1);

      await helper.clickButton(/Unselect*/);

      expect(component.pendingSelectCount()).toBe(0);
    });

    it('Save label should update based on how many cells are selected', async () => {
      fixture.debugElement
        .queryAll(By.css('app-board mat-card'))
        .slice(0, 3)
        .forEach((c) => c.triggerEventHandler('click'));

      expect(await helper.getButtonOrNull(/Save \(3\)*/)).not.toBeNull();
    });
  });

  describe('Color of board cell should change after save to', () => {
    async function test(
      gridMode: 'grid' | 'list',
      clickFirstX: number,
      expectedEndColor: 'yellow' | 'green'
    ) {
      const boardSelector =
        gridMode === 'grid' ? 'app-board' : 'app-board-list-view';
      const endColorClass = `.bg-${expectedEndColor}`;

      component.gridMode.set(gridMode);
      await fixture.whenStable();

      fixture.debugElement
        .queryAll(By.css(boardSelector + ' mat-card'))
        .slice(0, clickFirstX)
        .forEach((x) => x.triggerEventHandler('click'));

      await fixture.whenStable();

      expect(
        fixture.debugElement.queryAll(By.css(boardSelector + ' .bg-blue'))
      ).toHaveSize(clickFirstX);

      expect(
        fixture.debugElement.queryAll(
          By.css(`${boardSelector} ${endColorClass}`)
        )
      ).toHaveSize(0);

      await helper.saveSelected();

      expect(
        fixture.debugElement.queryAll(By.css(boardSelector + ' .bg-blue'))
      ).toHaveSize(0);

      expect(
        fixture.debugElement.queryAll(
          By.css(`${boardSelector} ${endColorClass}`)
        )
      ).toHaveSize(clickFirstX);
    }

    it('yellow if cell is not in bingo pattern in grid view', async () => {
      await test('grid', 1, 'yellow');
    });

    it('yellow if cell is not in bingo pattern in list view', async () => {
      await test('list', 1, 'yellow');
    });

    it('green if cell is in bingo pattern in grid view', async () => {
      await test('grid', 3, 'green');
    });

    it('yellow if cell is in bingo pattern in list view', async () => {
      await test('list', 3, 'green');
    });
  });

  it('clicking delete should delete the board and navigate the user away from the page', async () => {
    const navigateSpy = spyOn((component as any).router, 'navigate');
    const dialogSpy = spyOn((component as any).dialog, 'open');
    dialogSpy.and.returnValue({
      afterClosed: () => of(true),
    });

    await (
      await loader.getHarness(MatMenuHarness)
    ).clickItem({ text: new RegExp('Delete', 'g') });

    expect(navigateSpy).toHaveBeenCalledOnceWith(['board/create']);
  });

  describe('During editing', () => {
    beforeEach(async () => {
      await helper.editBoard();
    });

    it('edit button should toggle to save and cancel', async () => {
      expect(await loader.getHarnessOrNull(MatMenuHarness)).toBeNull();
      expect(await helper.getButtonOrNull(/Cancel */)).not.toBeNull();
      expect(await helper.getButtonOrNull(/Save */)).not.toBeNull();

      await helper.clickButton(/Cancel */);

      expect(await loader.getHarnessOrNull(MatMenuHarness)).not.toBeNull();
    });

    it("clicking 'add deadline' should disable all inputs and buttons except cancel", async () => {
      await (
        await loader.getHarness(
          MatButtonHarness.with({ selector: "[aria-label='Add deadline'" })
        )
      ).click();

      // mat-form-field:not(.mat-form-field-disabled)
      // covers select, input, datepicker, timepicker, and at this point I'm not really using other form input types
      const enabledFormFields = fixture.debugElement
        .queryAll(By.css('mat-form-field:not(.mat-form-field-disabled)'))
        .map((x) => x.nativeElement.outerHTML);

      enabledFormFields.forEach((f) => expect(f).toContain('Deadline'));

      // checkboxes are not inside mat-form-fields
      const checkboxes = await loader.getAllHarnesses(MatCheckboxHarness);
      for await (const cb of checkboxes) {
        expect(await cb.isDisabled()).toBe(true);
      }

      // in list view there would be the group by buttons as well
      const enabledButtonlabels = fixture.debugElement
        .queryAll(
          By.css('button:not([disabled]):not([aria-label="Open calendar"]')
        )
        .map((x) => x.nativeElement.textContent);

      expect(enabledButtonlabels.length).not.toBe(0);
      enabledButtonlabels.forEach((l) => expect(l).toContain('Cancel'));
    });
  });

  describe('Completion tests', () => {
    class DialogHelper {
      dialog: MatDialogHarness | undefined;

      async setActiveDialog() {
        this.dialog = await rootLoader.getHarness(MatDialogHarness);
      }

      async getButton(text: string) {
        return await this.dialog?.getHarness(
          MatButtonHarness.with({ text: text })
        );
      }

      async clickButton(text: string) {
        await (await this.getButton(text))?.click();
      }
    }

    let dialogHelper: DialogHelper;

    beforeEach(() => {
      dialogHelper = new DialogHelper();
    });

    it("Switching game mode to traditional when a bingo was reached should trigger the completion dialog if traditional mode wasn't completed yet", async () => {
      const board = new BoardInfo({
        Visibility: 'local',
        GameMode: 'todo',
        Cells: BoardCalculations.getRowIndexes(9).map((i) => {
          return new BoardCell(
            {
              Name: i.toString(),
              CheckedAtUtc: i < 3 ? new Date() : null,
            },
            i,
            3
          );
        }),
      });

      await helper.setBoard(board);
      await helper.editBoard();
      component.boardForm.controls.GameMode.setValue('traditional');

      await helper.saveEdit();
      await dialogHelper.setActiveDialog();

      expect(dialogHelper.dialog).not.toBeNull();
      expect(await dialogHelper.dialog!.getTitleText()).toEqual(
        'Finishing the game'
      );
    });

    it("Switching game mode to traditional when a bingo was reached shouldn't trigger the completion dialog if traditional mode was completed before", async () => {
      const board = new BoardInfo({
        Visibility: 'local',
        GameMode: 'todo',
        TraditionalGame: {
          CompletedAtUtc: new Date(),
          CompletedByGameModeSwitch: false,
          CompletionDeadlineUtc: null,
          CompletionReward: null,
        },
        Cells: BoardCalculations.getRowIndexes(9).map((i) => {
          return new BoardCell(
            {
              Name: i.toString(),
              CheckedAtUtc: i < 3 ? new Date() : null,
            },
            i,
            3
          );
        }),
      });
      await helper.setBoard(board);
      await helper.editBoard();

      component.boardForm.controls.GameMode.setValue('traditional');

      await helper.saveEdit();

      const warnDialog = await rootLoader.getHarnessOrNull(MatDialogHarness);
      expect(warnDialog).toBeNull();
    });

    for (const testParam of [
      { gameMode: 'traditional', selectIfLessThan: 3 } as const,
      { gameMode: 'todo', selectIfLessThan: 10 } as const,
    ]) {
      it(`If a ${testParam.gameMode} game is about to complete after save, show the completion dialog`, async () => {
        const board = new BoardInfo({
          Visibility: 'local',
          GameMode: testParam.gameMode,
          Cells: BoardCalculations.getRowIndexes(9).map((i) => {
            const c = new BoardCell(
              {
                Name: i.toString(),
              },
              i,
              3
            );
            c.Selected = i < testParam.selectIfLessThan;
            return c;
          }),
        });
        await helper.setBoard(board);
        await helper.saveSelected();
        await dialogHelper.setActiveDialog();

        expect(await dialogHelper.dialog!.getTitleText()).toEqual(
          'Finishing the game'
        );
      });
    }

    it('The user should be able to modify the reward for the game mode in the completion dialog', async () => {
      const board = new BoardInfo({
        Visibility: 'local',
        GameMode: 'traditional',
        TraditionalGame: {
          CompletedAtUtc: null,
          CompletedByGameModeSwitch: undefined,
          CompletionDeadlineUtc: null,
          CompletionReward: 'an ice cream',
        },
        Cells: BoardCalculations.getRowIndexes(9).map((i) => {
          const c = new BoardCell(
            {
              Name: i.toString(),
            },
            i,
            3
          );
          c.Selected = false;
          return c;
        }),
      });

      BingoLocalStorage.createBoard(board);

      board.Cells.slice(0, 3).forEach((c) => (c.Selected = true));

      const localSaveService = spyOn(
        BingoLocalStorage,
        'saveSelection'
      ).and.returnValue(of(board));

      await helper.setBoard(board);
      await helper.saveSelected();
      await dialogHelper.setActiveDialog();

      const rewardInput = await dialogHelper.dialog!.getHarness(
        MatInputHarness.with({ label: 'Completion reward' })
      );
      await rewardInput.setValue('a boba tea');

      await dialogHelper.clickButton('Save');
      await helper.wait();

      expect(localSaveService).toHaveBeenCalledOnceWith(
        jasmine.objectContaining({
          TraditionalGame: {
            CompletedAtUtc: null,
            CompletedByGameModeSwitch: undefined,
            CompletionDeadlineUtc: null,
            CompletionReward: 'a boba tea',
          },
        }),
        [0, 1, 2],
        jasmine.any(Object)
      );
    });

    it('After completing a traditional game, the user should be able to continue in todo mode with one click in the dialog', async () => {
      const board = new BoardInfo({
        Visibility: 'local',
        GameMode: 'traditional',
        TraditionalGame: {
          CompletedAtUtc: null,
          CompletedByGameModeSwitch: false,
          CompletionDeadlineUtc: null,
          CompletionReward: null,
        },
        Cells: BoardCalculations.getRowIndexes(9).map((i) => {
          const c = new BoardCell(
            {
              Name: i.toString(),
            },
            i,
            3
          );
          c.Selected = i < 3;
          return c;
        }),
      });

      BingoLocalStorage.createBoard(board);

      await helper.setBoard(board);
      await helper.saveSelected();
      await dialogHelper.setActiveDialog();
      await dialogHelper.clickButton('Save');
      await helper.wait();
      await fixture.whenStable();
      expect(fixture.nativeElement.innerHTML).toContain('trophy');
      await dialogHelper.setActiveDialog();

      await dialogHelper.clickButton('Continue in TO-DO mode');
      await helper.wait();
      await fixture.whenStable();

      expect(component.board().GameMode).toBe('todo');
      expect(fixture.nativeElement.innerHTML).not.toContain('trophy');
    });
  });

  describe('after completion', () => {
    it('of a traditional game, the user should be able to switch to to-do mode during edit', async () => {
      const board = new BoardInfo({
        Visibility: 'local',
        GameMode: 'traditional',
        TraditionalGame: {
          CompletedAtUtc: new Date(),
          CompletedByGameModeSwitch: false,
          CompletionDeadlineUtc: null,
          CompletionReward: null,
        },
        Cells: BoardCalculations.getRowIndexes(9).map(
          (i) =>
            new BoardCell(
              {
                Name: i.toString(),
                CheckedAtUtc: new Date(),
              },
              i,
              3
            )
        ),
      });

      await helper.setBoard(board);
      await helper.editBoard();

      const gameModeInput = await loader.getHarness(
        MatSelectHarness.with({ label: 'Game mode' })
      );
      expect(await gameModeInput.isDisabled()).toBeFalse();
      await gameModeInput.open();
      expect(await (await gameModeInput.getOptions())[1].getText()).toContain(
        'To-do'
      );
      expect(
        await (await gameModeInput.getOptions())[1].isDisabled()
      ).toBeFalse();
    });

    it('of a traditional game, traditional mode should be disabled in edit mode after the first check', async () => {
      const board = new BoardInfo({
        Visibility: 'local',
        GameMode: 'traditional',
        TraditionalGame: {
          CompletedAtUtc: new Date(),
          CompletedByGameModeSwitch: false,
          CompletionDeadlineUtc: null,
          CompletionReward: 'test',
        },
        Cells: BoardCalculations.getRowIndexes(9).map(
          (i) =>
            new BoardCell(
              {
                Name: i.toString(),
                CheckedAtUtc: i < 3 ? new Date() : null,
              },
              i,
              3
            )
        ),
      });

      BingoLocalStorage.createBoard(board);
      const completedBoard = await firstValueFrom(
        BingoLocalStorage.saveSelection(
          board,
          [0, 1, 2],
          new BoardCalculations()
        )
      );

      if (completedBoard === false) {
        expect(completedBoard).toBeTruthy();
        return;
      }
      await helper.setBoard(completedBoard);

      // check that all game mode options are enabled to start with
      await helper.editBoard();
      let gameModeInput = await loader.getHarness(
        MatSelectHarness.with({ label: 'Game mode' })
      );
      await gameModeInput.open();
      let options = await gameModeInput.getOptions();
      for await (const option of options) {
        expect(await option.isDisabled()).toBeFalse();
      }

      await (await gameModeInput.getOptions())[1].click();

      await helper.clickButton(/Save */);

      // check that it's still enabled after switching game mode
      await helper.editBoard();
      gameModeInput = await loader.getHarness(
        MatSelectHarness.with({ label: 'Game mode' })
      );
      await gameModeInput.open();
      options = await gameModeInput.getOptions();
      for await (const option of options) {
        expect(await option.isDisabled()).toBeFalse();
      }

      await helper.clickButton(/Cancel */);

      // check a cell and save it
      fixture.debugElement
        .query(By.css('app-board mat-card:not(.bg-green)'))
        .triggerEventHandler('click');

      await helper.saveSelected();

      // now the traditional option should be disabled
      await helper.editBoard();
      gameModeInput = await loader.getHarness(
        MatSelectHarness.with({ label: 'Game mode' })
      );
      await gameModeInput.open();
      options = await gameModeInput.getOptions();
      for await (const option of options) {
        if ((await option.getText()).includes('Traditional')) {
          expect(await option.isDisabled()).toBeTrue();
        } else {
          expect(await option.isDisabled()).toBeFalse();
        }
      }
    });

    it("of a game mode, deadline and reward shouldn't be editable for it", async () => {
      const board = new BoardInfo({
        Visibility: 'local',
        GameMode: 'traditional',
        TraditionalGame: {
          CompletedAtUtc: new Date(),
          CompletedByGameModeSwitch: false,
          CompletionDeadlineUtc: null,
          CompletionReward: 'test',
        },
        Cells: BoardCalculations.getRowIndexes(9).map(
          (i) =>
            new BoardCell(
              {
                Name: i.toString(),
                CheckedAtUtc: i < 3 ? new Date() : null,
              },
              i,
              3
            )
        ),
      });

      await helper.setBoard(board);
      await helper.editBoard();

      const rewardInput = await loader.getHarnessOrNull(
        MatInputHarness.with({ label: 'Completion reward' })
      );
      expect(await rewardInput).toBeNull();
      expect(fixture.nativeElement.innerHTML).toContain('Completion reward');

      expect(
        await (
          await loader.getHarnessOrNull(
            MatButtonHarness.with({ selector: "[aria-label='Add deadline'" })
          )
        )?.isDisabled()
      ).toBeTrue();
    });

    it('of a game mode, deadline and reward inputs should appear once game mode is switched to a non-completed one', async () => {
      const board = new BoardInfo({
        Visibility: 'local',
        GameMode: 'traditional',
        TraditionalGame: {
          CompletedAtUtc: new Date(),
          CompletedByGameModeSwitch: false,
          CompletionDeadlineUtc: null,
          CompletionReward: 'test',
        },
        Cells: BoardCalculations.getRowIndexes(9).map(
          (i) =>
            new BoardCell(
              {
                Name: i.toString(),
                CheckedAtUtc: i < 3 ? new Date() : null,
              },
              i,
              3
            )
        ),
      });

      await helper.setBoard(board);
      await helper.editBoard();
      const gameModeInput = await loader.getHarness(
        MatSelectHarness.with({ label: 'Game mode' })
      );
      await gameModeInput.open();
      await (await gameModeInput.getOptions())[1].click();

      const rewardInput = await loader.getHarnessOrNull(
        MatInputHarness.with({ label: 'Completion reward' })
      );
      expect(await rewardInput).not.toBeNull();

      expect(
        await (
          await loader.getHarnessOrNull(
            MatButtonHarness.with({ selector: "[aria-label='Add deadline'" })
          )
        )?.isDisabled()
      ).toBeFalse();

      await rewardInput?.setValue('todo reward');
      await helper.saveEdit();

      expect(component.board().GameMode).toBe('todo');
      expect(component.board().TraditionalGame.CompletionReward).toBe('test');
      expect(component.board().TodoGame.CompletionReward).toBe('todo reward');
    });
  });

  describe('when history is shown', () => {
    it("the grid shouldn't be visible and the grid mode toggle should be disabled", async () => {
      await helper.clickButton('history');
      expect(fixture.debugElement.query(By.css('app-board'))).toBeFalsy();
      expect(await (await helper.getButton('list')).isDisabled()).toBeTrue();
    });

    it('the timeline should be shown', async () => {
      await helper.clickButton('history');
      expect(fixture.nativeElement.outerHTML).toContain('Created board');
    });

    it('clicking history again should close it', async () => {
      await helper.clickButton('history');
      await helper.clickButton('history');
      expect(fixture.nativeElement.outerHTML).not.toContain('Created board');
    });

    it('clicking close history should close it', async () => {
      await helper.clickButton('history');
      await helper.clickButton('Close history');
      expect(fixture.nativeElement.outerHTML).not.toContain('Created board');
    });
  });

  it('should update history as expected', async () => {
    // select a cell
    fixture.debugElement
      .query(By.css('app-board mat-card'))
      .triggerEventHandler('click');

    await helper.clickButton(/Save */);

    await helper.clickButton('history');

    expect(fixture.nativeElement.outerHTML).toContain('Checked 1/9');

    await helper.clickButton('Close history');

    fixture.debugElement
      .query(By.css('app-board mat-card:not(.bg-yellow)'))
      .triggerEventHandler('click');

    await fixture.whenStable();

    fixture.debugElement
      .query(By.css('app-board mat-card:not(.bg-yellow):not(.bg-blue)'))
      .triggerEventHandler('click');

    await helper.clickButton(/Save */);

    await helper.clickButton('history');

    expect(fixture.nativeElement.outerHTML).toContain('First strike');
  });

  // TODO tests:
  // check icons in case the toolbar is here to stay
  // save tests with BingoApi
});

class Helper {
  private fixture;
  private loader;

  constructor(fixture: ComponentFixture<BoardPage>, loader: HarnessLoader) {
    this.fixture = fixture;
    this.loader = loader;
  }
  async wait(forMs: number = 80) {
    await new Promise((resolve) => setTimeout(resolve, forMs));
  }

  async saveSelected() {
    await (await this.getButton(/Save */)).click();
  }

  async saveEdit() {
    await (await this.getButton('Save')).click();
  }

  async editBoard() {
    await (
      await this.loader.getHarness(MatMenuHarness)
    ).clickItem({ text: new RegExp('Edit', 'g') });
  }

  async setBoard(board: BoardInfo) {
    this.fixture.componentRef.setInput('board', board);
  }

  async getButton(text: string | RegExp) {
    return await this.loader.getHarness(MatButtonHarness.with({ text: text }));
  }

  async clickButton(text: string | RegExp) {
    await (
      await this.loader.getHarness(MatButtonHarness.with({ text: text }))
    ).click();
  }

  async getButtonOrNull(text: string | RegExp) {
    return await this.loader.getHarnessOrNull(
      MatButtonHarness.with({ text: text })
    );
  }
}
