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
import { MatInputHarness } from '@angular/material/input/testing';

describe('BoardPage', () => {
  let component: BoardPage;
  let fixture: ComponentFixture<BoardPage>;
  let loader: HarnessLoader;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BoardPage],
      providers: [
        provideZonelessChangeDetection(),
        {
          provide: BingoApi,
          useValue: jasmine.createSpyObj<BingoApi>(['createBoard']),
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BoardPage);
    loader = TestbedHarnessEnvironment.loader(fixture);
    component = fixture.componentInstance;

    const board = new BoardInfo<BoardCell>(BingoLocalStorage.DefaultBoard);
    board.Cells = BoardCalculations.getRowIndexes(9).map(
      (i) => new BoardCell({ Name: i.toString() }, i, 3)
    );

    fixture.componentRef.setInput('board', board);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('Edit button should be visible by default', async () => {
    expect(
      await loader.getHarnessOrNull(MatButtonHarness.with({ text: 'edit' }))
    ).not.toBeNull();
  });

  it('Edit button should be toggled to save/unselect if a board cell is selected', async () => {
    // select a cell
    fixture.debugElement
      .query(By.css('app-board mat-card'))
      .triggerEventHandler('click');

    await fixture.whenStable();

    expect(component.pendingSelectCount()).toBe(1);

    expect(
      await loader.getHarnessOrNull(MatButtonHarness.with({ text: 'edit' }))
    ).toBeNull();

    expect(
      await loader.getHarnessOrNull(
        MatButtonHarness.with({ text: /Save \(1\)*/ })
      )
    ).not.toBeNull();

    expect(
      await loader.getHarnessOrNull(
        MatButtonHarness.with({ text: /Unselect*/ })
      )
    ).not.toBeNull();

    // unselect the same cell
    fixture.debugElement
      .query(By.css('app-board mat-card'))
      .triggerEventHandler('click');

    await fixture.whenStable();

    expect(component.pendingSelectCount()).toBe(0);

    expect(
      await loader.getHarnessOrNull(MatButtonHarness.with({ text: 'edit' }))
    ).not.toBeNull();
  });

  it('Unselect should work', async () => {
    fixture.debugElement
      .query(By.css('app-board mat-card'))
      .triggerEventHandler('click');

    await fixture.whenStable();

    expect(component.pendingSelectCount()).toBe(1);

    await (
      await loader.getHarnessOrNull(
        MatButtonHarness.with({ text: /Unselect*/ })
      )
    )?.click();

    expect(component.pendingSelectCount()).toBe(0);
  });

  it('Save label should update based on how many cells are selected', async () => {
    fixture.debugElement
      .queryAll(By.css('app-board mat-card'))
      .slice(0, 3)
      .forEach((c) => c.triggerEventHandler('click'));

    await fixture.whenStable();

    expect(
      await loader.getHarnessOrNull(
        MatButtonHarness.with({ text: /Save \(3\)*/ })
      )
    ).not.toBeNull();
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
          .length
      ).toBe(clickFirstX);

      expect(
        fixture.debugElement.queryAll(
          By.css(`${boardSelector} ${endColorClass}`)
        ).length
      ).toBe(0);

      await (
        await loader.getHarnessOrNull(MatButtonHarness.with({ text: /Save */ }))
      )?.click();

      await fixture.whenStable();

      expect(
        fixture.debugElement.queryAll(By.css(boardSelector + ' .bg-blue'))
          .length
      ).toBe(0);

      expect(
        fixture.debugElement.queryAll(
          By.css(`${boardSelector} ${endColorClass}`)
        ).length
      ).toBe(clickFirstX);
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

  describe('During editing', () => {
    beforeEach(async () => {
      await (
        await loader.getHarness(MatButtonHarness.with({ text: 'edit' }))
      ).click();
    });

    it('edit button should toggle to save and cancel', async () => {
      expect(
        await loader.getHarnessOrNull(
          MatButtonHarness.with({ text: /Cancel */ })
        )
      ).not.toBeNull();

      expect(
        await loader.getHarnessOrNull(MatButtonHarness.with({ text: /Save */ }))
      ).not.toBeNull();

      await (
        await loader.getHarness(MatButtonHarness.with({ text: /Cancel */ }))
      ).click();

      expect(
        await loader.getHarnessOrNull(MatButtonHarness.with({ text: 'edit' }))
      ).not.toBeNull();
    });

    it("selecting delete should switch the save label to 'delete'", async () => {
      await (
        await loader.getHarness(
          MatCheckboxHarness.with({ label: 'Delete board' })
        )
      ).check();

      expect(
        await loader.getHarnessOrNull(MatButtonHarness.with({ text: /Save */ }))
      ).toBeNull();

      expect(
        await loader.getHarnessOrNull(
          MatButtonHarness.with({ text: /Delete */ })
        )
      ).not.toBeNull();
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

  // TODO tests:
  // check computed values and methods
  // local visibility should store to localstorage, otherwise check that BingoApi is called
  // revertDeadlineAndRewardIfModifiedWithoutGameModeChange
  // generateEndStateMessage
  // delete
  // update
  // continueAfterBingo
});
