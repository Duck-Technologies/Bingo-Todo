import { TestBed } from '@angular/core/testing';

import { BingoApi } from './bingo-api';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('BingoApi', () => {
  let service: BingoApi;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(BingoApi);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
