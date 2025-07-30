import { Observable, of } from 'rxjs';
import { BoardInfo } from '../board/board';

export class BingoLocalStorage {
  private static readonly LocalStorageBoardKey = 'LocalBoardInfo';
  public static readonly DefaultBoard: BoardInfo = {
    Name: null,
    GameMode: 'todo',
    CompletionDeadlineUtc: null,
    Cells: [],
    Visibility: 'local',
  };

  public static createBoard(board: BoardInfo): Observable<string> {
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

  public static loadBoard(): Observable<BoardInfo> {
    const board = localStorage.getItem(BingoLocalStorage.LocalStorageBoardKey);
    if (!board) {
      return of({ ...BingoLocalStorage.DefaultBoard, Cells: [] });
    } else {
      return of(JSON.parse(board));
    }
  }

  public static updateBoard(updatedBoard: BoardInfo): Observable<void> {
    localStorage.setItem(
      BingoLocalStorage.LocalStorageBoardKey,
      JSON.stringify(updatedBoard)
    );

    return of();
  }
}
