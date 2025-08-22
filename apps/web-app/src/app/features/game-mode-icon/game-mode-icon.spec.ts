import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GameModeIcon } from './game-mode-icon';
import { provideZonelessChangeDetection } from '@angular/core';

describe('GameModeIcon', () => {
  let component: GameModeIcon;
  let fixture: ComponentFixture<GameModeIcon>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GameModeIcon],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(GameModeIcon);
    fixture.componentRef.setInput('gameMode', 'todo');
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
