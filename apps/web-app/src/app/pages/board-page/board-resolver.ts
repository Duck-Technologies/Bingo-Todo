import { inject } from '@angular/core';
import { ResolveFn, Router } from '@angular/router';
import { of, Observable, EMPTY, switchMap, tap } from 'rxjs';
import { BingoLocalStorage } from '../../features/persistence/bingo-local';
import { BoardInfo } from '../../features/board/board';
import { BoardCalculations } from '../../features/calculations/board-calculations';
import { BingoApi } from '../../features/persistence/bingo-api';
import { Title } from '@angular/platform-browser';

export const boardResolver: ResolveFn<Observable<BoardInfo>> = (
  route,
  state
) => {
  const router = inject(Router);
  const bingoApi = inject(BingoApi);
  const boardId = route.paramMap.get('id');
  const calculationService = inject(BoardCalculations);
  const titleService = inject(Title);

  if (state.url.endsWith('board/local')) {
    return BingoLocalStorage.loadBoard(calculationService).pipe(
      switchMap((board) => {
        if (board.Cells.length !== 0) {
          titleService.setTitle(board.Name ?? 'Untitled board');
          return of(board);
        } else {
          router.navigate(['board/create']);
          return EMPTY;
        }
      })
    );
  } else if (boardId) {
    return bingoApi.loadBoard(boardId).pipe(
      tap((board) => {
        titleService.setTitle(board.Name ?? 'Untitled board');
      })
    );
  }

  router.navigate(['board/local']);
  return EMPTY;
};
