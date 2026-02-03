import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { ConfirmDialog } from './confirm-dialog';

describe('ConfirmDialog', () => {
  let component: ConfirmDialog;
  let fixture: ComponentFixture<ConfirmDialog>;
  let dialogRefMock: { close: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    dialogRefMock = {
      close: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [ConfirmDialog, NoopAnimationsModule],
      providers: [
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            title: 'Test Title',
            message: 'Test Message',
            confirmText: 'Confirm',
            cancelText: 'Cancel',
          },
        },
        { provide: MatDialogRef, useValue: dialogRefMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display dialog data', () => {
    expect(component.data.title).toBe('Test Title');
    expect(component.data.message).toBe('Test Message');
  });

  it('should close with false when cancel button is clicked', () => {
    const cancelBtn = fixture.nativeElement.querySelector(
      'button[mat-button]',
    ) as HTMLButtonElement;
    cancelBtn.click();
    expect(dialogRefMock.close).toHaveBeenCalledWith(false);
  });

  it('should close with true when confirm button is clicked', () => {
    const confirmBtn = fixture.nativeElement.querySelector(
      'button[mat-raised-button]',
    ) as HTMLButtonElement;
    confirmBtn.click();
    expect(dialogRefMock.close).toHaveBeenCalledWith(true);
  });
});
