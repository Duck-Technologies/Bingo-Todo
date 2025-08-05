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
import { NgTemplateOutlet } from '@angular/common';
import { MatButtonToggleModule } from '@angular/material/button-toggle';

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
    MatButtonToggleModule
  ],
  templateUrl: './board-page.html',
  styleUrl: './board-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'role': 'main'
  }
})
export class BoardPage {
  public readonly board = model.required<BoardInfo>();

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

  private readonly bingoReached = computed(() =>
    this.cells().find((c) => c.IsBingo)
  );

  private readonly allChecked = computed(() =>
    this.cells().every((c) => c.IsBingo)
  );

  public readonly goalReached = computed(
    () =>
      this.allChecked() ||
      (this.board().GameMode === 'traditional' && !!this.bingoReached())
  );

  public readonly boardStats = computed(() => ({
    bingoCells: this.cells().reduce((acc, curr) => (acc += +curr.IsBingo), 0),
    checkedCells: this.cells().reduce(
      (acc, curr) => (acc += +(curr.CheckedDateUTC != null)),
      0
    ),
  }));

  public readonly pendingSelectCount = computed(() =>
    this.cells().reduce((acc, curr) => (acc += +curr.Selected), 0)
  );

  public groupingOption: 'row' | 'col' | 'diagonal' = 'row';
  private readonly boardForm = boardForm;
  public readonly doDelete = model(false);
  public goalAchieved = false;

  public cancelChanges() {
    this.editMode.set(false);
    this.doDelete.set(false);
  }

  public continueAfterBingo() {
    const updatedBoard = {
      ...this.board(),
      GameMode: 'todo' as const,
    };

    if (this.isLocal()) {
      this.board.set(updatedBoard);
      BingoLocalStorage.updateBoard(this.board());
    } else {
      // this.bingoApi.updateBoard(this.board().Id, updatedBoard).subscribe();
    }
  }

  public editBoard() {
    this.editMode.set(true);
  }

  public saveChanges() {
    this.editMode.set(false);
    const updatedBoard = {
      ...this.boardForm.getRawValue(),
      Cells: this.cells(),
    };

    if (this.isLocal()) {
      if (this.doDelete()) {
        BingoLocalStorage.resetBoard();
        this.router.navigate(['board/create']);
      } else {
        this.board.set(updatedBoard);
        BingoLocalStorage.updateBoard(this.board());
      }
    } else {
      if (this.doDelete()) {
        // this.bingoApi.deleteBoard(this.board().Id).subscribe();
      } else {
        // this.bingoApi.updateBoard(this.board().Id, formData).subscribe();
      }
    }
  }

  public saveSelected() {
    const updatedBoard = {
      ...this.board(),
      Cells: this.cells().map((c) => {
        if (c.Selected) {
          c.CheckedDateUTC = new Date();
          c.Selected = false;
        }

        return c;
      }),
    };

    if (this.isLocal()) {
      this.board.set(updatedBoard);
      this.cells.set(updatedBoard.Cells);
      BingoLocalStorage.updateBoard(this.board());
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
}
