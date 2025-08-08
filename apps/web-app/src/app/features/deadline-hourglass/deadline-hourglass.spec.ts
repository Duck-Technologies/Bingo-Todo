import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeadlineHourglass } from './deadline-hourglass';
import { provideZonelessChangeDetection } from '@angular/core';
import { calculateDateFromNow } from '../calculations/date-calculations';

describe('DeadlineHourglass', () => {
  let component: DeadlineHourglass;
  let fixture: ComponentFixture<DeadlineHourglass>;
  let icon: { textContent: string; classList: string[] };
  let span: { textContent: string };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeadlineHourglass],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(DeadlineHourglass);
    fixture.componentRef.setInput('completionDate', null);
    fixture.componentRef.setInput('deadlineDate', null);

    component = fixture.componentInstance;
    fixture.autoDetectChanges();

    icon = fixture.nativeElement.querySelector('mat-icon');
    span = fixture.nativeElement.querySelector('span');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it("should display hourglass_disabled if there's no deadline", async () => {
    fixture.componentRef.setInput('completionDate', new Date());
    await fixture.whenStable();

    expect(icon.textContent).toEqual('hourglass_disabled');
    expect(span.textContent).toEqual("The board doesn't have a deadline.");
  });

  it("should display hourglass_top if there's a deadline in the future", async () => {
    const deadlineDate = calculateDateFromNow(61);
    fixture.componentRef.setInput('deadlineDate', deadlineDate);
    await fixture.whenStable();

    expect(icon.textContent).toEqual('hourglass_top');
    expect(icon.classList).toContain('green');
    expect(span.textContent).toMatch('Deadline is set to');
  });

  it("should display hourglass_top if there's a deadline in one hour", async () => {
    const deadlineDate = calculateDateFromNow(60);
    fixture.componentRef.setInput('deadlineDate', deadlineDate);
    await fixture.whenStable();

    expect(icon.textContent).toEqual('hourglass_top');
    expect(icon.classList).toContain('yellow');
    expect(span.textContent).toMatch('Deadline expires in an hour at');
  });

  it('should display hourglass_bottom if the deadline is in the past', async () => {
    const deadlineDate = calculateDateFromNow(-60);
    fixture.componentRef.setInput('deadlineDate', deadlineDate);
    await fixture.whenStable();

    expect(icon.textContent).toEqual('hourglass_bottom');
    expect(icon.classList).toContain('red');
    expect(span.textContent).toMatch('Deadline expired at');
  });

  it('should display hourglass_bottom if the deadline is after completion date', async () => {
    const deadlineDate = calculateDateFromNow(85);
    fixture.componentRef.setInput('deadlineDate', deadlineDate);
    fixture.componentRef.setInput('completionDate', new Date());
    await fixture.whenStable();

    expect(icon.textContent).toEqual('hourglass_bottom');
    expect(icon.classList).toContain('green');
    expect(span.textContent).toMatch('Deadline was set to');
  });

  it('should display hourglass_bottom if the deadline is before completion date', async () => {
    const deadlineDate = calculateDateFromNow(-80);
    fixture.componentRef.setInput('deadlineDate', deadlineDate);
    fixture.componentRef.setInput('completionDate', new Date());
    await fixture.whenStable();

    expect(icon.textContent).toEqual('hourglass_bottom');
    expect(icon.classList).not.toContain('green');
    expect(span.textContent).toMatch('Deadline expired at');
  });

  /**
   * Ideally there would be a solution for this, but
   * I didn't find a working one with zoneless at the moment
   * to advance time
   */
  // it('icon should switch to yellow in the last hour', async () => {
  //   const deadlineDate = calculateDateFromNow(61);
  //   fixture.componentRef.setInput('deadlineDate', deadlineDate);
  //   await fixture.whenStable();

  //   expect(icon.textContent).toEqual('hourglass_top');
  //   expect(icon.classList).toContain('green');

  //   // wait x msonds here
  //   await fixture.whenStable();
    
  //   expect(fixture.nativeElement.querySelector('mat-icon').classList).toContain(
  //     'yellow'
  //   );
  // });
});
