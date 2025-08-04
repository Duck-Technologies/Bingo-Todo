import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  model,
  signal,
} from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { BoardCell } from '../board/board';
import { MatDivider } from '@angular/material/divider';
import { toObservable } from '@angular/core/rxjs-interop';
import { debounceTime, tap } from 'rxjs';
import { IntlRelativeTimePipe, IntlDatePipe } from 'angular-ecmascript-intl';
import { MatTooltip } from '@angular/material/tooltip';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-board-list-view',
  imports: [
    MatCardModule,
    MatDivider,
    IntlRelativeTimePipe,
    IntlDatePipe,
    MatTooltip,
    MatIcon,
  ],
  templateUrl: './board-list-view.html',
  styleUrl: './board-list-view.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'listbox',
    'aria-label': 'BINGO board',
    'aria-multiselectable': 'true',
    '[attr.aria-activedescendant]': '"cell_" + activeCell()',
    '[attr.aria-readonly]': 'disabled()',
    '(keydown)': 'reactToKeypress($event);',
  },
})
export class BoardListView {
  public readonly cards = model.required<BoardCell[]>();
  public readonly disabled = input.required<boolean>();

  protected activeCell = signal<number>(0);
  private activeCell$ = toObservable(this.activeCell);

  public readonly boardSize = computed(
    () => (({ 9: 3, 16: 4, 25: 5 } as const)[this.cards().length] ?? 3)
  );

  public readonly mode = computed(
    () => ({ '25': 5, '16': 4, '9': 3 }[this.cards().length] ?? 0)
  );

  public readonly rows = computed(() => [...Array(this.mode()).keys()]);

  constructor() {
    this.activeCell$
      .pipe(
        debounceTime(100),
        tap((cellIdx) =>
          document
            .getElementById('cell_' + cellIdx)
            ?.scrollIntoView({ block: 'center' })
        )
      )
      .subscribe();
  }

  public checkCard(card: BoardCell | undefined) {
    if (!card || !!card.CheckedDateUTC || this.disabled()) return;

    card.Selected = !card.Selected;
    this.cards.set([...this.cards()]);
  }

  public reactToKeypress(event: KeyboardEvent) {
    if (event.shiftKey || event.metaKey || event.altKey || event.ctrlKey) {
      return;
    }

    let preventDefault = true;

    if (
      event.key === 'ArrowDown' &&
      this.activeCell() !== this.cards().length - 1
    ) {
      this.activeCell.set(this.activeCell() + 1);
    } else if (event.key === 'ArrowUp' && this.activeCell() > 0) {
      this.activeCell.set(this.activeCell() - 1);
    } else if (event.key === 'End') {
      this.activeCell.set(this.cards().length - 1);
    } else if (event.key === 'Home') {
      this.activeCell.set(0);
    } else if (event.code === 'Space') {
      this.checkCard(this.cards().at(this.activeCell()));
    } else {
      preventDefault = false;
    }

    if (preventDefault) {
      event.preventDefault();
    }
  }
}
