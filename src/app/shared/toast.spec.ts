import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { vi } from 'vitest';
import { ToastService } from './toast';
import { environment } from '@env';

describe('ToastService', () => {
  let service: ToastService;
  let snackBarMock: { open: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    snackBarMock = { open: vi.fn() };

    TestBed.configureTestingModule({
      providers: [ToastService, { provide: MatSnackBar, useValue: snackBarMock }],
    });
    service = TestBed.inject(ToastService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('success', () => {
    it('should open snackbar with success config', () => {
      service.success('Success message');

      expect(snackBarMock.open).toHaveBeenCalledWith('Success message', 'Close', {
        duration: environment.toastDuration.success,
        panelClass: ['toast-success'],
        horizontalPosition: 'end',
        verticalPosition: 'top',
        politeness: 'polite',
      });
    });
  });

  describe('error', () => {
    it('should open snackbar with error config', () => {
      service.error('Error message');

      expect(snackBarMock.open).toHaveBeenCalledWith('Error message', 'Close', {
        duration: environment.toastDuration.error,
        panelClass: ['toast-error'],
        horizontalPosition: 'end',
        verticalPosition: 'top',
        politeness: 'assertive',
      });
    });
  });

  describe('info', () => {
    it('should open snackbar with info config', () => {
      service.info('Info message');

      expect(snackBarMock.open).toHaveBeenCalledWith('Info message', 'Close', {
        duration: environment.toastDuration.info,
        panelClass: ['toast-info'],
        horizontalPosition: 'end',
        verticalPosition: 'top',
        politeness: 'polite',
      });
    });
  });
});
