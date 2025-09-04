import { inject } from '@angular/core';
import { ResolveFn, Router } from '@angular/router';
import {
  of,
  Observable,
  EMPTY,
  switchMap,
  catchError,
  throwError,
} from 'rxjs';
import { BingoLocalStorage } from '../../features/persistence/bingo-local';
import { BoardInfo } from '../../features/board/board';
import { BoardCalculations } from '../../features/calculations/board-calculations';
import { BingoApi } from '../../features/persistence/bingo-api';

export const boardResolver: ResolveFn<Observable<BoardInfo>> = (
  route,
  state
) => {
  const router = inject(Router);
  const bingoApi = inject(BingoApi);
  const boardId = route.paramMap.get('id');
  const calculationService = inject(BoardCalculations);

  if (state.url.endsWith('board/local')) {
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

  router.navigate(['board/local']);
  return EMPTY;
};
