import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BoardDetailsForm } from './board-details-form';
import { provideZonelessChangeDetection } from '@angular/core';
import { BingoLocalStorage } from '../persistence/bingo-local';
import { MatSelectHarness } from '@angular/material/select/testing';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { boardForm } from './form';

describe('BoardDetailsForm', () => {
  let component: BoardDetailsForm;
  let fixture: ComponentFixture<BoardDetailsForm>;
  let loader: HarnessLoader;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BoardDetailsForm],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(BoardDetailsForm);
    fixture.componentRef.setInput('board', BingoLocalStorage.DefaultBoard);
    fixture.componentRef.setInput('createMode', true);
    fixture.componentRef.setInput('isLoggedIn', false);
    loader = TestbedHarnessEnvironment.loader(fixture);
    boardForm.reset();
    boardForm.enable();
    component = fixture.componentInstance;
    fixture.autoDetectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('only local should be available as visibility if the user is not logged in', async () => {
    const visibilitySelector = await loader.getHarness(
      MatSelectHarness.with({ label: 'Visibility' })
    );
    expect(await visibilitySelector.isDisabled()).toBeFalse();
    await visibilitySelector.open();

    expect(await (await visibilitySelector.getOptions())[0].getText()).toBe(
      'Unlisted'
    );
    expect(
      await (await visibilitySelector.getOptions())[0].isDisabled()
    ).toBeTrue();

    expect(await (await visibilitySelector.getOptions())[1].getText()).toBe(
      'Public'
    );
    expect(
      await (await visibilitySelector.getOptions())[1].isDisabled()
    ).toBeTrue();

    expect(await (await visibilitySelector.getOptions())[2].getText()).toBe(
      'Local'
    );
    expect(
      await (await visibilitySelector.getOptions())[2].isDisabled()
    ).toBeFalse();

    expect(fixture.nativeElement.innerHTML).toContain(
      'You have to log in to create a non-local board'
    );
  });

  it("In edit mode if the board is local, the visibility input shouldn't be there", async () => {
    fixture.componentRef.setInput('createMode', false);

    const visibilitySelector = await loader.getHarnessOrNull(
      MatSelectHarness.with({ label: 'Visibility' })
    );
    expect(await visibilitySelector).toBeNull();
  });

  it('In create mode board size selector should be present', async () => {
    const boardSizeSelector = await loader.getHarnessOrNull(
      MatSelectHarness.with({ label: 'Board size' })
    );
    expect(await boardSizeSelector).not.toBeNull();
  });

  it("In edit mode board size selector shouldn't be present", async () => {
    fixture.componentRef.setInput('createMode', false);

    const boardSizeSelector = await loader.getHarnessOrNull(
      MatSelectHarness.with({ label: 'Board size' })
    );
    expect(await boardSizeSelector).toBeNull();
  });

  it('If the game is not finished yet, game mode selector should be present', async () => {
    const gameModeSelector = await loader.getHarnessOrNull(
      MatSelectHarness.with({ label: 'Game mode' })
    );
    expect(await gameModeSelector).not.toBeNull();
  });

  it("If the game is finished, game mode selector shouldn't be present", async () => {
    fixture.componentRef.setInput('gameFinished', true);

    const gameModeSelector = await loader.getHarnessOrNull(
      MatSelectHarness.with({ label: 'Game mode' })
    );
    expect(await gameModeSelector).toBeNull();
  });
});
