import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
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
  },
})
export class Board {
  private calculationService = inject(BoardCalculations);

  public cards = input.required<BoardCell[]>();
  public previewMode = input.required<null | 'indicator' | 'preview'>();
  public reachedBingo = output<boolean>();
  public checkedAll = output<boolean>();
  public isPreview = computed(() => this.previewMode() !== null);

  private setting = computed(
    () =>
      ({
        '25': this.calculationService.fiveByFive,
        '16': this.calculationService.fourByFour,
        '9': this.calculationService.threeByThree,
      }[this.cards().length])
  );

  public mode = computed(
    () => ({ '25': 5, '16': 4, '9': 3 }[this.cards().length] ?? 0)
  );

  public bingoRows = computed(() => this.setting()?.rows ?? []);

  public bingoCols = computed(() => this.setting()?.cols ?? []);

  public bingoDiagonal = computed(() => this.setting()?.diagonals ?? []);

  public displayedCards = computed(() =>
    this.cards().map((c, i) => {
      c.IsBingo =
        c.IsBingo ||
        (c.CheckedDateUTC !== null &&
          c.CheckedDateUTC !== undefined &&
          (Board.cellInBingoFormation(this.bingoDiagonal(), this.cards(), i) ||
            Board.cellInBingoFormation(this.bingoRows(), this.cards(), i) ||
            Board.cellInBingoFormation(this.bingoCols(), this.cards(), i)));
      return c;
    })
  );

  constructor() {
    effect(() => {
      const reached = this.displayedCards().find((c) => c.IsBingo);
      if (reached) {
        this.reachedBingo.emit(true);
      }
      if (!this.displayedCards().find(c => !c.IsBingo)) {
        this.checkedAll.emit(true);
      }
    });
  }

  public checkCard(card: BoardCell) {
    if (!!card.CheckedDateUTC || this.isPreview()) return;

    card.Selected = !card.Selected;
  }

  private static cellInBingoFormation(
    combinations: number[][],
    cards: BoardCell[],
    cellIdx: number
  ) {
    const combinationsToCheck = combinations.filter((c) => c.includes(cellIdx));
    return !!combinationsToCheck.find((combination) =>
      combination?.every((x) => cards[x].CheckedDateUTC !== null)
    );
  }
}
