import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { ConfirmDialogService } from './confirm-dialog-service';
import { ConfirmDialog } from './confirm-dialog';

describe('ConfirmDialogService', () => {
  let service: ConfirmDialogService;
  let dialogMock: { open: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    dialogMock = { open: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        ConfirmDialogService,
        { provide: MatDialog, useValue: dialogMock },
      ],
    });
    service = TestBed.inject(ConfirmDialogService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('confirm', () => {
    it('should open dialog with provided data', async () => {
      dialogMock.open.mockReturnValue({ afterClosed: () => of(true) });

      await service.confirm({
        title: 'Delete Item',
        message: 'Are you sure?',
      });

      expect(dialogMock.open).toHaveBeenCalledWith(ConfirmDialog, {
        width: '400px',
        data: {
          title: 'Delete Item',
          message: 'Are you sure?',
          confirmText: 'Confirm',
          cancelText: 'Cancel',
        },
      });
    });

    it('should use custom button text when provided', async () => {
      dialogMock.open.mockReturnValue({ afterClosed: () => of(true) });

      await service.confirm({
        title: 'Delete',
        message: 'Sure?',
        confirmText: 'Delete',
        cancelText: 'Keep',
      });

      expect(dialogMock.open).toHaveBeenCalledWith(ConfirmDialog, {
        width: '400px',
        data: {
          title: 'Delete',
          message: 'Sure?',
          confirmText: 'Delete',
          cancelText: 'Keep',
        },
      });
    });

    it('should resolve true when dialog returns true', async () => {
      dialogMock.open.mockReturnValue({ afterClosed: () => of(true) });

      const result = await service.confirm({
        title: 'Test',
        message: 'Test',
      });

      expect(result).toBe(true);
    });

    it('should resolve false when dialog returns false', async () => {
      dialogMock.open.mockReturnValue({ afterClosed: () => of(false) });

      const result = await service.confirm({
        title: 'Test',
        message: 'Test',
      });

      expect(result).toBe(false);
    });

    it('should resolve false when dialog is dismissed (undefined)', async () => {
      dialogMock.open.mockReturnValue({ afterClosed: () => of(undefined) });

      const result = await service.confirm({
        title: 'Test',
        message: 'Test',
      });

      expect(result).toBe(false);
    });
  });
});
