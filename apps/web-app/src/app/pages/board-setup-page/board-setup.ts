import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import {
  FormArray,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButton, MatIconButton } from '@angular/material/button';
import {
  MatFormFieldModule,
  MAT_FORM_FIELD_DEFAULT_OPTIONS,
} from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatStepperModule } from '@angular/material/stepper';
import { Board, BoardCell } from '../../features/board/board';
import { startWith, map } from 'rxjs';
import { StepperSelectionEvent } from '@angular/cdk/stepper';
import { BingoLocalStorage } from '../../features/persistence/bingo-local';
import { Router } from '@angular/router';
import { BingoApi } from '../../features/persistence/bingo-api';
import { BoardDetailsForm } from "../../features/board-details-form/board-details-form";
import { boardForm } from '../../features/board-details-form/form';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { BoardListView } from "../../features/board-list-view/board-list-view";

type CellForm = FormGroup<{
  Name: FormControl<string | null>;
  Selected: FormControl<boolean>;
  IsBingo: FormControl<boolean>;
}>;

@Component({
  selector: 'app-board-setup',
  imports: [
    Board,
    MatButton,
    MatIconButton,
    MatSelectModule,
    MatInputModule,
    MatFormFieldModule,
    FormsModule,
    ReactiveFormsModule,
    MatStepperModule,
    AsyncPipe,
    BoardDetailsForm,
    MatIcon,
    MatTooltip,
    BoardListView
],
  providers: [
    {
      provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
      useValue: { appearance: 'outline' },
    },
  ],
  templateUrl: './board-setup.html',
  styleUrl: './board-setup.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BoardSetup implements OnInit {
  private readonly router = inject(Router);
  private readonly bingoApi = inject(BingoApi);

  public readonly baseBoard = { ...BingoLocalStorage.DefaultBoard, Cells: [] }; // once copying boards is implemented, this should be dynamic
  public readonly Math = Math;
  public readonly defaultBoardSize = 9;
  public boardCols: 3 | 4 | 5 = 3;
  public readonly gridMode = signal<'grid' | 'list'>('grid');
  public inputFocused = false;
  public isLoggedIn = false;

  public boardForm = boardForm;

  public readonly cardsFormArray = new FormArray<CellForm>(
    [...Array(this.defaultBoardSize).keys()].map((_) => {
      return new FormGroup({
        Name: new FormControl<string | null>(null, [Validators.required]),
        Selected: new FormControl<boolean>(false, { nonNullable: true }),
        IsBingo: new FormControl<boolean>(false, { nonNullable: true }),
      });
    })
  );

  public readonly cards$ = this.cardsFormArray.valueChanges.pipe(
    startWith(this.cardsFormArray.getRawValue()),
    map(
      () =>
        this.cardsFormArray.getRawValue().map((c) => {
          c.IsBingo = !!c.Name?.length;
          return c;
        }) as BoardCell[]
    )
  );

  ngOnInit(): void {
    this.resizeBoard(
      (this.baseBoard.Cells.length as any) || this.defaultBoardSize
    );
    this.cardsFormArray.patchValue(this.baseBoard.Cells);
  }

  public createBoard() {
    const board = this.boardForm.getRawValue();

    if (board.Visibility === 'local') {
      BingoLocalStorage.createBoard({
        ...board,
        Cells: this.cardsFormArray.getRawValue().map(
          (c) =>
            ({
              Name: c.Name,
              CheckedDateUTC: null,
              Selected: false,
              IsBingo: false,
            } as BoardCell)
        ),
      });
      this.router.navigate(['board/local']);
    } else {
      // this.bingoApi.createBoard(board).subscribe();
    }
  }

  public indicateFocused(
    control: CellForm,
    action: 'out' | null = null,
    hover: boolean = false
  ) {
    if (!hover) {
      this.inputFocused = action !== 'out';
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

  public resizeBoard(dimension: 9 | 16 | 25) {
    this.boardCols = ({
      9: 3,
      16: 4,
      25: 5,
    } as const)[dimension];

    const cellsBeforeResize = JSON.parse(JSON.stringify(this.cardsFormArray.getRawValue().filter(x => !!x.Name)))

    this.cardsFormArray.clear();
    [...Array(dimension).keys()].forEach((_, idx) => {
      this.cardsFormArray.push(
        new FormGroup({
          Name: new FormControl<string | null>(cellsBeforeResize.at(idx)?.Name, [Validators.required]),
          Selected: new FormControl<boolean>(false, { nonNullable: true }),
          IsBingo: new FormControl<boolean>(false, { nonNullable: true }),
        })
      );
    });
  }

  public scramble() {
    this.cardsFormArray.patchValue(
      this._scramble(this.cardsFormArray.getRawValue() as BoardCell[])
    );
  }

  public scrollTo(event: StepperSelectionEvent) {
    setTimeout(() => {
      [...document.querySelectorAll('.action-footer')]
        .at(event.selectedIndex)
        ?.scrollIntoView({ block: 'end', behavior: 'smooth' });
    }, 200);
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
