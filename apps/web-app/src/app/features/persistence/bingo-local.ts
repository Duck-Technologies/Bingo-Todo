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
      CompletionDateUtc: null,
      CompletionReward: null,
      CompletionDeadlineUtc: null,
    },
    TodoGame: {
      CompletionDateUtc: null,
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
    const board = localStorage.getItem(BingoLocalStorage.LocalStorageBoardKey);
    if (!BingoLocalStorage.boardInLocalStorage() || !board) {
      return of(new BoardInfo(BingoLocalStorage.DefaultBoard));
    } else {
      const parsedBoard = JSON.parse(board) as BoardInfo;
      return of(
        new BoardInfo({
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
        })
      );
    }
  }

  public static updateBoard(
    updatedBoard: BoardInfo,
    calculationService: BoardCalculations
  ): Observable<boolean> {
    BoardCalculations.calculateCellBingoState(
      updatedBoard.Cells,
      calculationService
    );

    BingoLocalStorage.setCompletionDateIfApplicable(updatedBoard);

    localStorage.setItem(
      BingoLocalStorage.LocalStorageBoardKey,
      JSON.stringify(updatedBoard)
    );

    return of(true);
  }

  private static setCompletionDateIfApplicable(board: BoardInfo) {
    if (
      board.GameMode === 'traditional' &&
      !board.TraditionalGame.CompletionDateUtc &&
      board.Cells.find((c) => c.IsInBingoPattern)
    ) {
      board.TraditionalGame.CompletionDateUtc = new Date();
    }

    if (
      board.GameMode === 'todo' &&
      !board.TodoGame.CompletionDateUtc &&
      board.Cells.every((c) => c.IsInBingoPattern)
    ) {
      board.TodoGame.CompletionDateUtc = new Date(
        Math.max(...board.Cells.map((c) => c.CheckedDateUTC!.getTime()))
      );
    }
  }

  private static cellsToCheckedDateSorted(cells: BoardCell[]) {
    return [...cells].sort(
      (a, b) =>
        (a.CheckedDateUTC?.getTime() ?? 0) - (b.CheckedDateUTC?.getTime() ?? 0)
    );
  }
}
