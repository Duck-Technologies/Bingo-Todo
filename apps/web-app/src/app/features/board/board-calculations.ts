import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class BoardCalculations {
  private threeByThreeIndexes = BoardCalculations.calcCellIndexes(3);
  private fourByFourIndexes = BoardCalculations.calcCellIndexes(4);
  private fiveByFiveIndexes = BoardCalculations.calcCellIndexes(5);

  constructor() {}

  threeByThree = {
    cellIndexes: this.threeByThreeIndexes,
    rows: BoardCalculations.calcRows(3, this.threeByThreeIndexes),
    cols: BoardCalculations.calcCols(3, this.threeByThreeIndexes),
    diagonals: BoardCalculations.calcDiagonals(3),
  };

  private static calcCellIndexes(dimension: number) {
    return [...Array(dimension * dimension).keys()];
  }

  private static calcRows(dimension: number, cellIndexes: number[]) {
    return cellIndexes.reduce(
      (acc, curr) =>
        curr % dimension !== 0
          ? acc
          : [...acc, cellIndexes.slice(curr, curr + dimension)],
      [] as number[][]
    );
  }

  private static calcCols(dimension: number, cellIndexes: number[]) {
    return [...Array(dimension).keys()].reduce((acc, curr) => {
      cellIndexes.forEach((i) => {
        if ((i + curr) % dimension === 0) acc[curr].push(i);
      });
      return acc;
    }, [...Array(dimension)].map((_) => []) as number[][]);
  }

  private static calcDiagonals(dimension: number) {
    return [
      [...Array(dimension)].reduce((acc, curr, idx) => {
        acc.push((dimension + 1) * idx);
        return acc;
      }, []),
      [...Array(dimension)].reduce((acc, curr, idx) => {
        acc.push((dimension - 1) * (idx + 1));
        return acc;
      }, []),
    ];
  }
}
