import { ResolveFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { of, EMPTY, switchMap, Observable, catchError, throwError } from 'rxjs';
import { BingoLocalStorage } from '../../features/persistence/bingo-local';
import { BoardCalculations } from '../../features/calculations/board-calculations';
import { BoardInfo } from '../../features/board/board';
import { BingoApi } from '../../features/persistence/bingo-api';

export const boardToCopyResolver: ResolveFn<Observable<BoardInfo>> = (
  route,
  state
) => {
  const router = inject(Router);
  const boardId = route.paramMap.get('id');
  const bingoApi = inject(BingoApi);

  if (state.url.endsWith('board/copy/local')) {
    const calculationService = inject(BoardCalculations);

    return BingoLocalStorage.loadBoard(calculationService).pipe(
      switchMap((board) => {
        if (board.Cells.length !== 0) {
          return of(board);
        } else {
          router.navigate(['board/create']);
          return EMPTY;
        }
      })
    );
  } else if (boardId) {
    return bingoApi.loadBoard(boardId).pipe(
      catchError((err) => {
        router.navigate(['board/local']);
        // do something with the error
        return throwError(() => err);
      })
    );
  }

  router.navigate(['board/create']);
  return EMPTY;
};
