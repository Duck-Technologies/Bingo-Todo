import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BoardSetup } from './board-setup';
import { provideZonelessChangeDetection } from '@angular/core';
import { BingoApi } from '../../features/persistence/bingo-api';

describe('BoardSetup', () => {
  let component: BoardSetup;
  let fixture: ComponentFixture<BoardSetup>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BoardSetup],
      providers: [
        provideZonelessChangeDetection(),
        {
          provide: BingoApi,
          useValue: jasmine.createSpyObj<BingoApi>(['createBoard']),
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BoardSetup);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // TODO tests:
  // - Check that the Done step is not reachable without filling all cells
  // - Check hover and focus behavior
  // - Check cell input labels
  // - Check scramble (same items scrambled, not the same order)
});
