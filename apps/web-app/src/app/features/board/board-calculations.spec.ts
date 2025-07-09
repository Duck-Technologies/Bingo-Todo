import { TestBed } from '@angular/core/testing';

import { BoardCalculations } from './board-calculations';

describe('BoardCalculations', () => {
  let service: BoardCalculations;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BoardCalculations);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
