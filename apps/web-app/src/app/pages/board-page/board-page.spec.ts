import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BoardPage } from './board-page';
import { provideZonelessChangeDetection } from '@angular/core';
import { BingoLocalStorage } from '../../features/persistence/bingo-local';
import { BingoApi } from '../../features/persistence/bingo-api';

describe('BoardPage', () => {
  let component: BoardPage;
  let fixture: ComponentFixture<BoardPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BoardPage],
      providers: [
        provideZonelessChangeDetection(),
        {
          provide: BingoApi,
          useValue: jasmine.createSpyObj<BingoApi>(['createBoard']),
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BoardPage);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('board', BingoLocalStorage.DefaultBoard);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // TODO tests:
  // check computed values and methods
  // local visibility should store to localstorage, otherwise check that BingoApi is called
  // check buttons in template, especially when switching to edit mode or selecting a cell
  // revertDeadlineAndRewardIfModifiedWithoutGameModeChange
  // generateEndStateMessage
  // unselect
  // saveSelected
  // delete
  // update
  // continueAfterBingo
});
