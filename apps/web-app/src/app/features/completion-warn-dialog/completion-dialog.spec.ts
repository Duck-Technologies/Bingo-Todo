import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CompletionDialog } from './completion-dialog';
import { provideZonelessChangeDetection } from '@angular/core';
import { BoardInfo } from '../board/board';
import { MatTestDialogOpener } from '@angular/material/dialog/testing';
import { calculateDateFromNow } from '../calculations/date-calculations';
import { boardForm } from '../board-details-form/form';

describe('CompletionWarnDialog', () => {
  let component: MatTestDialogOpener<CompletionDialog>;
  let fixture: ComponentFixture<MatTestDialogOpener<CompletionDialog>>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CompletionDialog],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    boardForm.reset();
    boardForm.enable();
  });

  function createComponent(data: { board: BoardInfo }) {
    fixture = TestBed.createComponent(
      MatTestDialogOpener.withComponent(CompletionDialog, { data: data })
    );
    component = fixture.componentInstance;
    fixture.autoDetectChanges();
  }

  it('should create', () => {
    createComponent({ board: new BoardInfo() });
    expect(component).toBeTruthy();
  });

  it("When there's no completion date for the current game mode, it should render accordingly", async () => {
    createComponent({ board: new BoardInfo() });
    const dialogContainer = document.querySelector('mat-dialog-container');
    expect(dialogContainer!.innerHTML).toContain('Finishing the game');
    expect(dialogContainer!.innerHTML).toContain(
      'This is your last chance to change the reward'
    );
    expect(dialogContainer!.innerHTML).toContain('Completion reward');
  });

  it("When there's traditional completion date, it should render accordingly", async () => {
    const board = new BoardInfo();
    board.GameMode = 'traditional';
    board.TraditionalGame.CompletedAtUtc = new Date();
    createComponent({ board: board });
    const dialogContainer = document.querySelector('mat-dialog-container');
    expect(dialogContainer!.innerHTML).toContain(
      'Consider continuing the board in TO-DO mode'
    );
    expect(dialogContainer!.innerHTML).toContain('BINGO');
    expect(dialogContainer!.innerHTML).toContain('Continue in TO-DO');
  });

  it("When there's todo completion date, it should render accordingly", async () => {
    const board = new BoardInfo();
    board.GameMode = 'todo';
    board.TodoGame.CompletedAtUtc = new Date();
    createComponent({ board: board });
    const dialogContainer = document.querySelector('mat-dialog-container');
    expect(dialogContainer!.innerHTML).toContain('Well done');
    expect(dialogContainer!.innerHTML).not.toContain('Continue in TO-DO');
  });

  it("When it's a local game there should be a hint for deleting it", async () => {
    const board = new BoardInfo();
    board.GameMode = 'todo';
    board.TodoGame.CompletedAtUtc = new Date();
    board.Visibility = 'local';
    createComponent({ board: board });
    const dialogContainer = document.querySelector('mat-dialog-container');
    expect(dialogContainer!.innerHTML).toContain(
      'You have to delete it if you want to start a new one'
    );
    expect(dialogContainer!.innerHTML).toContain('Delete board');
  });

  it("When it's a non-local game there shouldn't be a hint for deleting it", async () => {
    const board = new BoardInfo();
    board.GameMode = 'todo';
    board.TodoGame.CompletedAtUtc = new Date();
    board.Visibility = 'public';
    createComponent({ board: board });
    const dialogContainer = document.querySelector('mat-dialog-container');
    expect(dialogContainer!.innerHTML).not.toContain(
      'You have to delete it if you want to start a new one'
    );
    expect(dialogContainer!.innerHTML).not.toContain('Delete board');
  });

  describe('Completion message', () => {
    it("should be 'You did it' without deadline and reward", () => {
      const board = new BoardInfo();
      board.GameMode = 'todo';
      board.TodoGame.CompletedAtUtc = new Date();
      createComponent({ board: board });
      const dialogContainer = document.querySelector('mat-dialog-container');
      expect(dialogContainer!.innerHTML).toContain('You did it!');
    });

    it("should be 'You did it before the deadline' if there's no reward and deadline is before completion date", () => {
      const board = new BoardInfo();
      board.GameMode = 'todo';
      board.TodoGame.CompletedAtUtc = new Date();
      board.TodoGame.CompletionDeadlineUtc = calculateDateFromNow(10);
      createComponent({ board: board });
      const dialogContainer = document.querySelector('mat-dialog-container');
      expect(dialogContainer!.innerHTML).toContain(
        'You did it before the deadline!'
      );
    });

    it("should be 'You did it! You've earned something' if there's reward and no deadline", () => {
      const board = new BoardInfo();
      board.GameMode = 'todo';
      board.TodoGame.CompletedAtUtc = new Date();
      board.TodoGame.CompletionReward = 'something';
      createComponent({ board: board });
      const dialogContainer = document.querySelector('mat-dialog-container');
      expect(dialogContainer!.innerHTML).toContain(
        "You did it! You've earned something!"
      );
    });

    it("should be 'You did it before the deadline! You've earned something' if there's reward and deadline is before completion date", () => {
      const board = new BoardInfo();
      board.GameMode = 'todo';
      board.TodoGame.CompletedAtUtc = new Date();
      board.TodoGame.CompletionDeadlineUtc = calculateDateFromNow(10);
      board.TodoGame.CompletionReward = 'something';
      createComponent({ board: board });
      const dialogContainer = document.querySelector('mat-dialog-container');
      expect(dialogContainer!.innerHTML).toContain(
        "You did it before the deadline! You've earned something!"
      );
    });

    it("should be 'You did it! You've earned something' if there's reward and deadline is after completion date", () => {
      const board = new BoardInfo();
      board.GameMode = 'todo';
      board.TodoGame.CompletedAtUtc = calculateDateFromNow(10);
      board.TodoGame.CompletionDeadlineUtc = new Date();
      board.TodoGame.CompletionReward = 'something';
      createComponent({ board: board });
      const dialogContainer = document.querySelector('mat-dialog-container');
      expect(dialogContainer!.innerHTML).toContain(
        "You did it! You've earned something!"
      );
    });
  });
});
