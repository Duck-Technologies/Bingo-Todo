import { Injectable } from '@angular/core';
import { BoardCell } from '../board/board';

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

  public static calculateCellBingoState(
    cells: BoardCell[],
    calculationService: BoardCalculations
  ) {
    const setting = {
      25: calculationService.fiveByFive,
      16: calculationService.fourByFour,
      9: calculationService.threeByThree,
    }[cells.length] as Properties;

    cells.forEach((c, i) => {
      c.IsInBingoPattern =
        c.IsInBingoPattern ||
        (c.CheckedDateUTC !== null &&
          c.CheckedDateUTC !== undefined &&
          (BoardCalculations.cellInBingoPattern(setting.diagonals, cells, i) ||
            BoardCalculations.cellInBingoPattern(setting.rows, cells, i) ||
            BoardCalculations.cellInBingoPattern(setting.cols, cells, i)));
      return c;
    });

    return cells;
  }

  public static getBoardDimensionFromCellCount(cellCount: number) {
    return ({ 25: 5, 16: 4, 9: 3 } as const)[cellCount];
  }

  /**
   * @returns a list of integers from 0 to dimension - 1
   */
  public static getRowIndexes(dimension: number): number[] {
    return [...Array(dimension).keys()];
  }

  /**
   * Transposes the board
   * @param array the array to reorder
   * @param dimension number of rows/columns
   * @param range A range from 0 to (splitAt - dimension)
   * @returns a copy of the original array transposed
   */
  public static rowArrayToCols<T>(
    array: T[],
    dimension: number,
    range?: number[]
  ): T[] {
    range = range || BoardCalculations.getRowIndexes(dimension);
    return range.reduce(
      (acc, curr) => acc.concat(range.map((i) => array[curr + i * dimension])),
      [] as T[]
    );
  }

  /**
   * Returns the diagonal values from the board in the following order:
   * 1. top left to bottom right
   * 2. top right to bottom left
   * @param array the array to extract values from
   * @param dimension number of rows/columns
   * @param range A range from 0 to (splitAt - dimension)
   * @returns a new array that only contains the diagonal values
   */
  public static rowArrayToDiagonal<T>(
    array: T[],
    dimension: number,
    range?: number[]
  ): T[] {
    range = range || BoardCalculations.getRowIndexes(dimension);
    return [dimension + 1, dimension - 1].reduce(
      (acc, curr, idx) => acc.concat(range.map((i) => array[curr * (i + idx)])),
      [] as T[]
    );
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

  private static cellInBingoPattern(
    combinations: number[][],
    cards: BoardCell[],
    cellIdx: number
  ) {
    return !!combinations
      .filter((c) => c.includes(cellIdx))
      .find((combination) =>
        combination?.every((x) => cards[x].CheckedDateUTC !== null)
      );
  }
}
