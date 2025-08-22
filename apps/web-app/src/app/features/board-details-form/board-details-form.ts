import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
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
    MatSelectModule,
  ],
  templateUrl: './board-details-form.html',
  styleUrl: './board-details-form.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'form',
    'aria-label': 'inputs for basic details of the board',
  },
})
export class BoardDetailsForm {
  public readonly board = input.required<BoardInfo>();
  public readonly createMode = input.required<boolean>();
  public readonly isLoggedIn = input.required<boolean>();
  public readonly gameFinished = input<boolean>(false);
  public readonly traditionalOptionDisabled = input<boolean>(false);
  public readonly resizeBoard = output<BoardSize>();

  public readonly boardForm = boardForm;

  public readonly displayVisibilityInput = computed(
    () => this.createMode() || this.board().Visibility !== 'local'
  );
}
