import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProgressCircle } from './progress-circle';
import { provideZonelessChangeDetection } from '@angular/core';

describe('ProgressCircle', () => {
  let component: ProgressCircle;
  let fixture: ComponentFixture<ProgressCircle>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProgressCircle],
      providers: [provideZonelessChangeDetection()],
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProgressCircle);
    fixture.componentRef.setInput('total', 0);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
