import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  Signal,
} from '@angular/core';
import { BoardCell, BoardInfo } from '../board/board';
import { calculateDateFromNow } from '../calculations/date-calculations';
import { MatIcon } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { IntlDatePipe } from 'angular-ecmascript-intl';
import { ProgressCircle } from '../progress-circle/progress-circle';
import { BoardCalculations } from '../calculations/board-calculations';
import { MatTooltip } from '@angular/material/tooltip';

const EventType = {
  GameModeCompletion: 1000,
  Creation: 0,
  CellCheck: 100,
  Progress: 101,
  DeadlineExpiry: 600,
  GameModeChange: 700,
  FirstStrike: 200,
  Halfway: 300,
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
      };
    };

type HistoryGroup = {
  date: string;
  events: HistoryEvent[];
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

@Component({
  selector: 'app-board-history',
  imports: [IntlDatePipe, MatIcon, MatCardModule, ProgressCircle, MatTooltip],
  templateUrl: './board-history.html',
  styleUrl: './board-history.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BoardHistory {
  public readonly board = input.required<BoardInfo>();
  private readonly calculationService = inject(BoardCalculations);

  protected EventType = EventType;
  public icon = {
    [EventType.GameModeCompletion]: 'trophy',
    [EventType.Creation]: 'app_registration',
    [EventType.CellCheck]: 'progressBar',
    [EventType.Progress]: 'progressBar',
    [EventType.DeadlineExpiry]: 'hourglass_bottom',
    [EventType.GameModeChange]: 'app_registration',
    [EventType.FirstStrike]: 'firstStrike',
    [EventType.Halfway]: 'star_half',
  } as const;

  public history: Signal<HistoryGroup[]> = computed(() => {
    const board = this.board();
    let firstStrikeAdded = false;
    let halfwayAdded = false;

    const history = Object.entries(
      Object.groupBy(
        [
          BoardHistory.getDeadlineExpiredEntry(
            board.TraditionalGame.CompletionDeadlineUtc,
            board.TraditionalGame.CompletionDateUtc,
            !!board.TodoGame.CompletionDeadlineUtc,
            'traditional'
          ),
          BoardHistory.getDeadlineExpiredEntry(
            board.TodoGame.CompletionDeadlineUtc,
            board.TodoGame.CompletionDateUtc,
            !!board.TraditionalGame.CompletionDeadlineUtc ||
              !!board.TraditionalGame.CompletionDateUtc,
            'to-do'
          ),
          BoardHistory.getCompletionEntry(
            board.TraditionalGame.CompletionDeadlineUtc,
            board.TraditionalGame.CompletionDateUtc,
            board.TraditionalGame.CompletionReward,
            'traditional'
          ),
          BoardHistory.getCompletionEntry(
            board.TodoGame.CompletionDeadlineUtc,
            board.TodoGame.CompletionDateUtc,
            board.TodoGame.CompletionReward,
            'to-do'
          ),
          ...BoardHistory.getCellCheckEntries(board.Cells),
          {
            label: 'Changed the game mode to traditional',
            date: null,
            type: this.EventType.GameModeChange,
          },
          {
            label: 'Changed the game mode to TODO',
            date: null,
            type: this.EventType.GameModeChange,
          },
          {
            label: 'Created board',
            date: calculateDateFromNow(-900), //board.CreationDateUtc
            type: this.EventType.Creation,
          },
        ]
          .filter((e) => e.date !== null)
          .sort((a, b) => b.type - a.type) as HistoryEvent[],
        ({ date }) => date!.toISOString()
      )
    )
      .filter((x) => !!x.at(1)?.length)
      .map(([date, events]) => {
        events = events as [HistoryEvent, ...HistoryEvent[]]; // we know that there's at least 1 item
        const progress = BoardHistory.calculateProgress(
          board.Cells,
          events.find((x) => x.type === EventType.CellCheck)?.date,
          this.calculationService
        );

        firstStrikeAdded =
          firstStrikeAdded ||
          BoardHistory.addFirstStrikeIfApplies(
            progress.green,
            board.Cells.length,
            events,
            firstStrikeAdded
          );

        halfwayAdded =
          halfwayAdded ||
          BoardHistory.addHalfwayIfApplies(
            progress.yellow,
            board.Cells.length,
            events,
            halfwayAdded
          );

        return {
          date: date,
          events: events,
          icon: this.icon[events[0].type],
          progress: progress,
        };
      })
      .sort((a, b) => a.date.localeCompare(b.date))
      .reduce((acc, curr, idx, source) => {
        if (curr.icon !== this.icon[EventType.CellCheck]) {
          acc.push(curr);
          return acc;
        } else {
          let nextNonCellCheck = source
            .slice(idx)
            .findIndex((curr) => curr.icon !== this.icon[EventType.CellCheck]);
          const lastIncludedIndex =
            nextNonCellCheck === -1
              ? source.length - 1
              : idx + nextNonCellCheck - 1;

          if (acc.at(-1)?.icon !== this.icon[EventType.CellCheck]) {
            acc.push({
              date: source.at(lastIncludedIndex)?.date!,
              events: [
                {
                  date: new Date(source.at(lastIncludedIndex)?.date!),
                  label: `Checked ${
                    source.at(lastIncludedIndex)!.progress.yellow
                  }/${board.Cells.length}`,
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
              icon: this.icon[EventType.CellCheck],
              progress: source.at(lastIncludedIndex)!.progress,
            });
            return acc;
          }
        }
        return acc;
      }, [] as HistoryGroup[])
      .sort((a, b) => b.date.localeCompare(a.date));

    BoardHistory.addSwitchedBackToTraditionalIfApplies(
      history,
      board.GameMode,
      board.TraditionalGame.CompletionDateUtc,
      this.icon[EventType.GameModeChange]
    );

    return history;
  });

  private static addHalfwayIfApplies(
    checkedCount: number,
    total: number,
    events: HistoryEvent[],
    alreadyAdded: boolean
  ) {
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

  private static addSwitchedBackToTraditionalIfApplies(
    history: HistoryGroup[],
    gameMode: BoardInfo['GameMode'],
    traditionalCompletion: Date | null,
    icon: HistoryGroup['icon']
  ) {
    if (
      history[0].events.find((e) => e.type === EventType.CellCheck) &&
      gameMode === 'traditional' &&
      !!traditionalCompletion &&
      history[0].events[0].type !== EventType.GameModeCompletion
    ) {
      history.unshift({
        date: '',
        events: [
          {
            label: 'Switched back to traditional game mode',
            type: EventType.GameModeChange,
            date: new Date(),
          },
        ],
        icon: icon,
        progress: { green: 0, yellow: 0 },
      });
    }
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
            CheckedDateUTC:
              !!c.CheckedDateUTC && c.CheckedDateUTC <= asOfDate
                ? c.CheckedDateUTC
                : null,
          },
          i,
          BoardCalculations.getBoardDimensionFromCellCount(cells.length)!
        )
    );

    BoardCalculations.calculateCellBingoState(mappedCells, calculationService);
    return {
      green: mappedCells.reduce((a, c) => (a += +c.IsInBingoPattern), 0),
      yellow: mappedCells.filter((c) => !!c.CheckedDateUTC).length,
    };
  }

  private static getCellCheckEntries(cells: BoardCell[]) {
    const repeatingLabels =
      Object.entries(Object.groupBy(cells, ({ Name }) => Name ?? ''))?.map(
        (group) =>
          (group?.[1]?.length ?? 0) > 1 ? group![1]![0].Name : undefined
      ) ?? [];
    return cells
      .filter((c) => !!c.CheckedDateUTC)
      .sort((a, b) => a.CheckedDateUTC!.getTime() - b.CheckedDateUTC!.getTime())
      .map((c, i) => ({
        label: repeatingLabels.includes(c.Name)
          ? `${c.Name} (Row ${c.Row} Col ${c.Column})`
          : c.Name,
        date: c.CheckedDateUTC,
        type: EventType.CellCheck,
      }));
  }

  private static getDeadlineExpiredEntry(
    deadline: Date | null,
    completionDate: Date | null,
    hasOtherDeadline: boolean,
    gameMode: 'traditional' | 'to-do'
  ) {
    return {
      label: `Deadline ${
        hasOtherDeadline ? `set for ${gameMode} game ` : ''
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

  private static getCompletionEntry(
    deadline: Date | null,
    completionDate: Date | null,
    reward: string | null,
    gameMode: 'traditional' | 'to-do'
  ) {
    return {
      label: `Completed the game in ${gameMode} mode`,
      date: completionDate,
      type: EventType.GameModeCompletion,
      props: {
        reward: reward,
        deadline: deadline,
        beforeDeadline:
          !!deadline && !!completionDate ? deadline > completionDate : null,
      },
    };
  }
}
