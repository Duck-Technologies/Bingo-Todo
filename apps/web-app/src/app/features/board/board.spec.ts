import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Board } from './board';
import { provideZonelessChangeDetection } from '@angular/core';

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
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // TODO tests:
  // - disabled state based on previewMode
  // - cells should be empty in indicator mode

  it('should color bingo cols as expected 5', () => {
    const mode = 5;
    [4, 3, 2, 1, 0].forEach((i) => {
      fixture.componentRef.setInput(
        'cards',
        [...Array(mode * mode).keys()].map((num) => ({
          Name: '',
          CheckedDateUTC: (num - i) % mode === 0 ? new Date() : null,
          IsInBingoPattern: false,
          Selected: false,
        }))
      );

      // needed because of the effect()
      fixture.detectChanges();

      expect(
        component.cards().reduce((acc, curr) => acc + +curr.IsInBingoPattern, 0)
      ).toEqual(mode);
    });
  });

  it('should color bingo cols as expected 4', () => {
    const mode = 4;
    [3, 2, 1, 0].forEach((i) => {
      fixture.componentRef.setInput(
        'cards',
        [...Array(mode * mode).keys()].map((num) => ({
          Name: '',
          CheckedDateUTC: (num - i) % mode === 0 ? new Date() : null,
          IsInBingoPattern: false,
          Selected: false,
        }))
      );

      fixture.detectChanges();

      expect(
        component.cards().reduce((acc, curr) => acc + +curr.IsInBingoPattern, 0)
      ).toEqual(mode);
    });
  });

  it("shouldn't color bingo cols when not applicable", () => {
    fixture.componentRef.setInput(
      'cards',
      [...new Array(5)].reduce(
        (acc, curr, idx) => [
          ...acc,
          {
            Name: '',
            CheckedDateUTC: idx === 0 ? null : new Date(),
            IsInBingoPattern: false,
            Selected: false,
          },
          ...new Array(4).fill({
            Name: '',
            CheckedDateUTC: null,
            IsInBingoPattern: false,
            Selected: false,
          }),
        ],
        []
      )
    );

    expect(
      component.cards().reduce((acc, curr) => acc + +curr.IsInBingoPattern, 0)
    ).toEqual(0);
  });

  it('should color bingo rows as expected', () => {
    fixture.componentRef.setInput(
      'cards',
      [...Array(16).keys()].map((num, idx) => ({
        Name: '',
        CheckedDateUTC: num < 4 ? new Date() : null,
        IsInBingoPattern: false,
        Selected: false,
      }))
    );

    fixture.detectChanges();

    expect(
      component.cards().reduce((acc, curr) => acc + +curr.IsInBingoPattern, 0)
    ).toEqual(4);
  });

  it('should color bingo rows as expected v2', () => {
    fixture.componentRef.setInput(
      'cards',
      [...Array(16).keys()].map((num, idx) => ({
        Name: '',
        CheckedDateUTC: num >= 12 ? new Date() : null,
        IsInBingoPattern: false,
        Selected: false,
      }))
    );

    fixture.detectChanges();

    expect(
      component.cards().reduce((acc, curr) => acc + +curr.IsInBingoPattern, 0)
    ).toEqual(4);
  });

  it("shouldn' color bingo rows when not applicable", () => {
    fixture.componentRef.setInput(
      'cards',
      [...Array(16).keys()].map((num, idx) => ({
        Name: '',
        CheckedDateUTC: num > 12 ? new Date() : null,
        IsInBingoPattern: false,
        Selected: false,
      }))
    );

    fixture.detectChanges();

    expect(
      component.cards().reduce((acc, curr) => acc + +curr.IsInBingoPattern, 0)
    ).toEqual(0);
  });

  it('should color diagonal bingo as expected', () => {
    [3, 4, 5].forEach((mode) => {
      fixture.componentRef.setInput(
        'cards',
        [...Array(mode * mode).keys()].map((num, idx) => ({
          Name: '',
          CheckedDateUTC: num % (mode + 1) === 0 ? new Date() : null,
          IsInBingoPattern: false,
          Selected: false,
        }))
      );

      const expected = {
        '3': [0, 4, 8],
        '4': [0, 5, 10, 15],
        '5': [0, 6, 12, 18, 24],
      }[mode.toString()] as number[];

      fixture.detectChanges();

      expect(
        component
          .cards()
          .map((c, idx) => (c.IsInBingoPattern === false ? undefined : idx))
          .filter((c) => c !== undefined)
      ).toEqual(expected);
    });
  });

  it('should color diagonal bingo as expected v2', () => {
    [3, 4, 5].forEach((mode) => {
      fixture.componentRef.setInput(
        'cards',
        [...Array(mode * mode).keys()].map((num, idx) => ({
          Name: '',
          CheckedDateUTC:
            (mode === 3 && [2, 4, 6].includes(idx)) ||
            (mode !== 3 && num % (mode - 1) === 0)
              ? new Date()
              : null,
          IsInBingoPattern: false,
          Selected: false,
        }))
      );

      const expected = {
        '3': [2, 4, 6],
        '4': [3, 6, 9, 12],
        '5': [4, 8, 12, 16, 20],
      }[mode.toString()] as number[];

      fixture.detectChanges();

      expect(
        component
          .cards()
          .map((c, idx) => (c.IsInBingoPattern === false ? undefined : idx))
          .filter((c) => c !== undefined)
      ).toEqual(expected);

      expect(
        component.cards().reduce((acc, curr) => acc + +curr.IsInBingoPattern, 0)
      ).toEqual(mode);
    });
  });
});
