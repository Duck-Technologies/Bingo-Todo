import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BoardListView } from './board-list-view';

describe('BoardListView', () => {
  let component: BoardListView;
  let fixture: ComponentFixture<BoardListView>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BoardListView]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BoardListView);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
