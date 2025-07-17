import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Board, BoardCell } from '../../board/board';
import { MatButton } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import {
  MAT_FORM_FIELD_DEFAULT_OPTIONS,
  MatFormFieldModule,
} from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-home',
  imports: [Board, MatButton, MatSelectModule, MatFormFieldModule, FormsModule],
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

  public cards: BoardCell[] = movieTitles.slice(0, this.boardSize).map((title) => ({
    Name: title,
    CheckedDateUTC: null,
    Selected: false,
    IsBingo: false,
  }));

  public resizeBoard(dimension: number) {
    this.cards = movieTitles.slice(0, dimension).map((title) => ({
      Name: title,
      CheckedDateUTC: null,
      Selected: false,
      IsBingo: false,
    }));
  }

  public save() {
    this.cards = this.cards.map((c) => {
      if (c.Selected) {
        c.CheckedDateUTC = new Date();
        c.Selected = false;
      }

      return c;
    });
  }

  public scramble() {
    this.cards = this.cards
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
