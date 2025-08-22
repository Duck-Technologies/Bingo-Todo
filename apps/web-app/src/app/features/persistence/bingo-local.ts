import { Observable, of } from 'rxjs';
import { BoardCell, BoardCellDto, BoardInfo } from '../board/board';
import { BoardCalculations } from '../calculations/board-calculations';

export class BingoLocalStorage {
  private static readonly LocalStorageBoardKey = 'LocalBoardInfo';
  public static readonly DefaultBoard = new BoardInfo({
    Name: null,
    GameMode: 'todo',
    Cells: [],
    TraditionalGame: {
      CompletedAtUtc: null,
      CompletedByGameModeSwitch: false,
      CompletionReward: null,
      CompletionDeadlineUtc: null,
    },
    TodoGame: {
      CompletedAtUtc: null,
      CompletionReward: null,
      CompletionDeadlineUtc: null,
    },
    Visibility: 'local',
  });

  public static boardInLocalStorage() {
    const board = localStorage.getItem(BingoLocalStorage.LocalStorageBoardKey);
    if (!board) {
      return false;
    } else {
      return !!new BoardInfo(JSON.parse(board)).Cells.length;
    }
  }

  public static createBoard(
    board: BoardInfo<BoardCellDto>
  ): Observable<string> {
    board.CreatedAtUtc = new Date();
    localStorage.setItem(
      BingoLocalStorage.LocalStorageBoardKey,
      JSON.stringify(board)
    );

    return of('local');
  }

  public static resetBoard() {
    localStorage.setItem(
      BingoLocalStorage.LocalStorageBoardKey,
      JSON.stringify(BingoLocalStorage.DefaultBoard)
    );
  }

  public static loadBoard(
    calculationService: BoardCalculations
  ): Observable<BoardInfo> {
    const board = this.boardFromLocalStorage(calculationService);
    if (!BingoLocalStorage.boardInLocalStorage() || board === false) {
      return of(new BoardInfo(BingoLocalStorage.DefaultBoard));
    } else {
      return of(board);
    }
  }

  public static saveSelection(
    updatedBoard: BoardInfo,
    selectedIndexes: number[],
    calculationService: BoardCalculations
  ): Observable<BoardInfo<BoardCell> | false> {
    const board = BingoLocalStorage.boardFromLocalStorage(calculationService);
    const saveDate = new Date();

    if (board != false) {
      board.LastChangedAtUtc = saveDate;
      board.Cells.forEach((c, idx) => {
        if (selectedIndexes.includes(idx) && !c.CheckedDateUTC) {
          c.CheckedDateUTC = saveDate;
        }
      });

      BoardCalculations.calculateCellBingoState(
        board.Cells,
        calculationService
      );
      BingoLocalStorage.setCompletionDateIfApplicable(board, false, saveDate);

      localStorage.setItem(
        BingoLocalStorage.LocalStorageBoardKey,
        JSON.stringify(board)
      );

      return of(board);
    }

    return of(false as const);
  }

  public static updateBoard(
    updatedBoard: BoardInfo,
    calculationService: BoardCalculations
  ): Observable<false | BoardInfo> {
    const board = BingoLocalStorage.boardFromLocalStorage(calculationService);
    const saveDate = new Date();

    if (board != false) {
      updatedBoard.LastChangedAtUtc = saveDate;
      updatedBoard.CreatedAtUtc = board.CreatedAtUtc;
      updatedBoard.SwitchedToTodoAfterCompleteDateUtc =
        board.SwitchedToTodoAfterCompleteDateUtc;

      BoardCalculations.calculateCellBingoState(
        updatedBoard.Cells,
        calculationService
      );

      BingoLocalStorage.setCompletionDateIfApplicable(
        updatedBoard,
        true,
        saveDate
      );

      BingoLocalStorage.setSwitchedToTodoDateIfApplicable(
        updatedBoard,
        saveDate
      );

      localStorage.setItem(
        BingoLocalStorage.LocalStorageBoardKey,
        JSON.stringify(updatedBoard)
      );
      return of(updatedBoard);
    }

    return of(false as const);
  }

  private static boardFromLocalStorage(calculationService: BoardCalculations) {
    const board = localStorage.getItem(BingoLocalStorage.LocalStorageBoardKey);
    if (!board) {
      return false;
    } else {
      const parsedBoard = JSON.parse(board) as BoardInfo;

      return new BoardInfo({
        ...parsedBoard,
        Cells: BoardCalculations.calculateCellBingoState(
          parsedBoard.Cells.map(
            (c, idx) =>
              new BoardCell(
                c,
                idx,
                BoardCalculations.getBoardDimensionFromCellCount(
                  parsedBoard.Cells.length
                ) as number
              )
          ),
          calculationService
        ),
      });
    }
  }

  private static setCompletionDateIfApplicable(
    board: BoardInfo,
    completedByGameModeSwitch: boolean,
    dateToUse: Date
  ) {
    if (
      board.GameMode === 'traditional' &&
      !board.TraditionalGame.CompletedAtUtc &&
      board.Cells.find((c) => c.IsInBingoPattern)
    ) {
      board.TraditionalGame.CompletedAtUtc = dateToUse;
      board.TraditionalGame.CompletedByGameModeSwitch =
        completedByGameModeSwitch;
    }

    if (
      board.GameMode === 'todo' &&
      !board.TodoGame.CompletedAtUtc &&
      board.Cells.every((c) => c.CheckedDateUTC)
    ) {
      board.TodoGame.CompletedAtUtc = dateToUse;
    }
  }

  private static setSwitchedToTodoDateIfApplicable(
    board: BoardInfo,
    saveDate: Date
  ) {
    if (!board.TraditionalGame.CompletedAtUtc) return;

    const hasCheckedAfterCompletion = board.Cells.find(
      (c) =>
        c.CheckedDateUTC &&
        c.CheckedDateUTC > board.TraditionalGame.CompletedAtUtc!
    )?.CheckedDateUTC;

    if (!hasCheckedAfterCompletion && board.GameMode === 'traditional') {
      board.SwitchedToTodoAfterCompleteDateUtc = undefined;
      return;
    }

    if (
      board.GameMode === 'todo' &&
      !board.SwitchedToTodoAfterCompleteDateUtc
    ) {
      board.SwitchedToTodoAfterCompleteDateUtc = saveDate;
    }
  }
}
