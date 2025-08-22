import { ResolveFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { of, EMPTY, switchMap, Observable } from 'rxjs';
import { BingoLocalStorage } from '../../features/persistence/bingo-local';
import { BoardCalculations } from '../../features/calculations/board-calculations';
import { BoardInfo } from '../../features/board/board';

export const boardToCopyResolver: ResolveFn<Observable<BoardInfo>> = (route, state) => {
  const router = inject(Router);
  // const boardId = route.paramMap.get('id');

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
      }),
    );
  }

  router.navigate(['board/create']);
  return EMPTY;
};
