import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeadlineRewardForm } from './deadline-reward-form';
import { provideZonelessChangeDetection } from '@angular/core';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatTimepickerInputHarness } from '@angular/material/timepicker/testing';
import { MatDatepickerInputHarness } from '@angular/material/datepicker/testing';
import { calculateDateFromNow } from '../calculations/date-calculations';
import { boardForm } from '../board-details-form/form';
import { MatErrorHarness } from '@angular/material/form-field/testing';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatInputHarness } from '@angular/material/input/testing';

describe('DeadlineRewardForm', () => {
  let component: DeadlineRewardForm;
  let fixture: ComponentFixture<DeadlineRewardForm>;
  let loader: HarnessLoader;

  beforeEach(async () => {
    boardForm.reset();
    // in theory each test ends with this being re-enabled, but I still ran into issues
    boardForm.enable();

    await TestBed.configureTestingModule({
      imports: [DeadlineRewardForm],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(DeadlineRewardForm);
    fixture.componentRef.setInput('gameMode', 'traditional');
    component = fixture.componentInstance;
    loader = TestbedHarnessEnvironment.loader(fixture);
  });

  it('should create', async () => {
    fixture.componentRef.setInput('createMode', true);
    await fixture.whenStable();

    expect(component).toBeTruthy();
  });

  describe('create mode', () => {
    let timepicker: MatTimepickerInputHarness;
    let datepicker: MatDatepickerInputHarness;

    beforeEach(async () => {
      fixture.componentRef.setInput('createMode', true);
      fixture.autoDetectChanges();

      timepicker = await loader.getHarness(MatTimepickerInputHarness);
      datepicker = await loader.getHarness(MatDatepickerInputHarness);
    });

    it('should display the deadline inputs in create mode', async () => {
      expect(await timepicker.isDisabled()).toBe(true);
      expect(await datepicker.isDisabled()).toBe(false);
    });

    it('should enable timepicker if date is set', async () => {
      expect(await setDateToMinimum(datepicker)).toEqual(
        calculateDateFromNow(15).toLocaleDateString()
      );
      expect(await timepicker.isDisabled()).toBe(false);
    });

    it('the deadline date picker should have the date of 15 minutes from now as min date', async () => {
      expect(await datepicker.getMin()).toEqual(
        calculateDateFromNow(15).toISOString().substring(0, 10)
      );
    });

    it('the deadline time picker should have the min time of 15 minutes from now if the date is today', async () => {
      await setDateToMinimum(datepicker);

      expect(await timepicker.getValue()).toEqual(
        calculateDateFromNow(15).toTimeString().substring(0, 5)
      );
    });

    it('the deadline time picker should have the min time of 00:00 if the date is not today', async () => {
      expect(await setDateToFuture(datepicker)).not.toEqual(
        calculateDateFromNow(15).toLocaleDateString()
      );
      expect(await timepicker.getValue()).toEqual('00:00');
    });

    it('the timepicker should warn the user if they entered an invalid date', async () => {
      await setDateToMinimum(datepicker);
      await timepicker.setValue('25:40');
      await timepicker.blur();
      expect(await timepicker.getValue()).toEqual('25:40');

      const matError = await loader.getHarness(MatErrorHarness);
      expect(await matError.getText()).toContain('Please enter a valid time');
    });

    describe("if the timepicker is cleared, don't clear the date as well, instead fall back", () => {
      it('to 00:00 if the date is not today', async () => {
        await setDateToFuture(datepicker);

        await timepicker.setValue('23:30');
        await timepicker.blur();
        expect(await timepicker.getValue()).toEqual('23:30');

        await timepicker.setValue('');
        await timepicker.blur();
        expect(await timepicker.getValue()).toEqual('00:00');
      });

      it('to min time if the date is today', async () => {
        await setDateToMinimum(datepicker);

        // this can fail if run around midnight :/
        await timepicker.setValue('23:59');
        await timepicker.blur();
        expect(await timepicker.getValue()).toEqual('23:59');

        await timepicker.setValue('');
        await timepicker.blur();

        expect(await timepicker.getValue()).toEqual(
          calculateDateFromNow(15).toTimeString().substring(0, 5)
        );
      });
    });

    it('the timepicker should not modify the date', async () => {
      await setDateToFuture(datepicker);
      const fullDate = component
        .gameModeForm()
        .getRawValue().CompletionDeadlineUtc;
      await timepicker.setValue('12:10');
      await timepicker.blur();
      expect(await datepicker.getValue()).toEqual(
        fullDate?.toLocaleDateString() as string
      );

      const fullTime = component
        .gameModeForm()
        .getRawValue().CompletionDeadlineUtc;

      expect(fullTime?.toTimeString().substring(0, 5)).toEqual('12:10');
    });

    it('the user should be able to remove the deadline by clearing the date', async () => {
      await setDateToFuture(datepicker);

      await timepicker.setValue('23:30');
      await timepicker.blur();
      expect(await timepicker.getValue()).toEqual('23:30');

      await datepicker.setValue('');
      await datepicker.blur();
      expect(
        component.gameModeForm().getRawValue().CompletionDeadlineUtc
      ).toBeNull();
    });

    it("Deadline and reward shouldn't change between game mode switches in create mode", async () => {
      await setDateToFuture(datepicker);
      await testDeadlineRewardSwitch(loader, component, fixture);
    });
  });

  describe('edit mode', () => {
    beforeEach(async () => {
      fixture.componentRef.setInput('createMode', false);
      fixture.autoDetectChanges();
    });

    it('deadline inputs should not be shown', async () => {
      expect(
        (await loader.getAllHarnesses(MatTimepickerInputHarness)).length
      ).toBe(0);
      expect(
        (await loader.getAllHarnesses(MatDatepickerInputHarness)).length
      ).toBe(0);
    });

    it('if canOnlyRemove false, adding deadline should be possible', async () => {
      const button = await loader.getHarness(
        MatButtonHarness.with({ text: 'add' })
      );
      await button.click();

      expect(
        (await loader.getAllHarnesses(MatTimepickerInputHarness)).length
      ).toBe(1);
      expect(
        (await loader.getAllHarnesses(MatDatepickerInputHarness)).length
      ).toBe(1);
    });

    it('completion reward input should be disabled when in deadline add mode', async () => {
      const button = await loader.getHarness(
        MatButtonHarness.with({ text: 'add' })
      );
      const input = await loader.getHarness(
        MatInputHarness.with({ label: 'Completion reward' })
      );

      expect(await input.isDisabled()).toBeFalse();

      await button.click();

      expect(await input.isDisabled()).toBeTrue();

      const cancelButton = await loader.getHarness(
        MatButtonHarness.with({ text: 'Cancel deadline' })
      );

      await cancelButton.click();

      expect(await input.isDisabled()).toBeFalse();
    });

    it('if canOnlyRemove false, user should be able to set and remove a deadline', async () => {
      // click add
      const button = await loader.getHarness(
        MatButtonHarness.with({ text: 'add' })
      );

      await button.click();

      // set date
      const datepicker = await loader.getHarness(MatDatepickerInputHarness);

      const saveButton = await loader.getHarness(
        MatButtonHarness.with({ text: 'Set deadline' })
      );

      expect(await saveButton.isDisabled()).toBeTrue();

      await setDateToMinimum(datepicker);

      expect(await saveButton.isDisabled()).toBeFalse();

      // click save
      await saveButton.click();

      expect(
        await loader.getHarnessOrNull(MatDatepickerInputHarness)
      ).toBeNull();

      // remove deadline
      const removeButton = await loader.getHarness(
        MatButtonHarness.with({ text: 'close_small' })
      );

      await removeButton.click();

      expect(
        component.gameModeForm().getRawValue().CompletionDeadlineUtc
      ).toBeNull();
    });

    it("if there's a completion date for the game mode, the user should only be able to remove the deadline", async () => {
      component
        .gameModeForm()
        .controls.CompletionDateUtc.setValue(calculateDateFromNow(-1));
      component
        .gameModeForm()
        .controls.CompletionDeadlineUtc.setValue(calculateDateFromNow(16));
      await fixture.whenStable();

      const removeButton = await loader.getHarness(
        MatButtonHarness.with({ text: 'close_small' })
      );

      await removeButton.click();

      const button = await loader.getHarness(
        MatButtonHarness.with({ text: 'add' })
      );

      expect(fixture.nativeElement.outerHTML).toContain('No deadline');
      expect(await button.isDisabled()).toBeTrue();
    });

    it("if there's a completion date for the game mode, the user should only be able to remove the reward", async () => {
      component
        .gameModeForm()
        .controls.CompletionDateUtc.setValue(calculateDateFromNow(-1));
      component
        .gameModeForm()
        .controls.CompletionReward.setValue('a day at the zoo');
      await fixture.whenStable();

      const removeButton = await loader.getHarness(
        MatButtonHarness.with({ text: 'close_small' })
      );

      expect(fixture.nativeElement.outerHTML).toContain('Completion reward');
      await removeButton.click();

      expect(
        component.gameModeForm().getRawValue().CompletionDeadlineUtc
      ).toBeNull();
      expect(fixture.nativeElement.outerHTML).not.toContain(
        'Completion reward'
      );
      expect(
        await loader.getHarnessOrNull(
          MatInputHarness.with({ label: 'Completion reward' })
        )
      ).toBeNull();

      expect(fixture.nativeElement.outerHTML).toContain('No reward');
    });

    it("Deadline and reward shouldn't change between game mode switches in create mode", async () => {
      // set a deadline
      const button = await loader.getHarness(
        MatButtonHarness.with({ text: 'add' })
      );

      await button.click();

      const datepicker = await loader.getHarness(MatDatepickerInputHarness);
      await setDateToFuture(datepicker);

      const saveButton = await loader.getHarness(
        MatButtonHarness.with({ text: 'Set deadline' })
      );

      await saveButton.click();

      // test the switches
      await testDeadlineRewardSwitch(loader, component, fixture);
    });

    it('Deadline and reward should change between game mode switches if completed traditional mode', async () => {
      // I'm not really sure why, but in this test not only do I not need the whenStable calls,
      // I actually get 'Uncaught RangeError: Maximum call stack size exceeded thrown' if I include them
      boardForm.patchValue({
        TraditionalGame: {
          CompletionReward: 'Traditional reward',
          CompletionDeadlineUtc: null,
          CompletionDateUtc: new Date(),
        },
      });

      // runtime change of gameMode
      fixture.componentRef.setInput('gameMode', 'todo');
      // await fixture.whenStable();

      // set Todo's reward and deadline
      const input = await loader.getHarness(
        MatInputHarness.with({ label: 'Completion reward' })
      );

      await input.setValue('a day at the zoo');

      const button = await loader.getHarness(
        MatButtonHarness.with({ text: 'add' })
      );
      await button.click();

      const datepicker = await loader.getHarness(MatDatepickerInputHarness);
      await setDateToFuture(datepicker);

      const saveButton = await loader.getHarness(
        MatButtonHarness.with({ text: 'Set deadline' })
      );

      await saveButton.click();

      expect(
        component.gameModeForm().getRawValue().CompletionDeadlineUtc
      ).not.toBeNull();

      expect(component.gameModeForm().getRawValue().CompletionReward).toBe(
        'a day at the zoo'
      );

      // switch back to traditional game mode
      fixture.componentRef.setInput('gameMode', 'traditional');
      // await fixture.whenStable();

      // traditional reward and input shouldn't have been altered
      expect(component.gameModeForm().getRawValue().CompletionReward).toBe(
        'Traditional reward'
      );

      expect(
        component.gameModeForm().getRawValue().CompletionDeadlineUtc
      ).toBeNull();
    });
  });
});

async function setDateToMinimum(
  datepicker: MatDatepickerInputHarness
): Promise<string> {
  await datepicker.setValue('2');
  return await datepicker.getValue();
}

async function setDateToFuture(
  datepicker: MatDatepickerInputHarness
): Promise<string> {
  await datepicker.openCalendar();
  const calendar = await datepicker.getCalendar();
  await calendar.next();
  const dateCell = (await calendar.getCells())[0];
  await dateCell.select();
  return await datepicker.getValue();
}

async function testDeadlineRewardSwitch(
  loader: HarnessLoader,
  component: DeadlineRewardForm,
  fixture: ComponentFixture<DeadlineRewardForm>
) {
  const input = await loader.getHarness(
    MatInputHarness.with({ label: 'Completion reward' })
  );

  await input.setValue('a day at the zoo');

  expect(component.gameModeForm().getRawValue().CompletionReward).toBe(
    'a day at the zoo'
  );

  const deadlineDate = component
    .gameModeForm()
    .getRawValue().CompletionDeadlineUtc;

  // switch game mode and expect the control values to be the same as set before switch
  fixture.componentRef.setInput('gameMode', 'todo');
  await fixture.whenStable();

  expect(component.gameModeForm().getRawValue().CompletionReward).toBe(
    'a day at the zoo'
  );

  expect(component.gameModeForm().getRawValue().CompletionDeadlineUtc).toEqual(
    deadlineDate
  );

  // modify reward and switch again to test the same
  await input.setValue('another day at the zoo');

  fixture.componentRef.setInput('gameMode', 'todo');
  await fixture.whenStable();

  expect(component.gameModeForm().getRawValue().CompletionReward).toBe(
    'another day at the zoo'
  );
}
