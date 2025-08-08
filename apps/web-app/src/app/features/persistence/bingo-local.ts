import { Observable, of } from 'rxjs';
import { BoardCell, BoardCellDto, BoardInfo } from '../board/board';
import { BoardCalculations } from '../calculations/board-calculations';

export class BingoLocalStorage {
  private static readonly LocalStorageBoardKey = 'LocalBoardInfo';
  public static readonly DefaultBoard: BoardInfo = {
    Name: null,
    GameMode: 'todo',
    CompletionDateUtc: null,
    CompletionDeadlineUtc: null,
    CompletionReward: null,
    Cells: [],
    FirstBingoReachedDateUtc: null,
    Visibility: 'local',
  };

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
    if (!board) {
      return of({ ...BingoLocalStorage.DefaultBoard, Cells: [] });
    } else {
      const parsedBoard = JSON.parse(board) as BoardInfo;
      return of({
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

  public static updateBoard(
    updatedBoard: BoardInfo,
    calculationService: BoardCalculations
  ): Observable<void> {
    BoardCalculations.calculateCellBingoState(
      updatedBoard.Cells,
      calculationService
    );

    BingoLocalStorage.calculateCompletionAndFirstBingoDates(updatedBoard);

    localStorage.setItem(
      BingoLocalStorage.LocalStorageBoardKey,
      JSON.stringify(updatedBoard)
    );

    return of();
  }

  private static calculateCompletionAndFirstBingoDates(board: BoardInfo) {
    const sortedCells = BingoLocalStorage.cellsToCheckedDateSorted(board.Cells);

    board.FirstBingoReachedDateUtc =
      board.FirstBingoReachedDateUtc ||
      sortedCells
        .filter((b) => b.IsInBingoPattern)
        .at(
          BoardCalculations.getBoardDimensionFromCellCount(
            board.Cells.length
          ) as number - 1 
        )?.CheckedDateUTC ||
      null;

    board.CompletionDateUtc =
      board.GameMode === 'traditional'
        ? board.FirstBingoReachedDateUtc
        : sortedCells.at(board.Cells.length - 1)?.CheckedDateUTC || null;
  }

  private static cellsToCheckedDateSorted(cells: BoardCell[]) {
    return [...cells].sort(
      (a, b) =>
        (a.CheckedDateUTC?.getTime() ?? 0) - (b.CheckedDateUTC?.getTime() ?? 0)
    );
  }
}
