import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateWarnDialog } from './create-warn-dialog';
import { provideZonelessChangeDetection } from '@angular/core';
import { BoardInfo } from '../board/board';
import { MatTestDialogOpener } from '@angular/material/dialog/testing';

describe('CreateWarnDialog', () => {
  let component: MatTestDialogOpener<CreateWarnDialog>;
  let fixture: ComponentFixture<MatTestDialogOpener<CreateWarnDialog>>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateWarnDialog],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();
  });

  function createComponent(data: {
    board: BoardInfo;
    overridesLocal: boolean;
  }) {
    fixture = TestBed.createComponent(
      MatTestDialogOpener.withComponent(CreateWarnDialog, { data: data })
    );
    component = fixture.componentInstance;
    fixture.autoDetectChanges();
  }

  it('should create', () => {
    createComponent({ board: new BoardInfo(), overridesLocal: false });
    expect(component).toBeTruthy();
  });
});
