import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
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
import {
  catchError,
  EMPTY,
  map,
  Observable,
  of,
  pipe,
  switchMap,
  tap,
  throwError,
} from 'rxjs';
import { BoardHistory } from '../../features/board-history/board-history';
import { ProgressCircle } from '../../features/progress-circle/progress-circle';
import { MatCardModule } from '@angular/material/card';
import { MatMenuModule } from '@angular/material/menu';
import { ConfirmDialog } from '../../features/confirm-dialog/confirm-dialog';
import { GameModeIcon } from '../../features/game-mode-icon/game-mode-icon';
import { HttpErrorResponse, HttpStatusCode } from '@angular/common/http';
import { Message } from '../../features/message/message';
import { Title } from '@angular/platform-browser';

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
    Message,
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
  private readonly titleService = inject(Title);

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
  public readonly displayConflictMessage = signal(false);

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

  constructor() {
    effect(() => {
      if (
        this.titleService.getTitle() != (this.board().Name || 'Untitled board')
      )
        this.titleService.setTitle(this.board().Name || 'Untitled board');
    });
  }

  public cancelChanges() {
    if (this.displayConflictMessage()) {
      this.bingoApi
        .loadBoard(this.board().Id!)
        .pipe(
          tap((board) => {
            this.board.set(board);
            this.displayConflictMessage.set(false);
            this.displayMode.set('board');
          })
        )
        .subscribe();
    } else {
      this.displayMode.set('board');
    }
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
    if (!this.isLocal()) {
      this.bingoApi
        .loadBoard(this.board().Id!)
        .pipe(
          tap((board) => {
            if (!!board) {
              this.board.set(board);
              this.boardForm.reset();
              this.boardForm.enable();
              this.boardForm.patchValue(this.board());
              this.displayMode.set('edit');
            }
          })
        )
        .subscribe();
    } else {
      this.boardForm.reset();
      this.boardForm.enable();
      this.boardForm.patchValue(this.board());
      this.displayMode.set('edit');
    }
  }

  public saveChanges() {
    // see the constructor of BoardInfo about setting fields to null in case of game mode switch
    // not allowing to change certain fields is the responsibility of the components displaying the inputs
    const formValue = this.boardForm.getRawValue();
    const updatedBoard = new BoardInfo({
      ...formValue,
      Etag: this.board().Etag,
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
      const request = this.isLocal()
        ? BingoLocalStorage.updateBoard(updatedBoard, this.calculationService)
        : this.bingoApi
            .updateBoard(this.board().Id!, updatedBoard)
            .pipe(switchMap(() => this.bingoApi.loadBoard(this.board().Id!)));

      request
        .pipe(
          tap((board) => {
            if (!!board) {
              this.board.set(board);
            }
            this.displayMode.set('board');
          }),
          catchError((e) => {
            this.handleError(e);
            return of(null);
          })
        )
        .subscribe();
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
          .saveSelection(this.board().Id!, selectedIndexes, this.board().Etag)
          .pipe(
            catchError((e) => {
              this.handleError(e);
              return throwError(() => e);
            }),
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

    const request = this.isLocal()
      ? BingoLocalStorage.updateBoard(
          updatedBoard,
          this.calculationService
        ).pipe(map((savedBoard) => (savedBoard === false ? null : savedBoard)))
      : this.bingoApi
          .updateBoard(this.board().Id!, updatedBoard)
          .pipe(switchMap(() => this.bingoApi.loadBoard(this.board().Id!)));

    return request.pipe(
      catchError((e) => {
        // conflict can happen if the user leaves the complete dialog open
        // and modifies the board on a different tab before clicking continue on the current one
        this.handleError(e);
        return throwError(() => e);
      }),
      map((board) => {
        if (!!board) {
          this.board.set(board);
          return 'Successful continue after bingo update';
        } else {
          return 'Failed to switch game mode';
        }
      })
    );
  }

  private deleteBoard() {
    if (this.isLocal()) {
      BingoLocalStorage.resetBoard();
      this.router.navigateByUrl('');
      return of('Successful deletion');
    } else {
      return this.bingoApi.deleteBoard(this.board().Id!).pipe(
        map(() => 'Successful deletion'),
        tap(() => this.router.navigateByUrl(''))
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
        if (!result) {
          return of(null);
        }

        const formValue = this.boardForm.getRawValue();
        board.TodoGame.CompletionReward = formValue.TodoGame.CompletionReward;
        board.TraditionalGame.CompletionReward =
          formValue.TraditionalGame.CompletionReward;
        board = new BoardInfo(board);
        board.Etag = this.board().Etag;

        const request = this.isLocal()
          ? BingoLocalStorage.updateBoard(board, this.calculationService).pipe(
              map((savedBoard) => (savedBoard === false ? null : savedBoard))
            )
          : this.bingoApi
              .updateBoard(this.board().Id!, board)
              .pipe(switchMap(() => this.bingoApi.loadBoard(this.board().Id!)));

        return request.pipe(
          catchError((e) => {
            // conflict can happen if the user has the board open in two tabs, changes game mode to traditional
            // on both, completes on the other tab, and then tries to proceed in this one
            this.handleError(e);
            return throwError(() => e);
          }),
          tap((board) => {
            this.boardForm.reset();
            this.displayMode.set('board');
            if (!!board) {
              this.board.set(board);
            }
          })
        );
      })
    );
  }

  private handleError(response: any) {
    if (!(response instanceof HttpErrorResponse)) {
      return;
    }

    if (response.status == HttpStatusCode.Conflict) {
      if (this.displayMode() == 'edit') {
        this.displayConflictMessage.set(true);
      } else {
        this.dialog.open(ConfirmDialog, {
          data: {
            type: 'alert',
            alertTitle: 'Conflict',
            alertDescription:
              "You've modified the board elsewhere. You should reload the page.",
          },
        });
      }
    }

    // update bad requests shouldn't really happen. The user will get conflict
    // if they modify the board somewhere else.
    if (response.status == HttpStatusCode.BadRequest) {
      if (response.error.includes("The board can't be updated")) {
        this.dialog.open(ConfirmDialog, {
          data: {
            type: 'alert',
            alertTitle: response.error,
            alertDescription:
              "Maybe you've modified the board elsewhere. You should reload the page.",
          },
        });
      }

      if (JSON.stringify(response.error).includes('must be in the future')) {
        this.dialog.open(ConfirmDialog, {
          data: {
            type: 'alert',
            alertTitle: 'Invalid update',
            alertDescription:
              "Please set your deadline again as it's no longer valid.",
          },
        });
      }
    }
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
        if (!result) {
          return of(null);
        }

        const formValue = this.boardForm.getRawValue();
        const rewardChanged =
          board.TodoGame.CompletionReward !=
            formValue.TodoGame.CompletionReward ||
          board.TraditionalGame.CompletionReward !=
            formValue.TraditionalGame.CompletionReward;

        board.TodoGame.CompletionReward = formValue.TodoGame.CompletionReward;
        board.TraditionalGame.CompletionReward =
          formValue.TraditionalGame.CompletionReward;
        board = new BoardInfo(board);

        const request: Observable<false | void | BoardInfo<BoardCell>> =
          !rewardChanged
            ? of(board)
            : this.isLocal()
            ? BingoLocalStorage.updateBoard(board, this.calculationService)
            : this.bingoApi.updateBoard(board.Id!, board).pipe(
                catchError((e) => {
                  // in case of conflict worst case is that the board is already in a different mode, so
                  // we would accidentally modify the game mode and reward which could result in bad request;
                  // best case is that the user only modified the name in which case this is kind of inconvenient
                  this.handleError(e);
                  return throwError(() => e);
                })
              );

        return request.pipe(
          switchMap((board) => {
            if (this.isLocal()) {
              return !board
                ? of(null)
                : BingoLocalStorage.saveSelection(
                    board,
                    selectedIndexes,
                    this.calculationService
                  );
            } else {
              return this.bingoApi
                .saveSelection(
                  this.board().Id!,
                  selectedIndexes,
                  this.board().Etag
                )
                .pipe(
                  catchError((e) => {
                    this.handleError(e);
                    return throwError(() => e);
                  }),
                  switchMap(() => this.bingoApi.loadBoard(this.board().Id!))
                );
            }
          })
        );
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
