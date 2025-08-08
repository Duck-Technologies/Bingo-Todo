import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BoardDetailsForm } from './board-details-form';
import { provideZonelessChangeDetection } from '@angular/core';
import { BingoLocalStorage } from '../persistence/bingo-local';

describe('BoardDetailsForm', () => {
  let component: BoardDetailsForm;
  let fixture: ComponentFixture<BoardDetailsForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BoardDetailsForm],
      providers: [
        provideZonelessChangeDetection(),
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(BoardDetailsForm);
    fixture.componentRef.setInput('board', BingoLocalStorage.DefaultBoard);
    fixture.componentRef.setInput('createMode', true);
    fixture.componentRef.setInput('isLoggedIn', false);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // TODO tests:
  // - Check disabled options and warnings related to Visibility
  // - Check the presence of board size, 
  // - Visibility should only be changeable if the board is not local (but not to local)
  // - Game mode can't be changed once the game is finished in TODO mode
});
