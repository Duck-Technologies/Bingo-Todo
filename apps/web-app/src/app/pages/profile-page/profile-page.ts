import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  model,
} from '@angular/core';
import { BingoApi } from '../../features/persistence/bingo-api';
import { User } from '../../core/auth/user';
import { toObservable } from '@angular/core/rxjs-interop';
import {
  combineLatest,
  map,
  Observable,
  of,
  shareReplay,
  switchMap,
  tap,
} from 'rxjs';
import { AsyncPipe } from '@angular/common';
import { BoardPreview } from '../../features/board-preview/board-preview';
import { MatButton } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { MatChipListbox, MatChipOption } from '@angular/material/chips';
import { FormsModule } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { BingoLocalStorage } from '../../features/persistence/bingo-local';
import { BoardCalculations } from '../../features/calculations/board-calculations';
import { BoardInfo } from '../../features/board/board';

@Component({
  selector: 'app-profile-page',
  imports: [
    AsyncPipe,
    BoardPreview,
    MatButton,
    RouterLink,
    MatChipOption,
    MatChipListbox,
    FormsModule,
    MatIcon,
  ],
  templateUrl: './profile-page.html',
  styleUrl: './profile-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfilePage {
  public id = input<string>();
  private id$ = toObservable(this.id);
  private apiService = inject(BingoApi);
  private calculationService = inject(BoardCalculations);
  private userService = inject(User);
  public user$ = this.userService.user$;
  public userName$ = this.id$.pipe(
    switchMap((id) => {
      if (id) {
        return this.apiService
          .getUser(id)
          .pipe(map((user) => (user?.Name ? `${user.Name}'s` : null)));
      } else {
        return of('Your');
      }
    }),
  );
  public ownBoard$ = this.userName$.pipe(map((name) => name == 'Your'));

  public filters = model<string[]>([
    'traditional',
    'todo',
    'completed',
    'incomplete',
  ]);
  public sortBy = model<'creation' | 'completion' | 'name'>('name');

  private sortBy$ = toObservable(this.sortBy);
  private filters$ = toObservable(this.filters);

  public boards$ = combineLatest([
    this.userService.user$,
    this.id$,
    this.ownBoard$,
  ]).pipe(
    switchMap(([user, id, isOwnBoard]) => {
      const userId = id ?? user?.localAccountId;
      let boards: Observable<BoardInfo[]>;
      if (!userId) {
        boards = of([]);
      } else {
        boards = this.apiService.loadBoards(userId);
      }

      return boards.pipe(
        switchMap((boards) => {
          if (isOwnBoard) {
            return BingoLocalStorage.loadBoard(this.calculationService).pipe(
              map((localBoard) => {
                if (localBoard.Cells?.length) {
                  return [...boards, localBoard];
                }
                return boards;
              })
            );
          }

          return of(boards);
        })
      );
    })
  );

  public displayedBoards$ = combineLatest([
    this.boards$,
    this.filters$,
    this.sortBy$,
  ]).pipe(
    map(([boards, filters, sortBy]) => {
      if (!filters?.length) return [boards, sortBy] as const;
      return [
        boards.filter(
          (b) =>
            (filters.includes(b.GameMode) ||
              (!filters.includes('traditional') &&
                !filters.includes('todo'))) &&
            ((filters.includes('completed') &&
              filters.includes('incomplete')) ||
              (((filters.includes('completed') && !!b.CompletedAtUtc) ||
                !filters.includes('completed')) &&
                ((filters.includes('incomplete') && !b.CompletedAtUtc) ||
                  !filters.includes('incomplete'))))
        ),
        sortBy,
      ] as const;
    }),
    map(([boards, sortBy]) =>
      boards.sort((a, b) => {
        return sortBy == 'name'
          ? (a.Name ?? 'z').localeCompare(b.Name ?? 'z')
          : sortBy == 'completion'
          ? (b.CompletedAtUtc?.getTime() ?? 0) -
            (a.CompletedAtUtc?.getTime() ?? 0)
          : a.CreatedAtUtc!.getTime() - b.CreatedAtUtc!.getTime();
      })
    ),
    shareReplay(1)
  );
}
