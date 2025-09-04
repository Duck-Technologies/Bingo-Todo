import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  linkedSignal,
  model,
  signal,
} from '@angular/core';
import {
  Board,
  BoardCell,
  BoardInfo,
  copyCells,
} from '../../features/board/board';
import { MatButton, MatIconButton } from '@angular/material/button';
import { BingoLocalStorage } from '../../features/persistence/bingo-local';
import { Router, RouterLink } from '@angular/router';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
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
import { BoardHistory } from '../../features/board-history/board-history';
import { ProgressCircle } from '../../features/progress-circle/progress-circle';
import { MatCardModule } from '@angular/material/card';
import { MatMenuModule } from '@angular/material/menu';
import { ConfirmDialog } from '../../features/confirm-dialog/confirm-dialog';
import { GameModeIcon } from '../../features/game-mode-icon/game-mode-icon';

@Component({
  selector: 'app-board-page',
  imports: [
    Board,
    MatButton,
    MatIcon,
    MatIconButton,
    MatTooltip,
    FormsModule,
    BoardDetailsForm,
    MatDivider,
    BoardListView,
    NgTemplateOutlet,
    MatButtonToggleModule,
    DeadlineRewardForm,
    DeadlineHourglass,
    DatePipe,
    BoardHistory,
    ProgressCircle,
    MatCardModule,
    MatMenuModule,
    RouterLink,
    GameModeIcon,
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

  public readonly displayMode = signal<'board' | 'edit' | 'history'>('board');
  public readonly cells = linkedSignal(() => this.board().Cells);
  public readonly gridMode = signal<'grid' | 'list'>('grid');
  public readonly boardPreviewMode = computed(() =>
    this.gridMode() === 'list'
      ? 'indicator'
      : this.goalReached() || this.displayMode() !== 'board'
      ? 'preview'
      : null
  );
  public readonly isLocal = computed(() => this.board().Visibility === 'local');

  public readonly allChecked = computed(() =>
    this.cells().every((c) => c.IsInBingoPattern)
  );

  public readonly goalReached = computed(() => !!this.board().CompletedAtUtc);

  public readonly traditionalOptionDisabled = computed(
    () =>
      !!this.board().TraditionalGame.CompletedAtUtc &&
      !!this.cells().find(
        (c) =>
          c.CheckedAtUtc &&
          c.CheckedAtUtc > this.board().TraditionalGame.CompletedAtUtc!
      )
  );

  public readonly boardStats = computed(() => ({
    bingoCells: this.cells().reduce(
      (acc, curr) => (acc += +curr.IsInBingoPattern),
      0
    ),
    checkedCells: this.cells().reduce(
      (acc, curr) => (acc += +(curr.CheckedAtUtc != null)),
      0
    ),
  }));

  public readonly pendingSelectCount = computed(() =>
    this.cells().reduce((acc, curr) => (acc += +curr.Selected), 0)
  );

  public groupingOption: 'row' | 'col' | 'diagonal' = 'row';
  public readonly boardForm = boardForm;

  public cancelChanges() {
    this.displayMode.set('board');
  }

  public deleteBoardClick() {
    this.dialog
      .open(ConfirmDialog)
      .afterClosed()
      .pipe(
        switchMap((confirmed) => {
          if (!confirmed) {
            return of(false);
          } else {
            return this.deleteBoard();
          }
        })
      )
      .subscribe();
  }

  public editBoard() {
    this.boardForm.reset();
    this.boardForm.enable();
    this.boardForm.patchValue(this.board());
    this.displayMode.set('edit');
  }

  public saveChanges() {
    // see the constructor of BoardInfo about setting fields to null in case of game mode switch
    // not allowing to change certain fields is the responsibility of the components displaying the inputs
    const formValue = this.boardForm.getRawValue();
    const updatedBoard = new BoardInfo({
      ...formValue,
      TraditionalGame: {
        ...formValue.TraditionalGame,
        CompletedByGameModeSwitch:
          this.board().TraditionalGame.CompletedByGameModeSwitch,
      },
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
        BingoLocalStorage.updateBoard(
          updatedBoard,
          this.calculationService
        ).subscribe({
          next: (board) => {
            if (board !== false) {
              this.board.set(updatedBoard);
            }
          },
        });
      } else {
        this.bingoApi
          .updateBoard(this.board().Id!, updatedBoard)
          .pipe(
            switchMap(() => this.bingoApi.loadBoard(this.board().Id!)),
            tap((board) => this.board.set(board))
          )
          .subscribe();
      }
      this.displayMode.set('board');
    }
  }

  public saveSelected() {
    const selectedIndexes = this.cells()
      .map((c, idx) => {
        if (c.Selected) {
          return idx;
        } else {
          return null;
        }
      })
      .filter((i) => i !== null);

    const isCompleting = BoardPage.isCompleteAfterSave(
      this.board(),
      copyCells(this.cells()).map((c) => {
        if (c.Selected) {
          c.CheckedAtUtc = new Date();
        }
        return c;
      }),
      this.calculationService
    );

    if (isCompleting) {
      this.saveSelectionAndComplete(this.board(), selectedIndexes)
        .pipe(this.afterCompletion)
        .subscribe();
    } else {
      if (this.isLocal()) {
        BingoLocalStorage.saveSelection(
          this.board(),
          selectedIndexes,
          this.calculationService
        ).subscribe({
          next: (board) => {
            if (board != false) {
              this.board.set(board);
            }
          },
        });
      } else {
        this.bingoApi
          .saveSelection(this.board().Id!, selectedIndexes)
          .pipe(
            switchMap(() => this.bingoApi.loadBoard(this.board().Id!)),
            tap((board) => this.board.set(board))
          )
          .subscribe();
      }
    }
  }

  public toggleBoardHistoryDisplay() {
    this.displayMode.set(
      this.displayMode() === 'history' ? 'board' : 'history'
    );
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
          return 'Closed completion dialog';
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
      return BingoLocalStorage.updateBoard(
        this.board(),
        this.calculationService
      ).pipe(
        tap((board) => {
          if (board != false) {
            this.board.set(updatedBoard);
          }
        }),
        map((board) => {
          if (!!board) {
            return 'Successful continue after bingo update';
          } else {
            return 'Failed to switch game mode';
          }
        })
      );
    } else {
      return this.bingoApi.updateBoard(this.board().Id!, updatedBoard).pipe(
        switchMap(() => this.bingoApi.loadBoard(this.board().Id!)),
        tap((board) => this.board.set(board)),
        map(() => 'Successful continue after bingo update')
      );
    }
  }

  private deleteBoard() {
    if (this.isLocal()) {
      BingoLocalStorage.resetBoard();
      this.router.navigate(['board/create']);
      return of('Successful deletion');
    } else {
      return this.bingoApi.deleteBoard(this.board().Id!).pipe(
        map(() => 'Successful deletion'),
        tap(() => this.router.navigate(['board/create']))
      );
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
              map((savedBoard) => (savedBoard === false ? null : savedBoard)),
              tap((_) => {
                this.boardForm.reset();
                this.displayMode.set('board');
              })
            );
          } else {
            return this.bingoApi.updateBoard(this.board().Id!, board).pipe(
              switchMap(() => this.bingoApi.loadBoard(this.board().Id!)),
              tap((board) => {
                this.boardForm.reset();
                this.displayMode.set('board');
                this.board.set(board);
              })
            );
          }
        }
        return of(null);
      })
    );
  }

  private saveSelectionAndComplete(
    board: BoardInfo,
    selectedIndexes: number[]
  ): Observable<BoardInfo<BoardCell> | null> {
    // The deadline reward form uses the form to make some decisions, so if we don't do this
    // the reward input might not show up (noticed while testing)
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
            //TODO only update if reward changed
            return BingoLocalStorage.updateBoard(
              board,
              this.calculationService
            ).pipe(
              switchMap((board) => {
                if (board !== false) {
                  return BingoLocalStorage.saveSelection(
                    board,
                    selectedIndexes,
                    this.calculationService
                  );
                } else {
                  return of(null);
                }
              })
            );
          } else {
            return this.bingoApi
              .updateBoard(this.board().Id!, this.board())
              .pipe(
                switchMap(() =>
                  this.bingoApi.saveSelection(this.board().Id!, selectedIndexes)
                ),
                switchMap(() => this.bingoApi.loadBoard(this.board().Id!))
              );
          }
        }
        return of(null);
      }),
      map((res) => {
        if (!!res) {
          return res;
        } else {
          return null;
        }
      })
    );
  }

  private static isCompleteAfterSave(
    board: BoardInfo,
    cells: BoardCell[],
    calculationService: BoardCalculations
  ) {
    if (
      !!board.TodoGame.CompletedAtUtc ||
      (board.GameMode === 'traditional' &&
        !!board.TraditionalGame.CompletedAtUtc)
    ) {
      return false;
    }

    if (cells.every((c) => !!c.CheckedAtUtc)) {
      return true;
    }

    const calculatedCells = BoardCalculations.calculateCellBingoState(
      JSON.parse(JSON.stringify(cells)),
      calculationService
    );

    return (
      board.GameMode === 'traditional' &&
      !!calculatedCells.find((c) => c.IsInBingoPattern)
    );
  }
}
