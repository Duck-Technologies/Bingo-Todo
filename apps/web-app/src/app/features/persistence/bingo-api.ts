import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BoardInfo } from '../board/board';

@Injectable({
  providedIn: 'root',
})
export class BingoApi {
  private http = inject(HttpClient);

  public books$: Observable<any[]> = this.http.get<any[]>(
    `${environment.BingoApi.Uri}/books`
  );

  public createBoard(board: BoardInfo): Observable<string> {
    return of('local');
  }

  public deleteBoard(boardId: string): Observable<void> {
    return of();
  }

  public loadBoard(boardId: string): Observable<BoardInfo> {
    return of({
      Name: null,
      GameMode: 'traditional',
      CompletionDeadlineUtc: null,
      Cells: [],
      Visibility: 'unlisted',
    });
  }

  public loadBoards(userId: string | null = null): Observable<BoardInfo[]> {
    return of([]);
  }

  public updateBoard(
    boardId: string,
    updatedBoard: BoardInfo
  ): Observable<void> {
    return of();
  }
}
