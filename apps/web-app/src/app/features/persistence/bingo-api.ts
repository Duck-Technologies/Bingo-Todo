import {
  HttpClient,
  HttpHeaders,
  HttpErrorResponse,
  HttpStatusCode,
} from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, of, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BoardCellDto, BoardInfo, BoardCell } from '../board/board';
import { BoardCalculations } from '../calculations/board-calculations';
import { ConfirmDialog } from '../confirm-dialog/confirm-dialog';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class BingoApi {
  private http = inject(HttpClient);
  private calculationService = inject(BoardCalculations);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);
  private baseUrl = `${environment.BingoApi.Uri}/boards`;

  public boards$: Observable<any[]> = this.http.get<any[]>(
    `${environment.BingoApi.Uri}/boards`
  );

  public createBoard(board: BoardInfo<BoardCellDto>): Observable<string> {
    return this.http
      .post<{ Id: string }>(this.baseUrl, {
        ...board,
        CompletionDeadlineUtc:
          board.TraditionalGame.CompletionDeadlineUtc ??
          board.TodoGame.CompletionDeadlineUtc,
        CompletionReward:
          board.TraditionalGame.CompletionReward ??
          board.TodoGame.CompletionReward,
      })
      .pipe(
        catchError((e) => {
          if (e instanceof HttpErrorResponse) {
            this.handleErrorMessage(e);
          }

          return throwError(() => e);
        }),
        map((res) => res.Id)
      );
  }

  public deleteBoard(boardId: string): Observable<void> {
    return this.http.delete(`${this.baseUrl}/${boardId}`).pipe(
      catchError((e) => {
        if (e instanceof HttpErrorResponse) {
          this.handleErrorMessage(e);
        }

        return throwError(() => e);
      }),
      map(() => undefined)
    );
  }

  public loadBoard(boardId: string): Observable<BoardInfo> {
    return this.http
      .get<BoardInfo>(`${this.baseUrl}/${boardId}`, { observe: 'response' })
      .pipe(
        catchError((e) => {
          // can get bad request if the id is invalid
          if (e instanceof HttpErrorResponse) {
            this.handleErrorMessage(e);
          }

          return throwError(() => e);
        }),
        map(
          (response) =>
            new BoardInfo({
              ...response.body!,
              Etag: response.headers.get('etag'),
              Cells: BoardCalculations.calculateCellBingoState(
                response.body!.Cells.map(
                  (c, idx) =>
                    new BoardCell(
                      c,
                      idx,
                      BoardCalculations.getBoardDimensionFromCellCount(
                        response.body!.Cells.length
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
    selectedIndexes: number[],
    etag: string | null | undefined
  ): Observable<void> {
    // not adding etags on purpose, as save selection can't really mess up the data
    // worst thing that can happen is a bad request if the user tries to check a cell after completion
    // let headers = new HttpHeaders();
    // if (!!etag) {
    //   headers = headers.set('If-Match', etag);
    // }

    return this.http
      .post(`${this.baseUrl}/${id}/CheckCells`, selectedIndexes)
      .pipe(
        catchError((e) => {
          if (
            e instanceof HttpErrorResponse &&
            //e.status != HttpStatusCode.Conflict &&
            e.status != HttpStatusCode.BadRequest
          ) {
            this.handleErrorMessage(e);
          }

          return throwError(() => e);
        }),
        map(() => undefined)
      );
  }

  public updateBoard(
    boardId: string,
    updatedBoard: BoardInfo
  ): Observable<void> {
    let headers = new HttpHeaders();
    if (!!updatedBoard.Etag) {
      headers = headers.set('If-Match', updatedBoard.Etag);
    }

    return this.http
      .put(`${this.baseUrl}/${boardId}`, updatedBoard, { headers: headers })
      .pipe(
        catchError((e) => {
          if (
            e instanceof HttpErrorResponse &&
            e.status != HttpStatusCode.Conflict
          ) {
            this.handleErrorMessage(e);
          }

          return throwError(() => e);
        }),
        map(() => undefined)
      );
  }

  private handleErrorMessage(response: HttpErrorResponse) {
    switch (response.status) {
      case HttpStatusCode.BadRequest:
        if (
          JSON.stringify(response.error).includes(
            'Id param must be a 24 character hex string.'
          )
        ) {
          const badIdRef = this.dialog.open(ConfirmDialog, {
            data: {
              type: 'alert',
              alertTitle: 'Invalid id',
              alertDescription:
                'The id in the URL is invalid. You will be redirected.',
            },
          });
          badIdRef
            .afterClosed()
            .subscribe(() => this.router.navigate(['board/create']));
        }
        break;
      case HttpStatusCode.NotFound:
        const ref = this.dialog.open(ConfirmDialog, {
          data: {
            type: 'alert',
            alertTitle: 'Not found',
            alertDescription:
              'Board with given id not found. You will be redirected.',
          },
        });
        ref
          .afterClosed()
          .subscribe(() => this.router.navigate(['board/create']));
        break;
      case HttpStatusCode.InternalServerError:
        this.dialog.open(ConfirmDialog, {
          data: {
            type: 'alert',
            alertTitle: 'Server error',
            alertDescription:
              'The server accepted your request but something went wrong. Please try again.',
          },
        });
        break;
      case HttpStatusCode.GatewayTimeout:
      case HttpStatusCode.RequestTimeout:
      case 0:
        this.dialog.open(ConfirmDialog, {
          data: {
            type: 'alert',
            alertTitle: 'Request timeout',
            alertDescription: `This is a portfolio application and the server might be shut down.
            It's also possible that the server is just booting up because of your request.
            You should try again, but if you don't succeed in a minute, your best bet is to ask the owner to start it for you.`,
          },
        });
        break;
      case HttpStatusCode.Unauthorized:
        this.dialog.open(ConfirmDialog, {
          data: {
            type: 'alert',
            alertTitle: 'Unauthorized',
            alertDescription:
              "The server couldn't authorize you. Try to reload the page and retry, or sign out and in.",
          },
        });
        break;
      default:
        this.dialog.open(ConfirmDialog, {
          data: {
            type: 'alert',
            alertTitle: 'Unknown error',
            alertDescription: 'Something went wrong. Please try again.',
          },
        });
    }
  }
}
