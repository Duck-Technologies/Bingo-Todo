import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  Signal,
} from '@angular/core';
import { BoardCell, BoardInfo } from '../board/board';
import { MatIcon } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { IntlDatePipe } from 'angular-ecmascript-intl';
import { ProgressCircle } from '../progress-circle/progress-circle';
import { BoardCalculations } from '../calculations/board-calculations';
import { NgTemplateOutlet } from '@angular/common';

export const EventType = {
  Creation: 0,
  CellCheck: 100,
  Progress: 101,
  FirstStrike: 200,
  Halfway: 300,
  DeadlineExpiry: 600,
  GameModeChange: 700,
  GameModeCompletion: 1000,
} as const;

type HistoryEvent =
  | {
      label: string;
      date: Date;
      type: Exclude<
        (typeof EventType)[keyof typeof EventType],
        typeof EventType.GameModeCompletion
      >;
    }
  | {
      label: string;
      date: Date | null;
      type: typeof EventType.GameModeCompletion;
      props: {
        reward: string | null;
        deadline: Date | null;
        beforeDeadline: boolean | null;
        gameMode: BoardInfo['GameMode'];
      };
    };

type HistoryGroup = {
  date: string;
  events: HistoryEvent[];
  mainEventType: (typeof EventType)[keyof typeof EventType];
  icon:
    | 'trophy'
    | 'app_registration'
    | 'progressBar'
    | 'hourglass_bottom'
    | 'check'
    | 'star_half'
    | 'firstStrike';
  progress: {
    green: number;
    yellow: number;
  };
};

const icon = {
  [EventType.GameModeCompletion]: 'trophy',
  [EventType.Creation]: 'app_registration',
  [EventType.CellCheck]: 'progressBar',
  [EventType.Progress]: 'progressBar',
  [EventType.DeadlineExpiry]: 'hourglass_bottom',
  [EventType.GameModeChange]: 'app_registration',
  [EventType.FirstStrike]: 'firstStrike',
  [EventType.Halfway]: 'star_half',
} as const;

/**
 * Be aware that this component works just as good as the dates allow it
 * during grouping. If for example a completion date doesn't match up
 * with the check that made the board complete, the check won't be grouped
 * under it.
 */
@Component({
  selector: 'app-board-history',
  imports: [
    IntlDatePipe,
    MatIcon,
    MatCardModule,
    ProgressCircle,
    NgTemplateOutlet,
  ],
  templateUrl: './board-history.html',
  styleUrl: './board-history.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'list',
    'aria-label': 'game history starting from latest events'
  }
})
export class BoardHistory {
  public readonly board = input.required<BoardInfo>();
  private readonly calculationService = inject(BoardCalculations);

  protected EventType = EventType;

  // note that there is this unlikely edge case where the cells would be grouped under a deadline expiry event
  // for this the deadline would have to be at the very exact moment when the cell is checked (same ms)
  public history: Signal<HistoryGroup[]> = computed(() => {
    const board = this.board();
    const groupingState = {
      firstStrikeAdded: false,
      halfwayAdded: false,
    };

    return Object.entries(
      Object.groupBy(
        [
          BoardHistory.getDeadlineExpiredEntry(
            board.TraditionalGame.CompletionDeadlineUtc,
            board.TraditionalGame.CompletedAtUtc,
            !!board.TodoGame.CompletionDeadlineUtc,
            'traditional'
          ),
          BoardHistory.getDeadlineExpiredEntry(
            board.TodoGame.CompletionDeadlineUtc,
            board.TodoGame.CompletedAtUtc,
            !!board.TraditionalGame.CompletionDeadlineUtc ||
              !!board.TraditionalGame.CompletedAtUtc,
            'to-do'
          ),
          BoardHistory.getCompletionEntry(
            board.TraditionalGame.CompletionDeadlineUtc,
            board.TraditionalGame.CompletedAtUtc,
            board.TraditionalGame.CompletionReward,
            'traditional'
          ),
          BoardHistory.getCompletionEntry(
            board.TodoGame.CompletionDeadlineUtc,
            board.TodoGame.CompletedAtUtc,
            board.TodoGame.CompletionReward,
            'todo'
          ),
          ...BoardHistory.getCellCheckEntries(board.Cells),
          {
            label: 'Set game mode to traditional',
            date: board.TraditionalGame.CompletedByGameModeSwitch
              ? board.TraditionalGame.CompletedAtUtc
              : null,
            type: this.EventType.GameModeChange,
          },
          {
            label: 'Set game mode to TO-DO',
            date: board.SwitchedToTodoAfterCompleteDateUtc,
            type: this.EventType.GameModeChange,
          },
          {
            label: 'Created board',
            date: board.CreatedAtUtc,
            type: this.EventType.Creation,
          },
        ]
          .filter((e) => e.date != null)
          .sort((a, b) => b.type - a.type) as HistoryEvent[],
        ({ date }) => date!.toISOString()
      )
    )
      .filter((x) => !!x.at(1)?.length)
      .sort((a, b) => a[0].localeCompare(b[0])) // events should be in order, because the next step adds halfway and first strike
      .map(([date, events]) =>
        BoardHistory.historyEventGroupToHistoryGroup(
          date,
          events as [HistoryEvent, ...HistoryEvent[]], // typescript doesn't get the memo of the filter above
          board.Cells,
          this.calculationService,
          groupingState
        )
      )
      .sort((a, b) => a.date.localeCompare(b.date))
      .reduce(
        (acc, curr, idx, source) =>
          BoardHistory.groupChecksUntilNextMainEvent(
            acc,
            curr,
            idx,
            source,
            board.Cells.length
          ),
        [] as HistoryGroup[]
      )
      .sort((a, b) => b.date.localeCompare(a.date));
  });

