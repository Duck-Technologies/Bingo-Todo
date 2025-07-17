import { TestBed } from '@angular/core/testing';

import { BoardCalculations } from './board-calculations';
import { provideZonelessChangeDetection } from '@angular/core';

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
});
