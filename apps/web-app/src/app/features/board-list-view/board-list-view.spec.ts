import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BoardListView } from './board-list-view';
import { provideZonelessChangeDetection } from '@angular/core';
import { By } from '@angular/platform-browser';
import { BoardCalculations } from '../calculations/board-calculations';
import { BoardCell } from '../board/board';

describe('BoardListView', () => {
  let component: BoardListView;
  let fixture: ComponentFixture<BoardListView>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BoardListView],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(BoardListView);
    fixture.componentRef.setInput(
      'cards',
      BoardCalculations.getRowIndexes(9).map(
        (i) => new BoardCell({ Name: i.toString() }, i, 3)
      )
    );
    fixture.componentRef.setInput('disabled', false);
    component = fixture.componentInstance;
    fixture.autoDetectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should properly order cards when grouped by rows', async () => {
    const cardTitles = fixture.debugElement.queryAll(
      By.css('mat-card-header > span')
    );
    expect(cardTitles.length).not.toBe(0);

    const expected = [
      'Row 1, Col 1',
      'Row 1, Col 2',
      'Row 1, Col 3',
      'Row 2, Col 1',
      'Row 2, Col 2',
      'Row 2, Col 3',
      'Row 3, Col 1',
      'Row 3, Col 2',
      'Row 3, Col 3',
    ];

    for (const [idx, title] of cardTitles.entries()) {
      expect(title.nativeElement.innerText).toBe(expected[idx]);
    }
  });

  it('should properly order cards when grouped by colums', async () => {
    fixture.componentRef.setInput('groupBy', 'col');
    await fixture.whenStable();

    const cardTitles = fixture.debugElement.queryAll(
      By.css('mat-card-header > span')
    );
    expect(cardTitles.length).not.toBe(0);

    const expected = [
      'Row 1, Col 1',
      'Row 2, Col 1',
      'Row 3, Col 1',
      'Row 1, Col 2',
      'Row 2, Col 2',
      'Row 3, Col 2',
      'Row 1, Col 3',
      'Row 2, Col 3',
      'Row 3, Col 3',
    ];

    for (const [idx, title] of cardTitles.entries()) {
      expect(title.nativeElement.innerText).toBe(expected[idx]);
    }
  });

  it('should properly order cards when grouped diagonally', async () => {
    fixture.componentRef.setInput('groupBy', 'diagonal');
    await fixture.whenStable();

    const cardTitles = fixture.debugElement.queryAll(
      By.css('mat-card-header > span')
    );
    expect(cardTitles.length).not.toBe(0);

    const expected = [
      'Row 1, Col 1',
      'Row 2, Col 2',
      'Row 3, Col 3',
      'Row 1, Col 3',
      'Row 2, Col 2',
      'Row 3, Col 1',
    ];

    for (const [idx, title] of cardTitles.entries()) {
      expect(title.nativeElement.innerText).toBe(expected[idx]);
    }
  });
});