  private static addHalfwayIfApplies(
    checkedCount: number,
    total: number,
    events: HistoryEvent[],
    alreadyAdded: boolean
  ) {
    if (
      checkedCount >= total / 2 &&
      events[0].type !== EventType.CellCheck &&
      !alreadyAdded
    ) {
      return true;
    }

    if (
      checkedCount >= total / 2 &&
      events[0].type === EventType.CellCheck &&
      !alreadyAdded
    ) {
      events.unshift({
        label: `${checkedCount > total / 2 ? 'Over h' : 'H'}alfway done`,
        date: events[0].date,
        type: EventType.Halfway,
      });

      return true;
    }

    return false;
  }

  private static addFirstStrikeIfApplies(
    checkedCount: number,
    total: number,
    events: HistoryEvent[],
    alreadyAdded: boolean
  ) {
    if (
      events[0].type === EventType.GameModeCompletion &&
      events[0].props.gameMode === 'traditional' &&
      !alreadyAdded
    ) {
      return true;
    }

    if (
      !!checkedCount &&
      events[0].type === EventType.CellCheck &&
      !alreadyAdded
    ) {
      events.unshift({
        label:
          'BINGO! First strike' +
          (checkedCount >
          BoardCalculations.getBoardDimensionFromCellCount(total)!
            ? 's'
            : ''),
        date: events[0].date,
        type: EventType.FirstStrike,
      });

      return true;
    }

    return false;
  }

  private static calculateProgress(
    cells: BoardCell[],
    asOfDate: Date | undefined | null,
    calculationService: BoardCalculations
  ) {
    if (!asOfDate) {
      return {
        green: 0,
        yellow: 0,
      };
    }

    const mappedCells = cells.map(
      (c, i) =>
        new BoardCell(
          {
            ...c,
            CheckedAtUtc:
              !!c.CheckedAtUtc && c.CheckedAtUtc <= asOfDate
                ? c.CheckedAtUtc
                : null,
          },
          i,
          BoardCalculations.getBoardDimensionFromCellCount(cells.length)!
        )
    );

    BoardCalculations.calculateCellBingoState(mappedCells, calculationService);

    return {
      green: mappedCells.reduce((a, c) => (a += +c.IsInBingoPattern), 0),
      yellow: mappedCells.filter((c) => !!c.CheckedAtUtc).length,
    };
  }

  private static getCellCheckEntries(cells: BoardCell[]) {
    const repeatingLabels =
      Object.entries(Object.groupBy(cells, ({ Name }) => Name ?? ''))?.map(
        (group) =>
          (group?.[1]?.length ?? 0) > 1 ? group![1]![0].Name : undefined
      ) ?? [];
    return cells
      .filter((c) => !!c.CheckedAtUtc)
      .sort((a, b) => a.CheckedAtUtc!.getTime() - b.CheckedAtUtc!.getTime())
      .map((c, i) => ({
        label: repeatingLabels.includes(c.Name)
          ? `${c.Name} (Row ${c.Row} Col ${c.Column})`
          : c.Name,
        date: c.CheckedAtUtc,
        type: EventType.CellCheck,
      }));
  }

