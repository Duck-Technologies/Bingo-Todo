import { ChangeDetectionStrategy, Component, input, OnInit, output } from '@angular/core';
import {
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS, MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { BoardInfo } from '../board/board';
import { BoardSize, boardForm } from './form';



@Component({
  selector: 'app-board-details-form',
  imports: [
    MatInputModule,
    MatFormFieldModule,
    FormsModule,
    ReactiveFormsModule,
    MatSelectModule
  ],
  providers: [
    {
      provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
      useValue: { appearance: 'outline' },
    },
  ],
  templateUrl: './board-details-form.html',
  styleUrl: './board-details-form.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BoardDetailsForm implements OnInit {
  public readonly board = input.required<BoardInfo>();
  public readonly createMode = input.required<boolean>();
  public readonly isLoggedIn = input.required<boolean>();
  public readonly resizeBoard = output<BoardSize>();

  public readonly boardForm = boardForm;

  ngOnInit(): void {
    this.boardForm.reset();
    this.boardForm.enable();
    this.boardForm.patchValue(this.board());
    
    if (!this.createMode()) {
      this.boardForm.controls.BoardSize.disable();

      if (this.board().Visibility === 'local') {
        this.boardForm.controls.Visibility.disable();
      }
    }
  }
}
