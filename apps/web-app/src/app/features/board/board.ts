import { JsonPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
} from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';

type BoardCell = {
  Name: string;
  CheckedDateUTC: Date | null;
  IsBingo: boolean;
};

@Component({
  selector: 'app-board',
  imports: [MatCardModule, MatTooltipModule, JsonPipe],
  templateUrl: './board.html',
  styleUrl: './board.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.three]': 'mode() === 3',
    '[class.four]': 'mode() === 4',
    '[class.five]': 'mode() === 5',
  },
})
export class Board {
  public cards = signal<BoardCell[]>(
    [...Array(9).keys()].map((num, idx) => ({
      Name: '',
      CheckedDateUTC: [2, 4, 6].includes(idx) ? new Date() : null,
      IsBingo: false,
    }))
  );
  public mode = computed(
    () => ({ '25': 5, '16': 4, '9': 3 }[this.cards().length] ?? 0)
  );

  private cellIndexes = computed(() => [
    ...Array(this.mode() * this.mode()).keys(),
  ]);

  public bingoRows = computed(() => {
    return this.cellIndexes().reduce(
      (acc, curr) =>
        curr % this.mode() !== 0
          ? acc
          : [...acc, this.cellIndexes().slice(curr, curr + this.mode())],
      [] as number[][]
    );
  });

  public bingoCols = computed(() => {
    return [...Array(this.mode()).keys()].reduce((acc, curr) => {
      this.cellIndexes().forEach((i) => {
        if ((i + curr) % this.mode() === 0) acc[curr].push(i);
      });
      return acc;
    }, [...Array(this.mode())].map((_) => []) as number[][]);
  });

  public bingoDiagonal = computed(() => [
    [...Array(this.mode())].reduce((acc, curr, idx) => {
      acc.push((this.mode() + 1) * idx);
      return acc;
    }, []),
    [...Array(this.mode())].reduce((acc, curr, idx) => {
      acc.push((this.mode() - 1) * idx + this.mode() - 1);
      return acc;
    }, []),
  ]);

  public displayedCards = computed(() =>
    this.cards().map((c, i) => {
      c.IsBingo =
        c.IsBingo ||
        (c.CheckedDateUTC !== null &&
          (Board.cellInBingoFormation(this.bingoDiagonal(), this.cards(), i) ||
            Board.cellInBingoFormation(this.bingoRows(), this.cards(), i) ||
            Board.cellInBingoFormation(this.bingoCols(), this.cards(), i)));
      return c;
    })
  );

  private static cellInBingoFormation(
    combinations: number[][],
    cards: BoardCell[],
    cellIdx: number
  ) {
    const combinationsToCheck = combinations.filter((c) => c.includes(cellIdx));
    return !!combinationsToCheck.find((combination) =>
      combination?.every((x) => cards[x].CheckedDateUTC !== null)
    );
  }
}
