import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SaveWarnDialog } from './save-warn-dialog';
import { provideZonelessChangeDetection } from '@angular/core';
import { BoardInfo } from '../board/board';
import { MatTestDialogOpener } from '@angular/material/dialog/testing';

describe('SaveWarnDialog', () => {
  let component: MatTestDialogOpener<SaveWarnDialog>;
  let fixture: ComponentFixture<MatTestDialogOpener<SaveWarnDialog>>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SaveWarnDialog],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();
  });

  function createComponent(data: {
    board: BoardInfo;
    overridesLocal: boolean;
  }) {
    fixture = TestBed.createComponent(
      MatTestDialogOpener.withComponent(SaveWarnDialog, { data: data })
    );
    component = fixture.componentInstance;
    fixture.autoDetectChanges();
  }

  it('should create', () => {
    createComponent({ board: new BoardInfo(), overridesLocal: false });
    expect(component).toBeTruthy();
  });
});
