import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
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
import {
  Board,
  BoardCell,
  BoardCellDto,
  BoardInfo,
} from '../../features/board/board';
import { startWith, map } from 'rxjs';
import { StepperSelectionEvent } from '@angular/cdk/stepper';
import { BingoLocalStorage } from '../../features/persistence/bingo-local';
import { Router } from '@angular/router';
import { BingoApi } from '../../features/persistence/bingo-api';
import { BoardDetailsForm } from '../../features/board-details-form/board-details-form';
import {
  boardForm,
  NotOnlyWhiteSpacePattern,
} from '../../features/board-details-form/form';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { BoardListView } from '../../features/board-list-view/board-list-view';
import { MatDivider } from '@angular/material/divider';
import { BoardCalculations } from '../../features/calculations/board-calculations';
import { DeadlineRewardForm } from '../../features/deadline-reward-form/deadline-reward-form';
import { CreateWarnDialog } from '../../features/create-warn-dialog/create-warn-dialog';
import { MatDialog } from '@angular/material/dialog';
import { GameModeIcon } from '../../features/game-mode-icon/game-mode-icon';

type CellForm = FormGroup<{
  Name: FormControl<string | null>;
  Selected: FormControl<boolean>;
  Row: FormControl<number>;
  Column: FormControl<number>;
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
    BoardListView,
    MatDivider,
    DeadlineRewardForm,
    GameModeIcon
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
  host: {
    role: 'main',
  },
})
export class BoardSetup implements OnInit {
  public readonly board = input<BoardInfo | null>(null);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);
  private readonly bingoApi = inject(BingoApi);

  public readonly baseBoard = new BoardInfo(BingoLocalStorage.DefaultBoard);
  public readonly boardForm = boardForm;
  public readonly Math = Math;
  public readonly defaultBoardSize = 9;
  public boardSize: 3 | 4 | 5 = 3;
  public readonly gridMode = signal<'grid' | 'list'>('grid');
  public inputFocused = false;
  public isLoggedIn = false;

  public readonly cardsFormArray = new FormArray<CellForm>(
    [...Array(this.defaultBoardSize).keys()].map((_, index) => {
      return new FormGroup({
        Name: new FormControl<string | null>(null, [Validators.required]),
        Selected: new FormControl<boolean>(false, { nonNullable: true }),
        Row: new FormControl<number>(Math.floor(index / this.boardSize) + 1, {
          nonNullable: true,
        }),
        Column: new FormControl<number>((index % this.boardSize) + 1, {
          nonNullable: true,
        }),
      });
    })
  );

  public readonly cards$ = this.cardsFormArray.valueChanges.pipe(
    startWith(this.cardsFormArray.getRawValue()),
    map(
      () =>
        this.cardsFormArray.getRawValue().map((c, idx) => ({
          IsInBingoPattern:
            !!c.Name?.toString()?.length && this.cardsFormArray.at(idx).valid,
          ...c,
        })) as BoardCell[]
    )
  );

  ngOnInit(): void {
    const board = this.board();
    if (board) {
      // makes reward and deadline belonging to another game mode be cleared in the BoardInfo constructor
      board.TraditionalGame.CompletedAtUtc = board.TodoGame.CompletedAtUtc =
        null;
    }
    const baseBoard = board ? new BoardInfo(board) : this.baseBoard;

    this.boardForm.reset();
    this.boardForm.enable();
    this.boardForm.patchValue(baseBoard);

    this.resizeBoard((baseBoard.Cells.length as any) || this.defaultBoardSize);
    this.cardsFormArray.patchValue(baseBoard.Cells);
  }

  public createBoard() {
    const formValue = this.boardForm.getRawValue();

    const board = new BoardInfo<BoardCellDto>({
      ...formValue,
      Cells: this.cardsFormArray.getRawValue().map(
        (c) =>
          ({
            Name: c.Name,
            CheckedDateUTC: null,
          } as BoardCellDto)
      ),
    });

    const dialogRef = this.dialog.open(CreateWarnDialog, {
      data: {
        board: board,
        overridesLocal: BingoLocalStorage.boardInLocalStorage(),
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result !== undefined) {
        if (board.Visibility === 'local') {
          BingoLocalStorage.createBoard(board);
          this.router.navigate(['board/local']);
        } else {
          // this.bingoApi.createBoard(board).subscribe();
        }
      }
    });
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
        movieTitles.map(
          (title, idx) => new BoardCell({ Name: title }, idx, this.boardSize)
        )
      )
    );
  }

  public resizeBoard(dimension: 9 | 16 | 25) {
    const boardSize =
      BoardCalculations.getBoardDimensionFromCellCount(dimension);
    if (!boardSize) return;
    this.boardSize = boardSize;

    const cellsBeforeResize = JSON.parse(
      JSON.stringify(this.cardsFormArray.getRawValue().filter((x) => !!x.Name))
    );

    this.cardsFormArray.clear();
    [...Array(dimension).keys()].forEach((_, idx) => {
      this.cardsFormArray.push(
        new FormGroup({
          Name: new FormControl<string | null>(
            cellsBeforeResize.at(idx)?.Name,
            [Validators.required, Validators.pattern(NotOnlyWhiteSpacePattern)]
          ),
          Selected: new FormControl<boolean>(false, { nonNullable: true }),
          Row: new FormControl<number>(Math.floor(idx / dimension) + 1, {
            nonNullable: true,
          }),
          Column: new FormControl<number>((idx % dimension) + 1, {
            nonNullable: true,
          }),
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
    }, 250);
  }

  private _scramble(list: BoardCell[]) {
    return list
      .map((value) => ({ value, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(
        ({ value }, index) =>
          new BoardCell(
            value,
            index,
            BoardCalculations.getBoardDimensionFromCellCount(list.length) as any
          )
      );
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
