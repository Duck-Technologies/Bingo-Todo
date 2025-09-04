import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Board, BoardCell } from './board';
import { provideZonelessChangeDetection } from '@angular/core';
import { BoardCalculations } from '../calculations/board-calculations';
import { By } from '@angular/platform-browser';

describe('Board', () => {
  let component: Board;
  let fixture: ComponentFixture<Board>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Board],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(Board);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('cards', []);
    fixture.componentRef.setInput('previewMode', null);
    fixture.autoDetectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('when previewMode is null', () => {
    it('should be able to select a cell with space', async () => {
      const cards = BoardCalculations.getRowIndexes(9).map(
        (idx) =>
          new BoardCell(
            {
              Selected: false,
            },
            idx,
            3
          )
      );
      fixture.componentRef.setInput('cards', cards);
      await fixture.whenStable();

      const firstInput = fixture.debugElement.query(By.css('input'));
      firstInput.triggerEventHandler('keyup.space', {
        code: 'Space',
        preventDefault: () => {},
      });

      expect(component.cards().find((c) => c.Selected)).not.toBeUndefined();
    });

    it('should be able to only select cells without CheckedAtUtc', async () => {
      const cards = BoardCalculations.getRowIndexes(9).map(
        (idx) =>
          new BoardCell(
            {
              CheckedAtUtc: new Date(),
            },
            idx,
            3
          )
      );
      fixture.componentRef.setInput('cards', cards);
      await fixture.whenStable();

      const disabledInputs = fixture.debugElement.queryAll(
        By.css('input:disabled')
      );

      expect(disabledInputs.length).toBe(9);
    });

    it('should be able to toggle Selected state with clicks', async () => {
      const cards = BoardCalculations.getRowIndexes(9).map(
        (idx) =>
          new BoardCell(
            {
              CheckedAtUtc: null,
            },
            idx,
            3
          )
      );
      fixture.componentRef.setInput('cards', cards);
      await fixture.whenStable();

      const card = fixture.debugElement.query(By.css('mat-card'));
      card.triggerEventHandler('click');

      expect(component.cards().find((c) => c.Selected)).not.toBeUndefined();

      card.triggerEventHandler('click');

      expect(component.cards().find((c) => c.Selected)).toBeUndefined();
    });

    it('should be able to only click cells without CheckedAtUtc', async () => {
      const cards = BoardCalculations.getRowIndexes(9).map(
        (idx) =>
          new BoardCell(
            {
              CheckedAtUtc: new Date(),
            },
            idx,
            3
          )
      );
      fixture.componentRef.setInput('cards', cards);
      await fixture.whenStable();

      const card = fixture.debugElement.query(By.css('mat-card'));
      card.triggerEventHandler('click');
      expect(component.cards().find((c) => c.Selected)).toBeUndefined();
    });

    it('colors should be applied as expected', async () => {
      const cards = BoardCalculations.getRowIndexes(9).map(
        (idx) =>
          new BoardCell(
            {
              CheckedAtUtc: idx === 1 || idx === 0 ? new Date() : null,
            },
            idx,
            3
          )
      );
      cards[0].IsInBingoPattern = true;
      cards[2].Selected = true;

      fixture.componentRef.setInput('cards', cards);
      await fixture.whenStable();

      const card = fixture.debugElement.queryAll(By.css('mat-card'));
      expect(card[0].classes['bg-green']).toBeTrue();
      expect(card[1].classes['bg-yellow']).toBeTrue();
      expect(card[2].classes['bg-blue']).toBeTrue();
    });
  });

  it("in indicator mode there shouldn't be text or inputs", async () => {
    const cards = BoardCalculations.getRowIndexes(9).map(
      (idx) =>
        new BoardCell(
          {
            Name: 'lorem ipsum',
          },
          idx,
          3
        )
    );

    fixture.componentRef.setInput('previewMode', 'indicator');
    fixture.componentRef.setInput('cards', cards);
    await fixture.whenStable();

    expect(fixture.nativeElement.outerHTML).not.toContain('lorem ipsum');
    expect(fixture.debugElement.queryAll(By.css('input')).length).toBe(0);
  });

  it("in preview mode there shouldn't be inputs and click shouldn't do anything", async () => {
    const cards = BoardCalculations.getRowIndexes(9).map(
      (idx) =>
        new BoardCell(
          {
            Name: 'lorem ipsum',
          },
          idx,
          3
        )
    );

    fixture.componentRef.setInput('previewMode', 'preview');
    fixture.componentRef.setInput('cards', cards);
    await fixture.whenStable();

    const inputs = fixture.debugElement.queryAll(By.css('input'));
    expect(inputs.length).toBe(0);

    const card = fixture.debugElement.query(By.css('mat-card'));
    card.triggerEventHandler('click');
    expect(component.cards().find((c) => c.Selected)).toBeUndefined();
  });
});
