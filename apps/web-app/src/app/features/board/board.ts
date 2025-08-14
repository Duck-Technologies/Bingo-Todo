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

export class BoardInfo<T = BoardCell> {
  Id?: string;
  Name: string | null = null;
  GameMode: 'traditional' | 'todo' = 'traditional';
  Cells: T[] = [];
  Visibility: 'local' | 'unlisted' | 'public' = 'local';
  TraditionalGame: GameModeSettings = {
    CompletionDateUtc: null,
    CompletionReward: null,
    CompletionDeadlineUtc: null,
  };
  TodoGame: GameModeSettings = {
    CompletionDateUtc: null,
    CompletionReward: null,
    CompletionDeadlineUtc: null,
  };

  private getGameModeSetting() {
    return this.GameMode === 'traditional'
      ? this.TraditionalGame
      : this.TodoGame;
  }

  set CompletionDateUtc(x) {}
  get CompletionDateUtc() {
    return this.getGameModeSetting().CompletionDateUtc;
  }

  set CompletionReward(x) {}
  get CompletionReward() {
    return this.getGameModeSetting().CompletionReward;
  }

  set CompletionDeadlineUtc(x) {}
  get CompletionDeadlineUtc() {
    return this.getGameModeSetting().CompletionDeadlineUtc;
  }

  constructor(init?: Partial<BoardInfo<T>>) {
    if (!init) return;

    Object.assign(this, init);
    this.Cells = Array.isArray(init.Cells) ? this.Cells : [];

    // clear fields that shouldn't be persisted in case the user switched game modes
    // for example if they switch from traditional to to do mode but never completed the game in traditional mode,
    // there's no point in keeping the reward and deadline associated to traditional mode
    // however if they switch to todo and they've completed it in traditional, we leave whatever's passed in alone
    if (
      this.GameMode === 'traditional' &&
      this.TodoGame.CompletionDateUtc === null
    ) {
      this.TodoGame.CompletionDateUtc =
        this.TodoGame.CompletionReward =
        this.TodoGame.CompletionDeadlineUtc =
          null;
    }

    if (
      this.GameMode === 'todo' &&
      this.TraditionalGame.CompletionDateUtc === null
    ) {
      this.TraditionalGame.CompletionDateUtc =
        this.TraditionalGame.CompletionReward =
        this.TraditionalGame.CompletionDeadlineUtc =
          null;
    }

    this.TraditionalGame.CompletionDateUtc = this.TraditionalGame.CompletionDateUtc ? new Date(this.TraditionalGame.CompletionDateUtc) : null;
    this.TraditionalGame.CompletionDeadlineUtc = this.TraditionalGame.CompletionDeadlineUtc ? new Date(this.TraditionalGame.CompletionDeadlineUtc) : null;
    this.TodoGame.CompletionDateUtc = this.TodoGame.CompletionDateUtc ? new Date(this.TodoGame.CompletionDateUtc) : null;
    this.TodoGame.CompletionDeadlineUtc = this.TodoGame.CompletionDeadlineUtc ? new Date(this.TodoGame.CompletionDeadlineUtc) : null;
  }
}

export type GameModeSettings = {
  CompletionDateUtc: Date | null;
  CompletionReward: string | null;
  CompletionDeadlineUtc: Date | null;
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
