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

export function copyCells(cells: BoardCell[]) {
  return cells.map((c, idx) => {
    const cell = new BoardCell(
      c,
      idx,
      BoardCalculations.getBoardDimensionFromCellCount(cells.length) as number
    );

    // Selected and IsInBingoPattern is set to default with each "new BoardCell" call
    cell.Selected = cells[idx].Selected;
    return cell;
  });
}

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
  CreatedAtUtc: Date | undefined;
  CreatedBy: string = 'local user';
  LastChangedAtUtc: Date | undefined;
  Cells: T[] = [];
  Visibility: 'local' | 'unlisted' | 'public' = 'local';
  SwitchedToTodoAfterCompleteDateUtc: Date | undefined;
  TraditionalGame: GameModeSettings & { CompletedByGameModeSwitch?: boolean } =
    {
      CompletedAtUtc: null,
      CompletionReward: null,
      CompletionDeadlineUtc: null,
      CompletedByGameModeSwitch: false,
    };
  TodoGame: GameModeSettings = {
    CompletedAtUtc: null,
    CompletionReward: null,
    CompletionDeadlineUtc: null,
  };

  private getGameModeSetting() {
    return this.GameMode === 'traditional'
      ? this.TraditionalGame
      : this.TodoGame;
  }

  set CompletedAtUtc(x) {}
  get CompletedAtUtc() {
    return this.getGameModeSetting().CompletedAtUtc;
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
      this.TodoGame.CompletedAtUtc === null
    ) {
      this.TodoGame.CompletedAtUtc =
        this.TodoGame.CompletionReward =
        this.TodoGame.CompletionDeadlineUtc =
          null;
    }

    if (
      this.GameMode === 'todo' &&
      this.TraditionalGame.CompletedAtUtc === null
    ) {
      this.TraditionalGame.CompletedAtUtc =
        this.TraditionalGame.CompletionReward =
        this.TraditionalGame.CompletionDeadlineUtc =
          null;
    }

    this.TraditionalGame.CompletedAtUtc = normalizeDate(this.TraditionalGame.CompletedAtUtc);
    this.TraditionalGame.CompletionDeadlineUtc = normalizeDate(this.TraditionalGame.CompletionDeadlineUtc);
    this.TodoGame.CompletedAtUtc = normalizeDate(this.TodoGame.CompletedAtUtc);
    this.TodoGame.CompletionDeadlineUtc = normalizeDate(this.TodoGame.CompletionDeadlineUtc);
    this.SwitchedToTodoAfterCompleteDateUtc = normalizeDate(this.SwitchedToTodoAfterCompleteDateUtc) ?? undefined;
    this.LastChangedAtUtc = normalizeDate(this.LastChangedAtUtc) ?? undefined;
    this.CreatedAtUtc = normalizeDate(this.CreatedAtUtc) ?? undefined;
  }
}

export type GameModeSettings = {
  CompletedAtUtc: Date | null;
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

function normalizeDate(date: string | Date | undefined | null) {
  return date ? new Date(date) : null
}
