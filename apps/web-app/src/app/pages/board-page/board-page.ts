import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  linkedSignal,
  model,
  signal,
} from '@angular/core';
import { Board, BoardCell, BoardInfo } from '../../features/board/board';
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
import { MatDialog } from '@angular/material/dialog';
import { CompletionDialog } from '../../features/completion-warn-dialog/completion-dialog';
import { EMPTY, map, Observable, of, pipe, switchMap, tap } from 'rxjs';

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

  private readonly bingoApi = inject(BingoApi);
  private readonly calculationService = inject(BoardCalculations);
  private readonly dialog = inject(MatDialog);
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

  public editBoard() {
    this.boardForm.reset();
    this.boardForm.enable();
    this.boardForm.patchValue(this.board());
    this.editMode.set(true);
  }

  public saveChanges() {
    if (this.doDelete()) {
      this.deleteBoard();
      return;
    }
    
    // see the constructor of BoardInfo about setting fields to null in case of game mode switch
    // not allowing to change certain fields is the responsibility of the components displaying the inputs
    const updatedBoard = new BoardInfo({
      ...this.boardForm.getRawValue(),
      Cells: this.cells(),
    });

    const isCompleting = BoardPage.isCompleteAfterSave(
      updatedBoard,
      updatedBoard.Cells,
      this.calculationService
    );

    if (isCompleting) {
      // when changing game mode from todo to traditional this can happen
      this.saveCompletion(updatedBoard).pipe(this.afterCompletion).subscribe();
    } else {
      if (this.isLocal()) {
        BingoLocalStorage.updateBoard(updatedBoard, this.calculationService);
        this.board.set(updatedBoard);
      } else {
        // this.bingoApi.updateBoard(this.board().Id, formData).subscribe();
      }
      this.editMode.set(false);
    }
  }

  public saveSelected() {
    const updatedBoard = new BoardInfo({
      ...this.board(),
      Cells: this.cells().map((c, idx) => {
        const cell = new BoardCell(
          c,
          idx,
          BoardCalculations.getBoardDimensionFromCellCount(
            this.cells().length
          ) as number
        );
        if (c.Selected) {
          cell.CheckedDateUTC = new Date();
        }

        return cell;
      }),
    });

    const isCompleting = BoardPage.isCompleteAfterSave(
      this.board(),
      updatedBoard.Cells,
      this.calculationService
    );

    if (isCompleting) {
      this.saveCompletion(updatedBoard).pipe(this.afterCompletion).subscribe();
    } else {
      if (this.isLocal()) {
        BingoLocalStorage.updateBoard(updatedBoard, this.calculationService);
        this.board.set(updatedBoard);
      } else {
        // this.bingoApi.updateBoard(this.board().Id, updatedBoard).subscribe();
      }
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

  private readonly afterCompletion = pipe(
    switchMap((board: null | BoardInfo) => {
      if (board === null) {
        return EMPTY;
      } else {
        this.board.set(board);

        const dialogRef = this.dialog.open(CompletionDialog, {
          disableClose: true,
          data: { board: board },
        });

        return dialogRef.afterClosed() as Observable<
          undefined | 'continue' | 'delete'
        >;
      }
    }),
    switchMap((action) => {
      switch (action) {
        case 'continue':
          return this.continueAfterBingo();
        case 'delete':
          return this.deleteBoard();
        default:
          return "Closed completion dialog";
      }
    })
  );

  private continueAfterBingo() {
    const updatedBoard = new BoardInfo({
      ...this.board(),
      GameMode: 'todo' as const,
    });

    if (this.isLocal()) {
      this.board.set(updatedBoard);
      BingoLocalStorage.updateBoard(this.board(), this.calculationService);
      return of("Successful continue after bingo update");
    } else {
      return of("Successful continue after bingo update");
      // this.bingoApi.updateBoard(this.board().Id, updatedBoard).subscribe();
    }
  }

  private deleteBoard() {
    if (this.isLocal()) {
      BingoLocalStorage.resetBoard();
      this.router.navigate(['board/create']);
      return of("Successful deletion");
    } else {
      return of("Successful deletion");
      // this.bingoApi.deleteBoard(this.board().Id).subscribe();
    }
  }

  private saveCompletion(board: BoardInfo) {
    this.boardForm.reset();
    this.boardForm.enable();
    this.boardForm.patchValue(board);

    const dialogRef = this.dialog.open(CompletionDialog, {
      data: { board: board },
    });

    return dialogRef.afterClosed().pipe(
      switchMap((result: undefined | string) => {
        if (result !== undefined) {
          const formValue = this.boardForm.getRawValue();
          board.TodoGame.CompletionReward = formValue.TodoGame.CompletionReward;
          board.TraditionalGame.CompletionReward =
            formValue.TraditionalGame.CompletionReward;
          board = new BoardInfo(board);

          if (this.isLocal()) {
            return BingoLocalStorage.updateBoard(
              board,
              this.calculationService
            ).pipe(
              tap((_) => {
                this.boardForm.reset();
                this.editMode.set(false);
              }),
              map((_) => board)
            );
          } else {
            // this.bingoApi.updateBoard(this.board().Id, updatedBoard).subscribe();
            return of(null); // should return board as well
          }
        }
        return of(null);
      })
    );
  }

  private static isCompleteAfterSave(
    board: BoardInfo,
    cells: BoardCell[],
    calculationService: BoardCalculations
  ) {
    const calculatedCells = BoardCalculations.calculateCellBingoState(
      JSON.parse(JSON.stringify(cells)),
      calculationService
    );

    if (
      !!board.TodoGame.CompletionDateUtc ||
      (board.GameMode === 'traditional' &&
        !!board.TraditionalGame.CompletionDateUtc)
    ) {
      return false;
    }

    return (
      (board.GameMode === 'traditional' &&
        !!calculatedCells.find((c) => c.IsInBingoPattern)) ||
      !calculatedCells.find((c) => !c.IsInBingoPattern)
    );
  }
}
