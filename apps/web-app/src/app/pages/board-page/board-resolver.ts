import { inject } from '@angular/core';
import { ResolveFn, Router } from '@angular/router';
import { of, Observable, EMPTY, switchMap } from 'rxjs';
import { BingoLocalStorage } from '../../features/persistence/bingo-local';
import { BoardInfo } from '../../features/board/board';
import { BoardCalculations } from '../../features/calculations/board-calculations';

export const boardResolver: ResolveFn<Observable<BoardInfo>> = (route, state) => {
  const router = inject(Router);
  // const boardId = route.paramMap.get('id');

  if (state.url.endsWith('board/local')) {
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

  router.navigate(['board/local']);
  return EMPTY;
};
