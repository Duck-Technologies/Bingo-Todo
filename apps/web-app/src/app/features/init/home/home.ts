import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Board, BoardCell } from '../../board/board';
import { MatButton } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import {
  MAT_FORM_FIELD_DEFAULT_OPTIONS,
  MatFormFieldModule,
} from '@angular/material/form-field';
import {
  FormArray,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatStepperModule } from '@angular/material/stepper';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  map,
  startWith,
} from 'rxjs';
import { AsyncPipe, TitleCasePipe } from '@angular/common';

type CellForm = FormGroup<{
  Name: FormControl<string | null>;
  Selected: FormControl<boolean>;
  IsBingo: FormControl<boolean>;
}>;

@Component({
  selector: 'app-home',
  imports: [
    Board,
    MatButton,
    MatSelectModule,
    MatFormFieldModule,
    FormsModule,
    MatStepperModule,
    ReactiveFormsModule,
    MatInputModule,
    AsyncPipe,
    TitleCasePipe,
  ],
  providers: [
    {
      provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
      useValue: { appearance: 'outline' },
    },
  ],
  templateUrl: './home.html',
  styleUrl: './home.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home {
  public boardSize = 9;
  public boardCols = 3;
  public focused = false;
  public Math = Math;
  public displayPlayAgain = false;

  public board: {
    Name: string | null;
    GameMode: 'traditional' | 'todo';
    Deadline: Date | null;
    Cells: BoardCell[];
  } = {
    Name: null,
    GameMode: 'traditional',
    Deadline: null,
    Cells: [],
  };

  public mode: 'edit' | 'view' = 'edit';

  public boardForm = new FormGroup({
    Name: new FormControl<string | null>(null),
    BoardSize: new FormControl<number>(this.boardSize),
    GameMode: new FormControl<'traditional' | 'todo'>('traditional', {
      nonNullable: true,
    }),
    Deadline: new FormControl<Date | null>(null),
  });

  public cardsFormArray = new FormArray<CellForm>(
    [...Array(this.boardSize).keys()].map((_) => {
      return new FormGroup({
        Name: new FormControl<string | null>(null, [Validators.required]),
        Selected: new FormControl<boolean>(false, { nonNullable: true }),
        IsBingo: new FormControl<boolean>(false, { nonNullable: true }),
      });
    })
  );

  public cards$ = this.cardsFormArray.valueChanges.pipe(
    startWith(this.cardsFormArray.getRawValue()),
    map(
      (cards) =>
        cards.map((c) => {
          c.IsBingo = !!c.Name?.length;
          return c;
        }) as BoardCell[]
    )
  );

  public abandon() {
    this.mode = 'edit';
  }

  public indicateFocused(
    control: CellForm,
    action: 'out' | null = null,
    hover: boolean = false
  ) {
    if (!hover) {
      this.focused = action !== 'out';
    }

    control.controls.Selected.setValue(action !== 'out');
  }

  public prefill() {
    this.cardsFormArray.patchValue(
      this._scramble(
        movieTitles.map((title) => ({
          Name: title,
          CheckedDateUTC: null,
          Selected: false,
          IsBingo: false,
        }))
      )
    );
  }

  public resizeBoard(dimension: number) {
    this.boardCols = {
      9: 3,
      16: 4,
      25: 5,
    }[dimension] as number;

    this.cardsFormArray.clear();
    [...Array(dimension).keys()].forEach((_) => {
      this.cardsFormArray.push(
        new FormGroup({
          Name: new FormControl<string | null>(null, [Validators.required]),
          Selected: new FormControl<boolean>(false, { nonNullable: true }),
          IsBingo: new FormControl<boolean>(false, { nonNullable: true }),
        })
      );
    });
  }

  public save() {
    this.board.Cells = this.board.Cells.map((c) => {
      if (c.Selected) {
        c.CheckedDateUTC = new Date();
        c.Selected = false;
      }

      return c;
    });
  }

  public start() {
    this.mode = 'view';
    this.board = {
      ...this.boardForm.getRawValue(),
      Cells: this.cardsFormArray.getRawValue().map(
        (c) =>
          ({
            Name: c.Name,
            CheckedDateUTC: null,
            Selected: false,
            IsBingo: false,
          } as BoardCell)
      ),
    };
  }

  public scramble() {
    this.cardsFormArray.patchValue(
      this._scramble(this.cardsFormArray.getRawValue() as BoardCell[])
    );
  }

  private _scramble(list: BoardCell[]) {
    return list
      .map((value) => ({ value, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ value }) => value);
  }
}

const movieTitles = [
  'The Shawshank Redemption',
  'The Godfather',
  'The Dark Knight',
  'The Godfather Part II',
  '12 Angry Men',
  'The Lord of the Rings: The Return of the King',
  "Schindler's List",
  'Pulp Fiction',
  'The Lord of the Rings: The Fellowship of the Ring',
  'The Good, the Bad and the Ugly',
  'Forrest Gump',
  'The Lord of the Rings: The Two Towers',
  'Fight Club',
  'Inception',
  'Star Wars: Episode V - The Empire Strikes Back',
  'The Matrix',
  'GoodFellas',
  'Interstellar',
  "One Flew Over the Cuckoo's Nest",
  'Seven',
  "It's a Wonderful Life",
  'The Silence of the Lambs',
  'Seven Samurai',
  'Saving Private Ryan',
  'The Green Mile',
];
