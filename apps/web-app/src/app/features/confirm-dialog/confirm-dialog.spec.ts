import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfirmDialog } from './confirm-dialog';
import { provideZonelessChangeDetection } from '@angular/core';
import { MatTestDialogOpener } from '@angular/material/dialog/testing';

describe('ConfirmDialog', () => {
  let component: MatTestDialogOpener<ConfirmDialog>;
  let fixture: ComponentFixture<MatTestDialogOpener<ConfirmDialog>>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmDialog],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(
      MatTestDialogOpener.withComponent(ConfirmDialog, { data: {type: 'confirm'} })
    );
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
