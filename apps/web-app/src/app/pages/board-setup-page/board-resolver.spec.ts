import { TestBed } from '@angular/core/testing';
import { ResolveFn } from '@angular/router';

import { boardToCopyResolver } from './board-resolver';
import { Observable } from 'rxjs';
import { BoardInfo } from '../../features/board/board';

describe('boardToCopyResolver', () => {
  const executeResolver: ResolveFn<Observable<BoardInfo>> = (
    ...resolverParameters
  ) =>
    TestBed.runInInjectionContext(() =>
      boardToCopyResolver(...resolverParameters)
    );

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeResolver).toBeTruthy();
  });
});
