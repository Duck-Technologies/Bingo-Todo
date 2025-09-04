import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BoardCellDto, BoardInfo, BoardCell } from '../board/board';
import { BoardCalculations } from '../calculations/board-calculations';

@Injectable({
  providedIn: 'root',
})
export class BingoApi {
  private http = inject(HttpClient);
  private calculationService = inject(BoardCalculations);
  private baseUrl = `${environment.BingoApi.Uri}/boards`;

  public books$: Observable<any[]> = this.http.get<any[]>(
    `${environment.BingoApi.Uri}/boards`
  );

  public createBoard(board: BoardInfo<BoardCellDto>): Observable<string> {
    return this.http
      .post<{ Id: string }>(this.baseUrl, {...board,
        CompletionDeadlineUtc: board.TraditionalGame.CompletionDeadlineUtc ?? board.TodoGame.CompletionDeadlineUtc,
        CompletionReward: board.TraditionalGame.CompletionReward ?? board.TodoGame.CompletionReward
      })
      .pipe(map((res) => res.Id));
  }

  public deleteBoard(boardId: string): Observable<void> {
    return this.http
      .delete(`${this.baseUrl}/${boardId}`)
      .pipe(map(() => undefined));
  }

  public loadBoard(boardId: string): Observable<BoardInfo> {
    return this.http.get<BoardInfo>(`${this.baseUrl}/${boardId}`).pipe(
      map(
        (board) =>
          new BoardInfo({
            ...board,
            Cells: BoardCalculations.calculateCellBingoState(
              board.Cells.map(
                (c, idx) =>
                  new BoardCell(
                    c,
                    idx,
                    BoardCalculations.getBoardDimensionFromCellCount(
                      board.Cells.length
                    ) as number
                  )
              ),
              this.calculationService
            ),
          })
      )
    );
  }

  public loadBoards(userId: string | null = null): Observable<BoardInfo[]> {
    return this.http.get<BoardInfo[]>(this.baseUrl);
  }

  public saveSelection(
    id: string,
    selectedIndexes: number[]
  ): Observable<void> {
    return this.http
      .post(`${this.baseUrl}/${id}/CheckCells`, selectedIndexes)
      .pipe(map(() => undefined));
  }

  public updateBoard(
    boardId: string,
    updatedBoard: BoardInfo
  ): Observable<void> {
    return this.http
      .put(`${this.baseUrl}/${boardId}`, updatedBoard)
      .pipe(map(() => undefined));
  }
}
