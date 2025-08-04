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
  // - form prefilled with input
  // - Check disabled options and warnings related to Visibility
  // - Check the presence of board size, and the local Visibility option in create mode based on inputs
});
