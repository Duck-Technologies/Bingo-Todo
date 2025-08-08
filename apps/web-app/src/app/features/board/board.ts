import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  model,
} from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import {
  MAT_TOOLTIP_DEFAULT_OPTIONS,
  MatTooltipModule,
} from '@angular/material/tooltip';
import { BoardCalculations } from '../calculations/board-calculations';

export type BoardCellDto = Omit<
  BoardCell,
  'IsInBingoPattern' | 'Selected' | 'Row' | 'Column'
>;

export class BoardCell {
  public Name: string | null;
  public CheckedDateUTC: Date | null;
  public IsInBingoPattern: boolean;
  public Selected: boolean;
  public Row: number;
  public Column: number;

  constructor(cell: Partial<BoardCell>, index: number, boardDimension: number) {
    this.Name = cell.Name ?? null;
    this.CheckedDateUTC = cell.CheckedDateUTC
      ? new Date(cell.CheckedDateUTC)
      : null;
    this.IsInBingoPattern = false;
    this.Selected = false;
    this.Row = Math.floor(index / boardDimension) + 1;
    this.Column = (index % boardDimension) + 1;
  }
}

export type BoardInfo<T = BoardCell> = {
  Id?: string;
  Name: string | null;
  GameMode: 'traditional' | 'todo';
  CompletionDateUtc: Date | null;
  FirstBingoReachedDateUtc: Date | null;
  CompletionDeadlineUtc: Date | null;
  CompletionReward: string | null;
  Cells: T[];
  Visibility: 'local' | 'unlisted' | 'public';
};

@Component({
  selector: 'app-board',
  imports: [MatCardModule, MatTooltipModule],
  providers: [
    {
      provide: MAT_TOOLTIP_DEFAULT_OPTIONS,
      useValue: {
        disableTooltipInteractivity: true,
      },
    },
  ],
  templateUrl: './board.html',
  styleUrl: './board.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.indicator]': "previewMode() === 'indicator'",
    '[class.preview]': "previewMode() === 'preview'",
    '[class.three]': ' boardSize() === 3',
    '[class.four]': ' boardSize() === 4',
    '[class.five]': ' boardSize() === 5',
    role: 'grid',
    'aria-multiselectable': 'true',
    'aria-label': 'BINGO board',
    '[attr.aria-readonly]': "previewMode() === 'preview'",
    '[attr.aria-hidden]': "previewMode() === 'indicator'",
  },
})
export class Board {
  public readonly cards = model.required<BoardCell[]>();
  public readonly previewMode = input.required<
    null | 'indicator' | 'preview'
  >();
  public readonly isPreview = computed(() => this.previewMode() !== null);

  public readonly boardSize = computed(
    () =>
      BoardCalculations.getBoardDimensionFromCellCount(this.cards().length) ?? 0
  );

  public readonly rowIndexes = computed(() =>
    BoardCalculations.getRowIndexes(this.boardSize())
  );

  public checkCard(card: BoardCell) {
    if (!!card.CheckedDateUTC || this.isPreview()) return;

    card.Selected = !card.Selected;
    this.cards.set([...this.cards()]);
  }

  public handleCheckboxKeydown(event: KeyboardEvent, card: BoardCell) {
    if (event.code === 'Space') {
      // for some reason when pressing space on the checkbox, the card click
      // event also fires even with stopPropagation, but
      // that's implicit behavior I would rather not have
      event.preventDefault();
      this.checkCard(card);
    }
  }
}
