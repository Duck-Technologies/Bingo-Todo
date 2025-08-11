import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  linkedSignal,
  model,
  signal,
} from '@angular/core';
import { Board, BoardInfo } from '../../features/board/board';
import { MatButton, MatIconButton } from '@angular/material/button';
import { BingoLocalStorage } from '../../features/persistence/bingo-local';
import { Router } from '@angular/router';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { FormsModule } from '@angular/forms';
import { BingoApi } from '../../features/persistence/bingo-api';
import { BoardDetailsForm } from '../../features/board-details-form/board-details-form';
import { boardForm } from '../../features/board-details-form/form';
import { MatDivider } from '@angular/material/divider';
import { BoardListView } from '../../features/board-list-view/board-list-view';
import { DatePipe, NgTemplateOutlet } from '@angular/common';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { DeadlineRewardForm } from '../../features/deadline-reward-form/deadline-reward-form';
import { BoardCalculations } from '../../features/calculations/board-calculations';
import { DeadlineHourglass } from '../../features/deadline-hourglass/deadline-hourglass';

@Component({
  selector: 'app-board-page',
  imports: [
    Board,
    MatButton,
    MatIcon,
    MatIconButton,
    MatTooltip,
    MatCheckboxModule,
    FormsModule,
    BoardDetailsForm,
    MatDivider,
    BoardListView,
    NgTemplateOutlet,
    MatButtonToggleModule,
    DeadlineRewardForm,
    DeadlineHourglass,
    DatePipe,
  ],
  templateUrl: './board-page.html',
  styleUrl: './board-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'main',
  },
})
export class BoardPage {
  public readonly board = model.required<BoardInfo>();
  private readonly calculationService = inject(BoardCalculations);
  private readonly bingoApi = inject(BingoApi);

  private readonly router = inject(Router);

  public readonly editMode = signal(false);
  public readonly cells = linkedSignal(() => this.board().Cells);
  public readonly gridMode = signal<'grid' | 'list'>('grid');
  public readonly boardPreviewMode = computed(() =>
    this.gridMode() === 'list'
      ? 'indicator'
      : this.goalReached() || this.editMode()
      ? 'preview'
      : null
  );
  public readonly isLocal = computed(() => this.board().Visibility === 'local');

  public readonly allChecked = computed(() =>
    this.cells().every((c) => c.IsInBingoPattern)
  );

  public readonly endStateMessage = computed(() =>
    BoardPage.generateEndStateMessage(this.board())
  );

  public readonly goalReached = computed(
    () => !!this.board().CompletionDateUtc
  );

  public readonly boardStats = computed(() => ({
    bingoCells: this.cells().reduce(
      (acc, curr) => (acc += +curr.IsInBingoPattern),
      0
    ),
    checkedCells: this.cells().reduce(
      (acc, curr) => (acc += +(curr.CheckedDateUTC != null)),
      0
    ),
  }));

  public readonly pendingSelectCount = computed(() =>
    this.cells().reduce((acc, curr) => (acc += +curr.Selected), 0)
  );

  private readonly bingoReached = computed(() =>
    this.cells().find((c) => c.IsInBingoPattern)
  );

  public groupingOption: 'row' | 'col' | 'diagonal' = 'row';
  public readonly boardForm = boardForm;
  public readonly doDelete = model(false);

  public cancelChanges() {
    this.editMode.set(false);
    this.doDelete.set(false);
  }

  public continueAfterBingo() {
    const updatedBoard = new BoardInfo({
      ...this.board(),
      GameMode: 'todo' as const,
    });

    if (this.isLocal()) {
      this.board.set(updatedBoard);
      BingoLocalStorage.updateBoard(this.board(), this.calculationService);
    } else {
      // this.bingoApi.updateBoard(this.board().Id, updatedBoard).subscribe();
    }
  }

  public editBoard() {
    this.boardForm.reset();
    this.boardForm.enable();
    this.boardForm.patchValue(this.board());
    this.editMode.set(true);
  }

  public saveChanges() {
    // see the constructor of BoardInfo about setting fields to null in case of game mode switch
    // not allowing to change certain fields is the responsibility of the components displaying the inputs
    const updatedBoard = new BoardInfo({
      ...this.boardForm.getRawValue(),
      Cells: this.cells(),
    });

    if (this.isLocal()) {
      if (this.doDelete()) {
        BingoLocalStorage.resetBoard();
        this.router.navigate(['board/create']);
      } else {
        BingoLocalStorage.updateBoard(updatedBoard, this.calculationService);
        this.board.set(updatedBoard);
      }
    } else {
      if (this.doDelete()) {
        // this.bingoApi.deleteBoard(this.board().Id).subscribe();
      } else {
        // this.bingoApi.updateBoard(this.board().Id, formData).subscribe();
      }
    }
    this.editMode.set(false);
  }

  public saveSelected() {
    const updatedBoard = new BoardInfo({
      ...this.board(),
      Cells: this.cells().map((c) => {
        if (c.Selected) {
          c.CheckedDateUTC = new Date();
          c.Selected = false;
        }

        return c;
      }),
    });

    if (this.isLocal()) {
      BingoLocalStorage.updateBoard(updatedBoard, this.calculationService);
      this.board.set(updatedBoard);
    } else {
      // this.bingoApi.updateBoard(this.board().Id, updatedBoard).subscribe();
    }
  }

  public unselect() {
    this.cells.set(
      this.cells().map((c) => {
        if (c.Selected) {
          c.Selected = false;
        }

        return c;
      })
    );
  }

  private static generateEndStateMessage(board: BoardInfo, isOwnBoard = true) {
    if (!board.CompletionDateUtc || !isOwnBoard) {
      return '';
    }

    let message = 'You did it';

    if (
      !!board.CompletionDeadlineUtc &&
      new Date(board.CompletionDateUtc) <= new Date(board.CompletionDeadlineUtc)
    ) {
      message += ' before the deadline!';
    } else {
      message += '!';
    }

    if (board.CompletionReward) {
      message += ` You've earned ${board.CompletionReward}!`;
    }

    return message;
  }
}
