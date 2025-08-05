import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  linkedSignal,
  model,
  OnDestroy,
} from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { BoardCell } from '../board/board';
import { MatDivider } from '@angular/material/divider';
import { toObservable } from '@angular/core/rxjs-interop';
import { debounceTime, tap } from 'rxjs';
import { IntlRelativeTimePipe, IntlDatePipe } from 'angular-ecmascript-intl';
import { MatTooltip } from '@angular/material/tooltip';
import { MatIcon } from '@angular/material/icon';
import { BoardCalculations } from '../board/board-calculations';

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
export class BoardListView implements OnDestroy {
  public readonly cards = model.required<BoardCell[]>();
  public readonly disabled = input.required<boolean>();
  public readonly groupBy = input<'row' | 'col' | 'diagonal'>('row');

  public readonly activeCell = linkedSignal<number>(() => {
    this.groupBy(); // set back to 0 when groupBy changes
    return 0;
  });

  private readonly activeCell$ = toObservable(this.activeCell);

  public readonly boardSize = computed(
    () =>
      BoardCalculations.getBoardDimensionFromCellCount(this.cards().length) ?? 0
  );

  public readonly cardsDisplayed = computed(() => {
    switch (this.groupBy()) {
      case 'row':
        return this.cardsWithPlacement();
      case 'col':
        return BoardCalculations.rowArrayToCols<BoardCell>(
          this.cardsWithPlacement(),
          this.boardSize(),
          this.rowIndexes()
        );
      case 'diagonal':
        return BoardCalculations.rowArrayToDiagonal<BoardCell>(
          this.cardsWithPlacement(),
          this.boardSize(),
          this.rowIndexes()
        );
    }
  });

  private readonly cardsWithPlacement = computed(() =>
    this.cards().map((card, idx) => ({
      Row: Math.floor(idx / this.boardSize()) + 1,
      Column: (idx % this.boardSize()) + 1,
      ...card,
    }))
  );

  public readonly groupAriaLabels = computed(() => {
    if (this.groupBy() === 'diagonal') {
      return ['Diagonal down from top left', 'Diagonal down from top right'];
    }

    const label = this.groupBy() === 'row' ? 'Row' : 'Column';
    return this.rowIndexes().map((row) => `${label} ${row + 1}`);
  });

  public readonly rowIndexes = computed(() =>
    BoardCalculations.getRowIndexes(this.boardSize())
  );

  private readonly scrollSubscription = this.activeCell$
    .pipe(
      debounceTime(100),
      tap((cellIdx) =>
        document
          .getElementById('cell_' + cellIdx)
          ?.scrollIntoView({ block: 'center' })
      )
    )
    .subscribe();

  ngOnDestroy(): void {
    this.scrollSubscription.unsubscribe();
  }

  public checkCard(card: BoardCell | undefined) {
    if (!card || !!card.CheckedDateUTC || this.disabled()) return;

    card.Selected = !card.Selected;
    this.cards.set([...this.cardsWithPlacement()]);
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
      this.checkCard(this.cardsDisplayed().at(this.activeCell()));
    } else {
      preventDefault = false;
    }

    if (preventDefault) {
      event.preventDefault();
    }
  }
}
