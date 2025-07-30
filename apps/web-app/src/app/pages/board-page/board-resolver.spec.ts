import { TestBed } from '@angular/core/testing';
import { ResolveFn } from '@angular/router';

import { boardResolver } from './board-resolver';
import { Observable } from 'rxjs';
import { BoardInfo } from '../../features/board/board';

describe('boardResolver', () => {
  const executeResolver: ResolveFn<Observable<BoardInfo>> = (...resolverParameters) => 
      TestBed.runInInjectionContext(() => boardResolver(...resolverParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeResolver).toBeTruthy();
  });
});
