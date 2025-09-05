import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BoardSetup } from './board-setup';
import { provideZonelessChangeDetection } from '@angular/core';
import { BingoApi } from '../../features/persistence/bingo-api';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import {
  MatStepHarness,
  MatStepperHarness,
  MatStepperNextHarness,
} from '@angular/material/stepper/testing';
import { MatInputHarness } from '@angular/material/input/testing';
import { MatSelectHarness } from '@angular/material/select/testing';
import { BoardCalculations } from '../../features/calculations/board-calculations';
import { By } from '@angular/platform-browser';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialogHarness } from '@angular/material/dialog/testing';
import { of } from 'rxjs';
import { BingoLocalStorage } from '../../features/persistence/bingo-local';
import { User } from '../../core/auth/user';

describe('BoardSetup', () => {
  let component: BoardSetup;
  let fixture: ComponentFixture<BoardSetup>;
  let loader: HarnessLoader;
  let rootLoader: HarnessLoader;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BoardSetup],
      providers: [
        provideZonelessChangeDetection(),
        {
          provide: BingoApi,
          useValue: jasmine.createSpyObj<BingoApi>(['createBoard']),
        },
        {
          provide: User,
          useValue: jasmine.createSpyObj<User>('user', [], ['user$']),
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BoardSetup);
    rootLoader = TestbedHarnessEnvironment.documentRootLoader(fixture);
    loader = TestbedHarnessEnvironment.loader(fixture);
    component = fixture.componentInstance;
    fixture.autoDetectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('filling out cells', () => {
    let step2nextButton: MatStepperNextHarness;
    let cellsStep: MatStepHarness;

    async function geCellInputs() {
      return loader.getAllHarnesses(MatInputHarness.with({ label: /Row*/ }));
    }

    beforeEach(async () => {
      const stepper = await loader.getHarness(MatStepperHarness);
      const steps = await stepper.getSteps();
      cellsStep = steps[1];
      await cellsStep.select();
      step2nextButton = await cellsStep.getHarness(MatStepperNextHarness);
    });

    it('is mandatory before progressing', async () => {
      expect(
        await (await step2nextButton.host()).getAttribute('disabled')
      ).toBe('true');
    });

    it("inputs shouldn't only contain whitespace", async () => {
      const inputs = await geCellInputs();

      for await (const [idx, input] of inputs.entries()) {
        const charToAdd =
          idx % 3 === 0
            ? ' \t &nbsp;\r\n|\n|\rs'
            : idx % 5 === 0
            ? '\xa0  \u202f\u0009\u0020\u00a0'
            : ''.padStart(idx);
        await input.setValue(charToAdd);
      }

      expect(
        await (await step2nextButton.host()).getAttribute('disabled')
      ).toBe('true');
    });

    it('next button should be clickable once all cells filled properly', async () => {
      const inputs = await geCellInputs();

      for await (const input of inputs) {
        await input.setValue('a');
      }

      expect(
        await (await step2nextButton.host()).getAttribute('disabled')
      ).toBe(null);
    });

    it('number of inputs should be adjusted with board size', async () => {
      let inputs = await geCellInputs();

      expect(inputs.length).toBe(9);

      const boardSizeSelect = await loader.getHarness(
        MatSelectHarness.with({ label: 'Board size' })
      );
      await boardSizeSelect.clickOptions({ text: '4x4' });

      inputs = await geCellInputs();

      expect(inputs.length).toBe(16);
    });

    it('when increasing board size, added inputs should be untouched', async () => {
      let inputs = await geCellInputs();

      for await (const [idx, input] of inputs.entries()) {
        await input.setValue(idx.toString());
      }

      const boardSizeSelect = await loader.getHarness(
        MatSelectHarness.with({ label: 'Board size' })
      );
      await boardSizeSelect.clickOptions({ text: '4x4' });

      expect(component.cardsFormArray.getRawValue().map((c) => c.Name)).toEqual(
        BoardCalculations.getRowIndexes(16).map((x, idx) =>
          idx < 9 ? x.toString() : null
        )
      );
    });

    it('when decreasing board size, only the first x should be kept', async () => {
      const boardSizeSelect = await loader.getHarness(
        MatSelectHarness.with({ label: 'Board size' })
      );
      await boardSizeSelect.clickOptions({ text: '5x5' });
      let inputs = await geCellInputs();

      for await (const [idx, input] of inputs.entries()) {
        await input.setValue(idx.toString());
      }

      expect(component.cardsFormArray.getRawValue().map((c) => c.Name)).toEqual(
        BoardCalculations.getRowIndexes(25).map((x) => x.toString())
      );

      await boardSizeSelect.clickOptions({ text: '3x3' });

      expect(component.cardsFormArray.getRawValue().map((c) => c.Name)).toEqual(
        BoardCalculations.getRowIndexes(9).map((x, idx) =>
          idx < 9 ? x.toString() : null
        )
      );
    });

    it('when focusing one input, it should be indicated on the board', async () => {
      let inputs = await geCellInputs();

      await inputs[0].focus();

      expect(
        fixture.debugElement.queryAll(
          By.css('.mat-step:nth-of-type(2) .bg-blue')
        ).length
      ).toBe(1);
    });

    it('when hovering one input, it should be indicated on the board', async () => {
      let inputs = await geCellInputs();

      const firstInput = await inputs[0].host();
      await firstInput.dispatchEvent('mouseover');

      expect(
        fixture.debugElement.queryAll(
          By.css('.mat-step:nth-of-type(2) .bg-blue')
        ).length
      ).toBe(1);
    });

    it('when one input input is focused, keep highlighting it instead of another one being hovered', async () => {
      let inputs = await geCellInputs();
      await inputs[0].focus();

      const firstInput = await inputs[3].host();
      await firstInput.dispatchEvent('mouseover');

      expect(
        fixture.debugElement.queryAll(
          By.css('.mat-step:nth-of-type(2) mat-card:first-of-type.bg-blue')
        )
      ).toBeTruthy();
    });

    it('when a cell is filled out properly, it should be highligted in green', async () => {
      let inputs = await geCellInputs();
      await inputs[0].setValue('a');

      expect(
        fixture.debugElement.queryAll(
          By.css('.mat-step:nth-of-type(2) .bg-green')
        ).length
      ).toBe(1);
    });

    it("when a cell isn't filled out properly, it shouldn' be highligted in green", async () => {
      let inputs = await geCellInputs();
      await inputs[0].setValue('   ');

      expect(
        fixture.debugElement.queryAll(
          By.css('.mat-step:nth-of-type(2) .bg-green')
        ).length
      ).toBe(0);
    });
  });

  it('shuffle should reorder the given values', async () => {
    const originalOrder = BoardCalculations.getRowIndexes(9).map((i) => ({
      Name: i.toString(),
      Selected: false,
      Row: 0,
      Column: 0,
    }));
    component.cardsFormArray.patchValue(originalOrder);

    expect(component.cardsFormArray.getRawValue()).toEqual(originalOrder);

    const shuffleButton = await loader.getHarness(
      MatButtonHarness.with({ text: 'Shuffle' })
    );

    await shuffleButton.click();

    expect(component.cardsFormArray.getRawValue()).not.toEqual(originalOrder);
    expect(
      component.cardsFormArray
        .getRawValue()
        .map((c) => {
          c.Row = c.Column = 0;
          return c;
        })
        .sort((a, b) => (a?.Name ?? '').localeCompare(b?.Name ?? ''))
    ).toEqual(originalOrder);
  });

  it('should show the create warning dialog once create is clicked', async () => {
    component.cardsFormArray.patchValue(
      BoardCalculations.getRowIndexes(9).map((i) => ({
        Name: i.toString(),
        Selected: false,
        Row: 0,
        Column: 0,
      }))
    );

    expect(await rootLoader.getHarnessOrNull(MatDialogHarness)).toBeNull();

    const createButton = await loader.getHarness(
      MatButtonHarness.with({ text: 'Create' })
    );

    await createButton.click();

    const warnDialog = await rootLoader.getHarnessOrNull(MatDialogHarness);
    expect(warnDialog).not.toBeNull();
    expect(await warnDialog!.getTitleText()).toEqual(
      'Have you reviewed your cells?'
    );

    const cancelButton = await warnDialog!.getHarness(
      MatButtonHarness.with({ text: 'Cancel' })
    );

    await cancelButton.click();

    await new Promise((resolve) => setTimeout(resolve, 80));

    expect(await rootLoader.getHarnessOrNull(MatDialogHarness)).toBeNull();
  });

  it('once the board is created, it should navigate to local if visibility is local', async () => {
    component.cardsFormArray.patchValue(
      BoardCalculations.getRowIndexes(9).map((i) => ({
        Name: i.toString(),
        Selected: false,
        Row: 0,
        Column: 0,
      }))
    );
    component.boardForm.controls.Visibility.setValue('local');

    spyOn(BingoLocalStorage, 'createBoard');
    spyOn((component as any).dialog, 'open').and.returnValue({
      afterClosed: () => of(''),
    });

    const navigateSpy = spyOn((component as any).router, 'navigate');

    component.createBoard();

    expect(navigateSpy).toHaveBeenCalledOnceWith(['board/local']);
  });
});
