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

    BingoLocalStorage.calculateCompletionAndFirstBingoDates(updatedBoard);

    localStorage.setItem(
      BingoLocalStorage.LocalStorageBoardKey,
      JSON.stringify(updatedBoard)
    );

    return of(true);
  }

  private static calculateCompletionAndFirstBingoDates(board: BoardInfo) {
    const sortedCells = BingoLocalStorage.cellsToCheckedDateSorted(board.Cells);

    if (
      board.GameMode === 'traditional' &&
      !board.TraditionalGame.CompletionDateUtc
    ) {
      board.TraditionalGame.CompletionDateUtc =
        sortedCells
          .filter((b) => b.IsInBingoPattern)
          .at(
            (BoardCalculations.getBoardDimensionFromCellCount(
              board.Cells.length
            ) as number) - 1
          )?.CheckedDateUTC || null;
    }

    if (
      board.GameMode === 'todo' &&
      !board.TodoGame.CompletionDateUtc &&
      !board.Cells.find((c) => !c.CheckedDateUTC)
    ) {
      board.TodoGame.CompletionDateUtc =
        sortedCells.at(board.Cells.length - 1)?.CheckedDateUTC || null;
    }
  }

  private static cellsToCheckedDateSorted(cells: BoardCell[]) {
    return [...cells].sort(
      (a, b) =>
        (a.CheckedDateUTC?.getTime() ?? 0) - (b.CheckedDateUTC?.getTime() ?? 0)
    );
  }
}
