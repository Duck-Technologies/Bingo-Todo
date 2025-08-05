import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  model,
} from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import {
  MAT_TOOLTIP_DEFAULT_OPTIONS,
  MatTooltipModule,
} from '@angular/material/tooltip';
import { BoardCalculations } from './board-calculations';

export type BoardCell = {
  Name: string;
  CheckedDateUTC: Date | null;
  IsBingo: boolean;
  Selected: boolean;

  Row?: number;
  Column?: number;
};

export type BoardInfo = {
  Id?: string;
  Name: string | null;
  GameMode: 'traditional' | 'todo';
  CompletionDeadlineUtc: Date | null;
  Cells: BoardCell[];
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
  private readonly calculationService = inject(BoardCalculations);

  public readonly cards = model.required<BoardCell[]>();
  public readonly previewMode = input.required<
    null | 'indicator' | 'preview'
  >();
  public readonly isPreview = computed(() => this.previewMode() !== null);

  private readonly setting = computed(
    () =>
      ({
        '25': this.calculationService.fiveByFive,
        '16': this.calculationService.fourByFour,
        '9': this.calculationService.threeByThree,
      }[this.cards().length])
  );

  public readonly boardSize = computed(
    () =>
      BoardCalculations.getBoardDimensionFromCellCount(this.cards().length) ?? 0
  );

  public readonly rowIndexes = computed(() =>
    BoardCalculations.getRowIndexes(this.boardSize())
  );

  public readonly bingoRows = computed(() => this.setting()?.rows ?? []);
  public readonly bingoCols = computed(() => this.setting()?.cols ?? []);
  public readonly bingoDiagonal = computed(
    () => this.setting()?.diagonals ?? []
  );

  constructor() {
    let cards = [] as BoardCell[];

    // TODO: rethink this effect approach
    effect(() => {
      if (cards !== this.cards()) {
        const cardsCalculated = this.cards().map((c, i) => {
          c.IsBingo =
            c.IsBingo ||
            (c.CheckedDateUTC !== null &&
              c.CheckedDateUTC !== undefined &&
              (Board.cellInBingoPattern(
                this.bingoDiagonal(),
                this.cards(),
                i
              ) ||
                Board.cellInBingoPattern(this.bingoRows(), this.cards(), i) ||
                Board.cellInBingoPattern(this.bingoCols(), this.cards(), i)));
          return c;
        });
        cards = cardsCalculated;
        this.cards.set(cards);
      }
    });
  }

  public checkCard(card: BoardCell) {
    if (!!card.CheckedDateUTC || this.isPreview()) return;

    card.Selected = !card.Selected;
    this.cards.set([...this.cards()]);
  }

  private static cellInBingoPattern(
    combinations: number[][],
    cards: BoardCell[],
    cellIdx: number
  ) {
    return !!combinations
      .filter((c) => c.includes(cellIdx))
      .find((combination) =>
        combination?.every((x) => cards[x].CheckedDateUTC !== null)
      );
  }
}
