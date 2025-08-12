import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Message } from './message';
import { provideZonelessChangeDetection } from '@angular/core';

describe('Message', () => {
  let component: Message;
  let fixture: ComponentFixture<Message>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Message],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(Message);
    component = fixture.componentInstance;
    fixture.componentRef.setInput("type", "success");
    fixture.componentRef.setInput("title", "Success");
    fixture.autoDetectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
