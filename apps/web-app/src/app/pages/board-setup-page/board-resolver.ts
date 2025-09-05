import { ResolveFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { of, EMPTY, switchMap, Observable, tap } from 'rxjs';
import { BingoLocalStorage } from '../../features/persistence/bingo-local';
import { BoardCalculations } from '../../features/calculations/board-calculations';
import { BoardInfo } from '../../features/board/board';
import { BingoApi } from '../../features/persistence/bingo-api';
import { Title } from '@angular/platform-browser';

export const boardToCopyResolver: ResolveFn<Observable<BoardInfo>> = (
  route,
  state
) => {
  const router = inject(Router);
  const boardId = route.paramMap.get('id');
  const bingoApi = inject(BingoApi);
  const titleService = inject(Title);

  if (state.url.endsWith('board/copy/local')) {
    const calculationService = inject(BoardCalculations);

    return BingoLocalStorage.loadBoard(calculationService).pipe(
      switchMap((board) => {
        if (board.Cells.length !== 0) {
          titleService.setTitle('Copy ' + (board.Name ?? 'Untitled board'));
          return of(board);
        } else {
          router.navigate(['board/create']);
          return EMPTY;
        }
      })
    );
  } else if (boardId) {
    return bingoApi
      .loadBoard(boardId)
      .pipe(
        tap((board) =>
          titleService.setTitle('Copy ' + (board.Name ?? 'Untitled board'))
        )
      );
  }

  router.navigate(['board/create']);
  return EMPTY;
};
