import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeadlineHourglass } from './deadline-hourglass';
import { provideZonelessChangeDetection } from '@angular/core';

describe('DeadlineHourglass', () => {
  let component: DeadlineHourglass;
  let fixture: ComponentFixture<DeadlineHourglass>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeadlineHourglass],
      providers: [provideZonelessChangeDetection()],
    })
    .compileComponents();

    fixture = TestBed.createComponent(DeadlineHourglass);
    fixture.componentRef.setInput('completionDate', null);
    fixture.componentRef.setInput('deadlineDate', null);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
