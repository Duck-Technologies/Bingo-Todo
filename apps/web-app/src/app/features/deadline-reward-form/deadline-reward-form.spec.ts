import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeadlineRewardForm } from './deadline-reward-form';
import { provideZonelessChangeDetection } from '@angular/core';

describe('DeadlineRewardForm', () => {
  let component: DeadlineRewardForm;
  let fixture: ComponentFixture<DeadlineRewardForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeadlineRewardForm],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(DeadlineRewardForm);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('createMode', true);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
