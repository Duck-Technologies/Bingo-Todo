import {
  ChangeDetectionStrategy,
  Component,
  inject,
  model,
} from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogTitle,
  MatDialogContent,
  MatDialogActions,
  MatDialogClose,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { Message } from '../message/message';
import { DeadlineRewardForm } from '../deadline-reward-form/deadline-reward-form';
import { BoardInfo } from '../board/board';
import { MatCheckbox } from "@angular/material/checkbox";
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-completion-dialog',
  imports: [
    MatButtonModule,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatDialogClose,
    Message,
    DeadlineRewardForm,
    MatCheckbox,
    FormsModule
],
  templateUrl: './completion-dialog.html',
  styleUrl: './completion-dialog.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompletionDialog {
  readonly dialogRef = inject(MatDialogRef<CompletionDialog>);
  readonly data = inject<{ board: BoardInfo }>(MAT_DIALOG_DATA);
  public readonly deleteBoard = model(false);

  public readonly endStateMessage = CompletionDialog.generateEndStateMessage(
    this.data.board
  );

  private static generateEndStateMessage(board: BoardInfo) {
    if (!board.CompletedAtUtc) {
      return '';
    }

    let message = 'You did it';

    if (
      !!board.CompletionDeadlineUtc &&
      new Date(board.CompletedAtUtc) <= new Date(board.CompletionDeadlineUtc)
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