  private static getCompletionEntry(
    deadline: Date | null,
    completionDate: Date | null,
    reward: string | null,
    gameMode: BoardInfo['GameMode']
  ) {
    return {
      label: 'Completed the game',
      date: completionDate,
      type: EventType.GameModeCompletion,
      props: {
        gameMode: gameMode,
        reward: reward,
        deadline: deadline,
        beforeDeadline:
          !!deadline && !!completionDate ? deadline > completionDate : null,
      },
    };
  }

  private static getDeadlineExpiredEntry(
    deadline: Date | null,
    completionDate: Date | null,
    hasOtherDeadline: boolean,
    gameMode: 'traditional' | 'to-do'
  ) {
    return {
      label: `Deadline${
        hasOtherDeadline ? ` set for ${gameMode} game` : ''
      } expired`,
      date:
        !!deadline &&
        (deadline > new Date() ||
          (!!completionDate && deadline > completionDate))
          ? null
          : deadline,
      type: EventType.DeadlineExpiry,
    };
  }

  // Each cell check is grouped under a unique date in source.
  // This merges consecutive cell checks under a progress event
  // and stops grouping once a main event is reached.
  // So for example Creation, Check, Check, Check, First strike
  // gets turned into Creation, Progress (3 checks), First strike
  private static groupChecksUntilNextMainEvent(
    acc: HistoryGroup[],
    curr: HistoryGroup,
    idx: number,
    source: HistoryGroup[],
    totalCells: number
  ) {
    if (curr.mainEventType !== EventType.CellCheck) {
      acc.push(curr);
      return acc;
    } else {
      let nextNonCellCheck = source
        .slice(idx)
        .findIndex((curr) => curr.mainEventType !== EventType.CellCheck);
      const lastIncludedIndex =
        nextNonCellCheck === -1
          ? source.length - 1
          : idx + nextNonCellCheck - 1;

      if (acc.at(-1)?.mainEventType !== EventType.Progress) {
        acc.push({
          date: source.at(lastIncludedIndex)?.date!,
          events: [
            {
              date: new Date(source.at(lastIncludedIndex)?.date!),
              label: `Checked ${
                source.at(lastIncludedIndex)!.progress.yellow
              }/${totalCells}`,
              type: EventType.Progress,
            },
            ...source
              .slice(idx, lastIncludedIndex + 1)
              .reduce(
                (acc, curr) => [...acc, ...curr.events],
                [] as HistoryEvent[]
              )
              .sort((a, b) => b.date!.getTime() - a.date!.getTime()),
          ],
          mainEventType: EventType.Progress,
          icon: icon[EventType.CellCheck],
          progress: source.at(lastIncludedIndex)!.progress,
        });
        return acc;
      }
    }
    return acc;
  }

  // maps the date: HistoryEvent[] object to HistoryGroup[]
  // adds the first strike and halfway events
  private static historyEventGroupToHistoryGroup(
    date: string,
    events: [HistoryEvent, ...HistoryEvent[]],
    cells: BoardCell[],
    calculationService: BoardCalculations,
    state: { firstStrikeAdded: boolean; halfwayAdded: boolean }
  ) {
    const progress = BoardHistory.calculateProgress(
      cells,
      events.find((x) => x.type === EventType.CellCheck)?.date,
      calculationService
    );

    state.firstStrikeAdded =
      state.firstStrikeAdded ||
      BoardHistory.addFirstStrikeIfApplies(
        progress.green,
        cells.length,
        events,
        state.firstStrikeAdded
      );

    state.halfwayAdded =
      state.halfwayAdded ||
      BoardHistory.addHalfwayIfApplies(
        progress.yellow,
        cells.length,
        events,
        state.halfwayAdded
      );

    return {
      date: date,
      events: events,
      icon: icon[events[0].type],
      progress: progress,
      mainEventType: events[0].type,
    } as HistoryGroup;
  }
}
