import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  MatDialogTitle,
  MatDialogActions,
  MatDialogClose,
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogContent,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { CreateWarnDialog } from '../create-warn-dialog/create-warn-dialog';

@Component({
  selector: 'app-confirm-dialog',
  imports: [
    MatDialogTitle,
    MatDialogClose,
    MatDialogActions,
    MatButtonModule,
    MatDialogContent,
  ],
  templateUrl: './confirm-dialog.html',
  styleUrl: './confirm-dialog.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmDialog {
  readonly dialogRef = inject(MatDialogRef<CreateWarnDialog>);
  readonly data = inject<{
    type?: 'confirm' | 'alert';
    alertTitle?: string;
    alertDescription?: string;
  }>(MAT_DIALOG_DATA);
}
