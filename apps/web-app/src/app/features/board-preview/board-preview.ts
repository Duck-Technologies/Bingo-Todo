import {
  ChangeDetectionStrategy,
  Component,
  input,
  computed,
  inject,
  OnInit,
  viewChild,
  ElementRef,
  signal,
  OnDestroy,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { Board, BoardInfo } from '../board/board';
import { MatIcon } from '@angular/material/icon';
import { DeadlineHourglass } from '../deadline-hourglass/deadline-hourglass';
import { ProgressCircle } from '../progress-circle/progress-circle';
import { GameModeIcon } from '../game-mode-icon/game-mode-icon';
import { MatTooltip } from '@angular/material/tooltip';
import { MatCard, MatCardModule } from '@angular/material/card';
import { Router } from '@angular/router';
import { IntlRelativeTimePipe } from 'angular-ecmascript-intl';
import { BoardCalculations } from '../calculations/board-calculations';

@Component({
  selector: 'app-board-preview',
  imports: [
    Board,
    MatIcon,
    DeadlineHourglass,
    DatePipe,
    ProgressCircle,
    MatTooltip,
    GameModeIcon,
    MatCardModule,
    IntlRelativeTimePipe,
  ],
  templateUrl: './board-preview.html',
  styleUrl: './board-preview.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(click)': 'open()',
  },
})
export class BoardPreview implements OnInit, OnDestroy {
  public cellsSection =
    viewChild.required<ElementRef<HTMLElement>>('cellSummary');
  public readonly overflowing = signal(false);

  public readonly board = input.required<BoardInfo>();
  public readonly router = inject(Router);

  public readonly boardStats = computed(() => ({
    bingoCells: this.board().Cells.reduce(
      (acc, curr) => (acc += +curr.IsInBingoPattern),
      0
    ),
    checkedCells: this.board().Cells.reduce(
      (acc, curr) => (acc += +(curr.CheckedAtUtc != null)),
      0
    ),
  }));

  public readonly beforeDeadline = computed(() => {
    const deadline = this.board().CompletionDeadlineUtc;
    return deadline == null ? null : deadline > new Date();
  });

  public readonly cells = computed(() => {
    return this.board().Cells.toSorted(
      (a, b) => a.Name!.length - b.Name!.length
    );
  });

  public readonly boardSize = computed(() =>
    BoardCalculations.getBoardDimensionFromCellCount(this.board().Cells.length)
  );

  private unobserve: () => void = () => undefined;

  ngOnInit(): void {
    const resizeObserver = new ResizeObserver((entries) => {
      this.overflowing.set(
        entries[0].target.scrollHeight >
          Math.ceil(entries[0].contentRect.height)
      );
    });

    resizeObserver.observe(this.cellsSection().nativeElement);
    this.unobserve = () =>
      resizeObserver?.unobserve(this.cellsSection().nativeElement);
  }

  ngOnDestroy(): void {
    this.unobserve();
  }

  public open() {
    if (this.board().Visibility == 'local') {
      this.router.navigateByUrl(`/board/local`);
    } else {
      this.router.navigateByUrl(`/board/${this.board().Id!}`);
    }
  }
}
