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
  selector: 'app-create-warn-dialog',
  imports: [
    MatButtonModule,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatDialogClose,
    Message,
  ],
  templateUrl: './create-warn-dialog.html',
  styleUrl: './create-warn-dialog.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateWarnDialog {
  readonly dialogRef = inject(MatDialogRef<CreateWarnDialog>);
  readonly data = inject<{ board: BoardInfo; overridesLocal: boolean }>(
    MAT_DIALOG_DATA
  );
}
