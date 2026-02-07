import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';

import { FilesService, FileRecord } from './files';
import { SupabaseService, AuthService, StorageService } from '@core';
import { environment } from '@env';

describe('FilesService', () => {
  let service: FilesService;
  let mockSupabaseClient: any;
  let storageMock: any;

  const mockUser = { id: 'user-123', email: 'test@test.com' };

  const mockFile: FileRecord = {
    id: 'file-1',
    user_id: 'user-123',
    name: 'test.pdf',
    storage_path: 'user-123/1234567890-test.pdf',
    size: 1024,
    type: 'application/pdf',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  beforeEach(() => {
    mockSupabaseClient = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: [mockFile], error: null }),
        }),
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockFile, error: null }),
          }),
        }),
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
    };

    storageMock = {
      validateAttachment: vi.fn().mockReturnValue(null),
      sanitizeFilename: vi.fn((name: string) =>
        name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 255),
      ),
      upload: vi.fn().mockResolvedValue({ path: 'user-123/file.pdf', publicUrl: '' }),
      createSignedUrl: vi.fn().mockResolvedValue('https://example.com/signed-url'),
      remove: vi.fn().mockResolvedValue(undefined),
    };

    TestBed.configureTestingModule({
      providers: [
        FilesService,
        { provide: SupabaseService, useValue: { client: mockSupabaseClient } },
        { provide: AuthService, useValue: { currentUser: signal(mockUser as any) } },
        { provide: StorageService, useValue: storageMock },
      ],
    });

    service = TestBed.inject(FilesService);
  });

  describe('list', () => {
    it('should return files ordered by created_at desc', async () => {
      const result = await service.list();
      expect(result).toEqual([mockFile]);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('files');
    });

    it('should throw on error', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: null, error: new Error('DB error') }),
        }),
      });

      await expect(service.list()).rejects.toThrow('Something went wrong');
    });
  });

  describe('upload', () => {
    it('should validate file before uploading', async () => {
      const file = new File(['data'], 'test.pdf', { type: 'application/pdf' });
      await service.upload(file);
      expect(storageMock.validateAttachment).toHaveBeenCalledWith(file);
    });

    it('should throw when file is invalid', async () => {
      storageMock.validateAttachment.mockReturnValue('File too large');
      const file = new File(['data'], 'big.zip', { type: 'application/zip' });

      await expect(service.upload(file)).rejects.toThrow('File too large');
    });

    it('should throw when user is not authenticated', async () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          FilesService,
          { provide: SupabaseService, useValue: { client: mockSupabaseClient } },
          { provide: AuthService, useValue: { currentUser: signal(null) } },
          { provide: StorageService, useValue: storageMock },
        ],
      });
      const unauthService = TestBed.inject(FilesService);

      const file = new File(['data'], 'test.pdf', { type: 'application/pdf' });
      await expect(unauthService.upload(file)).rejects.toThrow('Please sign in to continue');
    });

    it('should upload to storage and insert DB record', async () => {
      const file = new File(['data'], 'test.pdf', { type: 'application/pdf' });
      const result = await service.upload(file);

      expect(storageMock.upload).toHaveBeenCalledWith(
        expect.objectContaining({
          bucket: environment.storageBuckets.files,
          file,
        }),
      );
      expect(result).toEqual(mockFile);
    });

    it('should use correct path format with userId and timestamp', async () => {
      const file = new File(['data'], 'doc.pdf', { type: 'application/pdf' });
      await service.upload(file);

      const uploadCall = storageMock.upload.mock.calls[0][0];
      expect(uploadCall.path).toMatch(/^user-123\/\d+-doc\.pdf$/);
    });
  });

  describe('download', () => {
    it('should return signed URL', async () => {
      const url = await service.download(mockFile);
      expect(url).toBe('https://example.com/signed-url');
      expect(storageMock.createSignedUrl).toHaveBeenCalledWith(
        environment.storageBuckets.files,
        mockFile.storage_path,
      );
    });

    it('should throw on error', async () => {
      storageMock.createSignedUrl.mockRejectedValue(new Error('Storage error'));
      await expect(service.download(mockFile)).rejects.toThrow('Storage error');
    });
  });

  describe('delete', () => {
    it('should delete DB record and storage file', async () => {
      await service.delete(mockFile);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('files');
      expect(storageMock.remove).toHaveBeenCalledWith(environment.storageBuckets.files, [
        mockFile.storage_path,
      ]);
    });

    it('should throw on DB error', async () => {
      mockSupabaseClient.from.mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: null, error: new Error('Delete failed') }),
        }),
      });

      await expect(service.delete(mockFile)).rejects.toThrow('Something went wrong');
    });
  });
});
