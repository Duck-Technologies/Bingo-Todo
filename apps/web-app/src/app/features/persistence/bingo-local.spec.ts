import { delay, filter, firstValueFrom, switchMap, tap } from 'rxjs';
import { BoardCell, BoardInfo } from '../board/board';
import { BoardCalculations } from '../calculations/board-calculations';
import { BingoLocalStorage } from './bingo-local';

describe('BingoLocalStorage', () => {
  let calculationService: BoardCalculations;

  beforeEach(() => {
    calculationService = new BoardCalculations();
  });

  it('should set completion date while saving a traditional board', () => {
    const board = new BoardInfo({
      GameMode: 'traditional',
      Cells: BoardCalculations.getRowIndexes(9).map(
        (idx) =>
          new BoardCell(
            {
              Selected: false,
              CheckedAtUtc: null,
            },
            idx,
            3
          )
      ),
      Visibility: 'local',
    });

    BingoLocalStorage.createBoard(board);

    BingoLocalStorage.saveSelection(
      board,
      [0, 1, 2],
      calculationService
    ).subscribe({
      next: (board) => {
        if (board) {
          expect(board.TraditionalGame.CompletedByGameModeSwitch).toBeFalse();
          expect(board.TraditionalGame.CompletedAtUtc).not.toBeNull();
          expect(board.TraditionalGame.CompletedAtUtc).toEqual(
            board.Cells.at(0)?.CheckedAtUtc ?? null
          );
          expect(board.TodoGame.CompletedAtUtc).toBeNull();
        } else {
          expect(board).not.toBeFalse();
        }
      },
    });
  });

  it("shouldn't set completion date while saving an in-progress todo board", () => {
    const board = new BoardInfo({
      GameMode: 'todo',
      Cells: BoardCalculations.getRowIndexes(9).map(
        (idx) =>
          new BoardCell(
            {
              Selected: false,
              CheckedAtUtc: null,
            },
            idx,
            3
          )
      ),
      Visibility: 'local',
    });

    BingoLocalStorage.createBoard(board);

    BingoLocalStorage.saveSelection(
      board,
      [0, 1, 2],
      calculationService
    ).subscribe({
      next: (board) => {
        if (board) {
          expect(board.TodoGame.CompletedAtUtc).toBeNull();
          expect(board.TraditionalGame.CompletedAtUtc).toBeNull();
        } else {
          expect(board).not.toBeFalse();
        }
      },
    });
  });

  it('should set completion date while saving a completed todo board', async () => {
    const board = new BoardInfo({
      GameMode: 'todo',
      Cells: BoardCalculations.getRowIndexes(9).map(
        (idx) =>
          new BoardCell(
            {
              Selected: false,
              CheckedAtUtc: null,
            },
            idx,
            3
          )
      ),
      Visibility: 'local',
    });

    BingoLocalStorage.createBoard(board);

    await new Promise((resolve) => setTimeout(resolve, 10));

    await firstValueFrom(
      BingoLocalStorage.saveSelection(
        board,
        [0, 1, 2, 3, 4, 5, 6, 7],
        calculationService
      ).pipe(
        tap((board) => expect(board).not.toBeFalse()),
        filter((board) => !!board),
        tap((board) => expect(board.TodoGame.CompletedAtUtc).toBeNull()),
        delay(10),
        switchMap((board) =>
          BingoLocalStorage.saveSelection(board, [8], calculationService)
        ),
        tap((board) => {
          if (board) {
            expect(board.TraditionalGame.CompletedAtUtc).toBeNull();
            expect(board.TodoGame.CompletedAtUtc).not.toBeNull();
            expect(board.Cells.at(-2)?.CheckedAtUtc?.getTime()).not.toEqual(
              board.Cells.at(-1)?.CheckedAtUtc?.getTime()
            );
            expect(board.TodoGame.CompletedAtUtc?.getTime()).toEqual(
              board.Cells.at(-1)?.CheckedAtUtc?.getTime()
            );
            expect(board.Cells[0].CheckedAtUtc?.getTime()).toBeGreaterThan(
              board.CreatedAtUtc!.getTime()
            );
          } else {
            expect(board).not.toBeFalse();
          }
        })
      )
    );
  });

  it('should set the CompletedByGameModeSwitch flag if changing game mode to traditional', async () => {
    const board = new BoardInfo({
      GameMode: 'todo',
      Cells: BoardCalculations.getRowIndexes(9).map(
        (idx) =>
          new BoardCell(
            {
              Selected: false,
              CheckedAtUtc: null,
            },
            idx,
            3
          )
      ),
      Visibility: 'local',
    });

    BingoLocalStorage.createBoard(board);

    await new Promise((resolve) => setTimeout(resolve, 10));

    await firstValueFrom(
      BingoLocalStorage.saveSelection(
        board,
        [0, 1, 2],
        calculationService
      ).pipe(
        tap((board) => expect(board).not.toBeFalse()),
        filter((board) => !!board),
        tap((board) => expect(board.TodoGame.CompletedAtUtc).toBeNull()),
        delay(10),
        switchMap((board) => {
          board.GameMode = 'traditional';
          return BingoLocalStorage.updateBoard(board, calculationService);
        }),
        tap((board) => {
          if (board) {
            expect(board.Cells[0].CheckedAtUtc?.getTime()).toBeGreaterThan(
              board.CreatedAtUtc!.getTime()
            );
            expect(board.TraditionalGame.CompletedAtUtc).not.toBeNull();
            expect(board.TraditionalGame.CompletedByGameModeSwitch).toBeTrue();
            expect(board.TodoGame.CompletedAtUtc).toBeNull();
            expect(
              board.TraditionalGame.CompletedAtUtc?.getTime()
            ).toBeGreaterThan(board.Cells.at(2)?.CheckedAtUtc!?.getTime());
          } else {
            expect(board).not.toBeFalse();
          }
        })
      )
    );
  });

  it("should update SwitchedToTodoAfterCompleteDateUtc only after traditional completed, and should be able to toggle as long as there's no new check", async () => {
    const board = new BoardInfo({
      GameMode: 'traditional',
      Cells: BoardCalculations.getRowIndexes(9).map(
        (idx) =>
          new BoardCell(
            {
              Selected: false,
              CheckedAtUtc: null,
            },
            idx,
            3
          )
      ),
      Visibility: 'local',
    });

    BingoLocalStorage.createBoard(board);

    await new Promise((resolve) => setTimeout(resolve, 10));

    await firstValueFrom(
      // select 2
      BingoLocalStorage.saveSelection(board, [0, 1], calculationService).pipe(
        tap((board) => expect(board).not.toBeFalse()),
        filter((board) => !!board),
        tap((board) => expect(board.TodoGame.CompletedAtUtc).toBeNull()),
        // switch game mode to todo, SwitchedToTodoAfterCompleteDateUtc should remain null
        switchMap((board) => {
          board.GameMode = 'todo';
          return BingoLocalStorage.updateBoard(board, calculationService);
        }),
        tap((board) => expect(board).not.toBeFalse()),
        filter((board) => !!board),
        tap((board) =>
          expect(board.SwitchedToTodoAfterCompleteDateUtc).toBeFalsy()
        ),
        // switch back to traditional
        switchMap((board) => {
          board.GameMode = 'traditional';
          return BingoLocalStorage.updateBoard(board, calculationService);
        }),
        tap((board) => expect(board).not.toBeFalse()),
        filter((board) => !!board),
        // check one, that results in completion
        switchMap((board) =>
          BingoLocalStorage.saveSelection(board, [2], calculationService)
        ),
        tap((board) => expect(board).not.toBeFalse()),
        filter((board) => !!board),
        // switch game mode to todo, SwitchedToTodoAfterCompleteDateUtc should be set
        switchMap((board) => {
          board.GameMode = 'todo';
          return BingoLocalStorage.updateBoard(board, calculationService);
        }),
        tap((board) => expect(board).not.toBeFalse()),
        filter((board) => !!board),
        tap((board) =>
          expect(board.SwitchedToTodoAfterCompleteDateUtc).not.toBeFalsy()
        ),
        // switch game mode to traditional, SwitchedToTodoAfterCompleteDateUtc should be removed
        switchMap((board) => {
          board.GameMode = 'traditional';
          return BingoLocalStorage.updateBoard(board, calculationService);
        }),
        tap((board) => expect(board).not.toBeFalse()),
        filter((board) => !!board),
        tap((board) =>
          expect(board.SwitchedToTodoAfterCompleteDateUtc).toBeFalsy()
        ),

        // switch back to todo
        switchMap((board) => {
          board.GameMode = 'todo';
          return BingoLocalStorage.updateBoard(board, calculationService);
        }),
        tap((board) => expect(board).not.toBeFalse()),
        filter((board) => !!board),

        // check another cell
        switchMap((board) =>
          BingoLocalStorage.saveSelection(board, [4], calculationService)
        ),
        tap((board) => expect(board).not.toBeFalse()),
        filter((board) => !!board),

        // do another update, this time SwitchedToTodoAfterCompleteDateUtc shouldn't be updated
        delay(20),
        switchMap((finalBoard) => {
          board.GameMode = 'todo';
          return BingoLocalStorage.updateBoard(board, calculationService).pipe(
            tap((board) => expect(board).not.toBeFalse()),
            filter((board) => !!board),
            tap((_board) => {
              expect(_board.SwitchedToTodoAfterCompleteDateUtc).not.toBeFalsy();
              expect(_board.SwitchedToTodoAfterCompleteDateUtc).toEqual(
                finalBoard.SwitchedToTodoAfterCompleteDateUtc
              );
              expect(
                _board.SwitchedToTodoAfterCompleteDateUtc?.getTime()
              ).toBeLessThan(board.LastChangedAtUtc!?.getTime());
            })
          );
        })
      )
    );
  });
});
