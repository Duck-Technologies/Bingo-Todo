import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MatDialogTitle,
  MatDialogContent,
  MatDialogActions,
  MatDialogClose,
  MAT_DIALOG_DATA,
  MatDialogRef,
} from '@angular/material/dialog';
import { Message } from '../message/message';
import { BoardInfo } from '../board/board';

@Component({
  selector: 'app-save-warn-dialog',
  imports: [
    MatButtonModule,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatDialogClose,
    Message,
  ],
  templateUrl: './save-warn-dialog.html',
  styleUrl: './save-warn-dialog.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SaveWarnDialog {
  readonly dialogRef = inject(MatDialogRef<SaveWarnDialog>);
  readonly data = inject<{ board: BoardInfo; overridesLocal: boolean }>(
    MAT_DIALOG_DATA
  );
}
