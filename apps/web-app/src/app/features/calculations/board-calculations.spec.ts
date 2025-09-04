import { TestBed } from '@angular/core/testing';

import { BoardCalculations } from './board-calculations';
import { provideZonelessChangeDetection } from '@angular/core';
import { BoardCell } from '../board/board';

describe('BoardCalculations', () => {
  let service: BoardCalculations;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    service = TestBed.inject(BoardCalculations);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should be able to calculate 3x3 properties', () => {
    expect(service.threeByThree).toEqual({
      rows: [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],
      ],
      cols: [
        [0, 3, 6],
        [2, 5, 8],
        [1, 4, 7],
      ],
      diagonals: [
        [0, 4, 8],
        [2, 4, 6],
      ],
    });
  });

  it('should be able to calculate 4x4 properties', () => {
    expect(service.fourByFour).toEqual({
      rows: [
        [0, 1, 2, 3],
        [4, 5, 6, 7],
        [8, 9, 10, 11],
        [12, 13, 14, 15],
      ],
      cols: [
        [0, 4, 8, 12],
        [3, 7, 11, 15],
        [2, 6, 10, 14],
        [1, 5, 9, 13],
      ],
      diagonals: [
        [0, 5, 10, 15],
        [3, 6, 9, 12],
      ],
    });
  });

  it('should be able to calculate 5x5 properties', () => {
    expect(service.fiveByFive).toEqual({
      rows: [
        [0, 1, 2, 3, 4],
        [5, 6, 7, 8, 9],
        [10, 11, 12, 13, 14],
        [15, 16, 17, 18, 19],
        [20, 21, 22, 23, 24],
      ],
      cols: [
        [0, 5, 10, 15, 20],
        [4, 9, 14, 19, 24],
        [3, 8, 13, 18, 23],
        [2, 7, 12, 17, 22],
        [1, 6, 11, 16, 21],
      ],
      diagonals: [
        [0, 6, 12, 18, 24],
        [4, 8, 12, 16, 20],
      ],
    });
  });

  it('getRowIndexes work as expected', () => {
    expect(BoardCalculations.getRowIndexes(5)).toEqual([0, 1, 2, 3, 4]);
  });

  describe('IsInBingoPatternCalculations', () => {
    [3, 4, 5].forEach((dimension) => {
      it('when one column striked from ' + dimension, () => {
        BoardCalculations.getRowIndexes(dimension).forEach((i) => {
          const cells = BoardCalculations.getRowIndexes(
            dimension * dimension
          ).map(
            (num, idx) =>
              new BoardCell(
                {
                  Name: '',
                  CheckedAtUtc:
                    (num - i) % dimension === 0 ? new Date() : null,
                  IsInBingoPattern: false,
                  Selected: false,
                },
                idx,
                dimension
              )
          );

          BoardCalculations.calculateCellBingoState(cells, service);

          expect(
            cells.reduce((acc, curr) => acc + +curr.IsInBingoPattern, 0)
          ).toEqual(dimension);
        });
      });
    });

    [3, 4, 5].forEach((dimension) => {
      it('when one row is striked from ' + dimension, () => {
        BoardCalculations.getRowIndexes(dimension).forEach((i) => {
          const cells = BoardCalculations.getRowIndexes(
            dimension * dimension
          ).map(
            (num, idx) =>
              new BoardCell(
                {
                  Name: '',
                  CheckedAtUtc:
                    Math.floor(num / dimension) === i ? new Date() : null,
                  IsInBingoPattern: false,
                  Selected: false,
                },
                idx,
                dimension
              )
          );

          BoardCalculations.calculateCellBingoState(cells, service);

          expect(
            cells.reduce((acc, curr) => acc + +curr.IsInBingoPattern, 0)
          ).toEqual(dimension);
        });
      });
    });

    [3, 4, 5].forEach((dimension) => {
      it(
        'when one column has some checked but not a full strike from ' +
          dimension,
        () => {
          let checkedCount = 0;
          BoardCalculations.getRowIndexes(dimension).forEach((i) => {
            const cells = BoardCalculations.getRowIndexes(
              dimension * dimension
            ).map((num, idx) => {
              const checkIt =
                (num - i) % dimension === 0 &&
                (checkedCount === 0 ||
                  (checkedCount < dimension - 1 && Math.random() * 10 >= 5));
              checkedCount += +checkIt;

              return new BoardCell(
                {
                  Name: '',
                  CheckedAtUtc: checkIt ? new Date() : null,
                  IsInBingoPattern: false,
                  Selected: false,
                },
                idx,
                dimension
              );
            });

            BoardCalculations.calculateCellBingoState(cells, service);

            expect(
              cells.reduce((acc, curr) => acc + +curr.IsInBingoPattern, 0)
            ).toEqual(0);
          });
        }
      );
    });

    [3, 4, 5].forEach((dimension) => {
      it(
        'when one row has some checked but not a full strike from ' + dimension,
        () => {
          let checkedCount = 0;
          BoardCalculations.getRowIndexes(dimension).forEach((i) => {
            const cells = BoardCalculations.getRowIndexes(
              dimension * dimension
            ).map((num, idx) => {
              const checkIt =
                Math.floor(num / dimension) === i &&
                (checkedCount === 0 ||
                  (checkedCount < dimension - 1 && Math.random() * 10 >= 5));
              checkedCount += +checkIt;

              return new BoardCell(
                {
                  Name: '',
                  CheckedAtUtc: checkIt ? new Date() : null,
                  IsInBingoPattern: false,
                  Selected: false,
                },
                idx,
                dimension
              );
            });

            BoardCalculations.calculateCellBingoState(cells, service);

            expect(
              cells.reduce((acc, curr) => acc + +curr.IsInBingoPattern, 0)
            ).toEqual(0);
          });
        }
      );
    });

    [3, 4, 5].forEach((dimension) => {
      it(
        'when diagonal cells are striked from top left to bottom right on a matrix of ' +
          dimension,
        () => {
          let nextToCheck = 0;
          const cells = BoardCalculations.getRowIndexes(
            dimension * dimension
          ).map((idx) => {
            const checkIt = idx === nextToCheck;
            if (checkIt) {
              nextToCheck += dimension + 1;
            }

            return new BoardCell(
              {
                Name: '',
                CheckedAtUtc: checkIt ? new Date() : null,
                IsInBingoPattern: false,
                Selected: false,
              },
              idx,
              dimension
            );
          });

          BoardCalculations.calculateCellBingoState(cells, service);

          const expected = {
            3: [0, 4, 8],
            4: [0, 5, 10, 15],
            5: [0, 6, 12, 18, 24],
          }[dimension] as number[];

          expect(
            cells
              .map((c, idx) => (c.IsInBingoPattern === false ? undefined : idx))
              .filter((c) => c !== undefined)
          ).toEqual(expected);
        }
      );
    });

    [3, 4, 5].forEach((dimension) => {
      it(
        'when diagonal cells are striked from top right to bottom left on a matrix of ' +
          dimension,
        () => {
          let nextToCheck = dimension - 1;
          const cells = BoardCalculations.getRowIndexes(
            dimension * dimension
          ).map((idx) => {
            const checkIt = idx === nextToCheck;
            if (checkIt) {
              nextToCheck += dimension - 1;
            }

            return new BoardCell(
              {
                Name: '',
                CheckedAtUtc: checkIt ? new Date() : null,
                IsInBingoPattern: false,
                Selected: false,
              },
              idx,
              dimension
            );
          });

          BoardCalculations.calculateCellBingoState(cells, service);

          const expected = {
            3: [2, 4, 6],
            4: [3, 6, 9, 12],
            5: [4, 8, 12, 16, 20],
          }[dimension] as number[];

          expect(
            cells
              .map((c, idx) => (c.IsInBingoPattern === false ? undefined : idx))
              .filter((c) => c !== undefined)
          ).toEqual(expected);
        }
      );
    });
  });

  describe('transformation functions', () => {
    [3, 4, 5].forEach((dimension) => {
      it(
        'Should be able to extract diagonal cells as expected on a board of ' +
          dimension,
        () => {
          const cells = BoardCalculations.getRowIndexes(
            dimension * dimension
          ).map(
            (idx) =>
              new BoardCell(
                {
                  Name: '',
                  CheckedAtUtc: new Date(),
                  IsInBingoPattern: false,
                  Selected: false,
                },
                idx,
                dimension
              )
          );
          const filtered = BoardCalculations.rowArrayToDiagonal(
            cells,
            dimension
          );

          expect(cells.length).toBe(dimension * dimension);

          const mapped = filtered.map((c) => ({
            Row: c.Row,
            Column: c.Column,
          }));

          expect(mapped).toEqual([
            // top left to bottom right (1-1, 2-2, 3-3)
            ...BoardCalculations.getRowIndexes(dimension).map((idx) => ({
              Row: idx + 1,
              Column: idx + 1,
            })),
            // top right to bottom left (1-3, 2-2, 3-1)
            ...BoardCalculations.getRowIndexes(dimension).reduce(
              (acc, curr) => {
                acc.push({
                  Row: curr + 1,
                  Column: dimension - 1 * curr,
                });

                return acc;
              },
              [] as { Row: number; Column: number }[]
            ),
          ]);

          if (dimension === 3) {
            expect(mapped).toEqual([
              { Row: 1, Column: 1 },
              { Row: 2, Column: 2 },
              { Row: 3, Column: 3 },
              { Row: 1, Column: 3 },
              { Row: 2, Column: 2 },
              { Row: 3, Column: 1 },
            ]);
          }
        }
      );
    });

    [3, 4, 5].forEach((dimension) => {
      it(
        'Should be able to transpose cells as expected on a board of ' +
          dimension,
        () => {
          const cells = BoardCalculations.getRowIndexes(
            dimension * dimension
          ).map(
            (idx) =>
              new BoardCell(
                {
                  Name: '',
                  CheckedAtUtc: new Date(),
                  IsInBingoPattern: false,
                  Selected: false,
                },
                idx,
                dimension
              )
          );

          const transposed = BoardCalculations.rowArrayToCols(cells, dimension);

          expect(cells.map((c) => ({ Row: c.Row, Column: c.Column }))).toEqual(
            BoardCalculations.getRowIndexes(dimension * dimension).map(
              (idx) => ({
                Row: Math.floor(idx / dimension) + 1,
                Column: (idx % dimension) + 1,
              })
            )
          );

          expect(
            transposed.map((c) => ({ Row: c.Row, Column: c.Column }))
          ).toEqual(
            BoardCalculations.getRowIndexes(dimension * dimension).map(
              (idx) => ({
                Row: (idx % dimension) + 1,
                Column: Math.floor(idx / dimension) + 1,
              })
            )
          );
        }
      );
    });
  });
});
