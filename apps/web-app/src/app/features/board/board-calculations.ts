import { Injectable } from '@angular/core';

type Properties = {
  rows: number[][];
  cols: number[][];
  diagonals: number[][];
};

@Injectable({
  providedIn: 'root',
})
export class BoardCalculations {
  public readonly threeByThree: Properties;
  public readonly fourByFour: Properties;
  public readonly fiveByFive: Properties;

  constructor() {
    const threeByThreeIndexes = BoardCalculations.calcCellIndexes(3);
    const fourByFourIndexes = BoardCalculations.calcCellIndexes(4);
    const fiveByFiveIndexes = BoardCalculations.calcCellIndexes(5);

    this.threeByThree = BoardCalculations.calcProperties(
      3,
      threeByThreeIndexes
    );
    this.fourByFour = BoardCalculations.calcProperties(4, fourByFourIndexes);
    this.fiveByFive = BoardCalculations.calcProperties(5, fiveByFiveIndexes);
  }

  private static calcProperties(dimension: number, cellIndexes: number[]) {
    return {
      rows: BoardCalculations.calcRows(dimension, cellIndexes),
      cols: BoardCalculations.calcCols(dimension, cellIndexes),
      diagonals: BoardCalculations.calcDiagonals(dimension),
    };
  }

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
      [...Array(dimension)].reduce((acc, _, idx) => {
        acc.push((dimension + 1) * idx);
        return acc;
      }, []),
      [...Array(dimension)].reduce((acc, _, idx) => {
        acc.push((dimension - 1) * (idx + 1));
        return acc;
      }, []),
    ] as number[][];
  }
}
