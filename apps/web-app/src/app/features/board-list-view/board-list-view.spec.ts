import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BoardListView } from './board-list-view';
import { provideZonelessChangeDetection } from '@angular/core';

describe('BoardListView', () => {
  let component: BoardListView;
  let fixture: ComponentFixture<BoardListView>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BoardListView],
      providers: [provideZonelessChangeDetection()],
    })
    .compileComponents();

    fixture = TestBed.createComponent(BoardListView);
    fixture.componentRef.setInput('cards', []);
    fixture.componentRef.setInput('disabled', false);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
