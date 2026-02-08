import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { FilesPage } from './files-page';
import { FilesService, FileRecord } from '../files';
import { FilesStore } from '../files-store';
import { ToastService, ConfirmDialogService } from '@shared';

describe('FilesPage', () => {
  let component: FilesPage;
  let fixture: ComponentFixture<FilesPage>;
  let filesServiceMock: any;
  let store: FilesStore;
  let toastMock: any;
  let confirmDialogMock: any;

  const mockFiles: FileRecord[] = [
    {
      id: 'file-1',
      user_id: 'user-123',
      name: 'document.pdf',
      storage_path: 'user-123/1234567890-document.pdf',
      size: 1024,
      type: 'application/pdf',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 'file-2',
      user_id: 'user-123',
      name: 'image.png',
      storage_path: 'user-123/1234567891-image.png',
      size: 2048,
      type: 'image/png',
      created_at: '2024-01-02T00:00:00Z',
      updated_at: '2024-01-02T00:00:00Z',
    },
  ];

  beforeEach(async () => {
    filesServiceMock = {
      list: vi.fn().mockResolvedValue(mockFiles),
      upload: vi.fn().mockResolvedValue(mockFiles[0]),
      download: vi.fn().mockResolvedValue('https://example.com/signed-url'),
      delete: vi.fn().mockResolvedValue(undefined),
    };

    toastMock = {
      success: vi.fn(),
      error: vi.fn(),
    };

    confirmDialogMock = {
      confirm: vi.fn().mockResolvedValue(false),
    };

    await TestBed.configureTestingModule({
      imports: [FilesPage, NoopAnimationsModule],
      providers: [
        { provide: FilesService, useValue: filesServiceMock },
        { provide: ToastService, useValue: toastMock },
        { provide: ConfirmDialogService, useValue: confirmDialogMock },
      ],
    }).compileComponents();

    store = TestBed.inject(FilesStore);
    fixture = TestBed.createComponent(FilesPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load files on init', () => {
    expect(filesServiceMock.list).toHaveBeenCalled();
    expect(component.files().length).toBe(2);
  });

  describe('display', () => {
    it('should display file cards when files exist', () => {
      fixture.detectChanges();
      const cards = fixture.nativeElement.querySelectorAll('.file-card');
      expect(cards.length).toBe(2);
    });

    it('should show empty state when no files', async () => {
      filesServiceMock.list.mockResolvedValue([]);
      const emptyFixture = TestBed.createComponent(FilesPage);
      await emptyFixture.whenStable();
      emptyFixture.detectChanges();

      const emptyState = emptyFixture.nativeElement.querySelector('app-empty-state');
      expect(emptyState).toBeTruthy();
    });
  });

  describe('upload', () => {
    it('should upload file and add to list', async () => {
      const newFile: FileRecord = {
        id: 'file-3',
        user_id: 'user-123',
        name: 'new.txt',
        storage_path: 'user-123/999-new.txt',
        size: 512,
        type: 'text/plain',
        created_at: '2024-01-03T00:00:00Z',
        updated_at: '2024-01-03T00:00:00Z',
      };
      filesServiceMock.upload.mockResolvedValue(newFile);

      const file = new File(['data'], 'new.txt', { type: 'text/plain' });
      const event = { target: { files: [file], value: '' } } as unknown as Event;

      await component.onFilesSelected(event);

      expect(filesServiceMock.upload).toHaveBeenCalledWith(file);
      expect(component.files().length).toBe(3);
      expect(component.files()[0]).toEqual(newFile);
    });
  });

  describe('download', () => {
    it('should open signed URL in new tab', async () => {
      const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

      await component.downloadFile(mockFiles[0]);

      expect(filesServiceMock.download).toHaveBeenCalledWith(mockFiles[0]);
      expect(openSpy).toHaveBeenCalledWith('https://example.com/signed-url', '_blank');
      openSpy.mockRestore();
    });
  });

  describe('delete', () => {
    it('should confirm before deleting', async () => {
      await component.deleteFile(mockFiles[0]);

      expect(confirmDialogMock.confirm).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Delete File',
          message: expect.stringContaining('document.pdf'),
        }),
      );
    });

    it('should optimistically remove from list then call service', async () => {
      confirmDialogMock.confirm.mockResolvedValue(true);

      await component.deleteFile(mockFiles[0]);

      expect(component.files().length).toBe(1);
      expect(component.files()[0].id).toBe('file-2');
      expect(filesServiceMock.delete).toHaveBeenCalledWith(mockFiles[0]);
    });

    it('should refetch files on delete error', async () => {
      confirmDialogMock.confirm.mockResolvedValue(true);
      filesServiceMock.delete.mockRejectedValue(new Error('Delete failed'));

      await component.deleteFile(mockFiles[0]);

      expect(toastMock.error).toHaveBeenCalledWith('Delete failed');
      expect(filesServiceMock.list).toHaveBeenCalledTimes(2); // initial + refetch
    });

    it('should not delete when cancelled', async () => {
      confirmDialogMock.confirm.mockResolvedValue(false);

      await component.deleteFile(mockFiles[0]);

      expect(filesServiceMock.delete).not.toHaveBeenCalled();
      expect(component.files().length).toBe(2);
    });
  });
});
