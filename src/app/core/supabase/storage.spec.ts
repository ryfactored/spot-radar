import { TestBed } from '@angular/core/testing';
import { StorageService } from './storage';
import { SupabaseService } from './supabase';
import { environment } from '@env';

describe('StorageService', () => {
  let service: StorageService;
  let mockStorage: any;
  let mockSupabase: any;

  beforeEach(() => {
    mockStorage = {
      from: vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue({ data: { path: 'test/file.png' }, error: null }),
        getPublicUrl: vi
          .fn()
          .mockReturnValue({ data: { publicUrl: 'https://example.com/test/file.png' } }),
        createSignedUrl: vi
          .fn()
          .mockResolvedValue({ data: { signedUrl: 'https://example.com/signed' }, error: null }),
        remove: vi.fn().mockResolvedValue({ data: [], error: null }),
      }),
    };

    mockSupabase = {
      client: { storage: mockStorage },
    };

    TestBed.configureTestingModule({
      providers: [StorageService, { provide: SupabaseService, useValue: mockSupabase }],
    });

    service = TestBed.inject(StorageService);
  });

  describe('validateAvatar', () => {
    it('should return null for valid JPEG', () => {
      const file = new File(['data'], 'avatar.jpg', { type: 'image/jpeg' });
      expect(service.validateAvatar(file)).toBeNull();
    });

    it('should return null for valid PNG', () => {
      const file = new File(['data'], 'avatar.png', { type: 'image/png' });
      expect(service.validateAvatar(file)).toBeNull();
    });

    it('should return error for invalid type', () => {
      const file = new File(['data'], 'doc.pdf', { type: 'application/pdf' });
      expect(service.validateAvatar(file)).toBe('File type not supported');
    });

    it('should return null for valid SVG', () => {
      const file = new File(['<svg></svg>'], 'avatar.svg', { type: 'image/svg+xml' });
      expect(service.validateAvatar(file)).toBeNull();
    });

    it('should return error for file exceeding environment avatar size limit', () => {
      const maxBytes = environment.upload.avatarMaxSizeMB * 1024 * 1024;
      const largeData = new Uint8Array(maxBytes + 1);
      const file = new File([largeData], 'large.png', { type: 'image/png' });
      expect(service.validateAvatar(file)).toBe(
        `Avatar must be less than ${environment.upload.avatarMaxSizeMB}MB`,
      );
    });
  });

  describe('validateAttachment', () => {
    it('should return null for valid PDF under size limit', () => {
      const file = new File(['data'], 'doc.pdf', { type: 'application/pdf' });
      expect(service.validateAttachment(file)).toBeNull();
    });

    it('should return null for valid Word document', () => {
      const file = new File(['data'], 'doc.docx', {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
      expect(service.validateAttachment(file)).toBeNull();
    });

    it('should return null for valid image file', () => {
      const file = new File(['data'], 'image.png', { type: 'image/png' });
      expect(service.validateAttachment(file)).toBeNull();
    });

    it('should return error for disallowed MIME type', () => {
      const file = new File(['data'], 'app.exe', { type: 'application/octet-stream' });
      expect(service.validateAttachment(file)).toBe('File type not supported');
    });

    it('should return error for zip files', () => {
      const file = new File(['data'], 'archive.zip', { type: 'application/zip' });
      expect(service.validateAttachment(file)).toBe('File type not supported');
    });

    it('should return null for valid SVG file', () => {
      const file = new File(['<svg></svg>'], 'diagram.svg', { type: 'image/svg+xml' });
      expect(service.validateAttachment(file)).toBeNull();
    });

    it('should return error for file exceeding environment attachment size limit', () => {
      const maxBytes = environment.upload.attachmentMaxSizeMB * 1024 * 1024;
      const largeData = new Uint8Array(maxBytes + 1);
      const file = new File([largeData], 'large.pdf', { type: 'application/pdf' });
      expect(service.validateAttachment(file)).toBe(
        `File must be less than ${environment.upload.attachmentMaxSizeMB}MB`,
      );
    });
  });

  describe('sanitizeFilename', () => {
    it('should preserve safe characters', () => {
      expect(service.sanitizeFilename('document.pdf')).toBe('document.pdf');
      expect(service.sanitizeFilename('my-file_v2.txt')).toBe('my-file_v2.txt');
    });

    it('should replace unsafe characters with underscores', () => {
      expect(service.sanitizeFilename('file name.pdf')).toBe('file_name.pdf');
      expect(service.sanitizeFilename('../../../etc/passwd')).toBe('.._.._.._etc_passwd');
      expect(service.sanitizeFilename('file<script>.pdf')).toBe('file_script_.pdf');
    });

    it('should limit filename length to 255 characters', () => {
      const longName = 'a'.repeat(300) + '.pdf';
      expect(service.sanitizeFilename(longName).length).toBe(255);
    });
  });

  describe('getExtensionFromMime', () => {
    it('should return correct extension for known MIME types', () => {
      expect(service.getExtensionFromMime('image/jpeg')).toBe('jpg');
      expect(service.getExtensionFromMime('image/png')).toBe('png');
      expect(service.getExtensionFromMime('image/gif')).toBe('gif');
      expect(service.getExtensionFromMime('image/webp')).toBe('webp');
      expect(service.getExtensionFromMime('image/svg+xml')).toBe('svg');
    });

    it('should return bin for unknown MIME types', () => {
      expect(service.getExtensionFromMime('application/octet-stream')).toBe('bin');
      expect(service.getExtensionFromMime('unknown/type')).toBe('bin');
    });
  });

  describe('upload', () => {
    it('should upload file and return path and publicUrl', async () => {
      const file = new File(['data'], 'test.png', { type: 'image/png' });
      const result = await service.upload({ bucket: 'avatars', path: 'user/avatar.png', file });

      expect(mockStorage.from).toHaveBeenCalledWith('avatars');
      expect(result.path).toBe('user/avatar.png');
      expect(result.publicUrl).toBe('https://example.com/test/file.png');
    });

    it('should pass upsert option', async () => {
      const file = new File(['data'], 'test.png', { type: 'image/png' });
      await service.upload({ bucket: 'avatars', path: 'user/avatar.png', file, upsert: true });

      const uploadFn = mockStorage.from().upload;
      expect(uploadFn).toHaveBeenCalledWith('user/avatar.png', file, { upsert: true });
    });

    it('should throw on upload error', async () => {
      mockStorage.from.mockReturnValue({
        upload: vi.fn().mockResolvedValue({ data: null, error: { message: 'Upload failed' } }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: '' } }),
      });

      const file = new File(['data'], 'test.png', { type: 'image/png' });
      await expect(service.upload({ bucket: 'avatars', path: 'test', file })).rejects.toThrow();
    });
  });

  describe('getPublicUrl', () => {
    it('should return public URL for a path', () => {
      const url = service.getPublicUrl('avatars', 'user/avatar.png');
      expect(url).toBe('https://example.com/test/file.png');
      expect(mockStorage.from).toHaveBeenCalledWith('avatars');
    });
  });

  describe('createSignedUrl', () => {
    it('should return signed URL', async () => {
      const url = await service.createSignedUrl('note-attachments', 'user/file.pdf');
      expect(url).toBe('https://example.com/signed');
      expect(mockStorage.from).toHaveBeenCalledWith('note-attachments');
    });

    it('should throw on signed URL error', async () => {
      mockStorage.from.mockReturnValue({
        createSignedUrl: vi.fn().mockResolvedValue({ data: null, error: { message: 'Failed' } }),
      });

      await expect(service.createSignedUrl('note-attachments', 'bad/path')).rejects.toThrow();
    });
  });

  describe('remove', () => {
    it('should remove files from bucket', async () => {
      await service.remove('avatars', ['user/avatar.png']);

      const removeFn = mockStorage.from().remove;
      expect(removeFn).toHaveBeenCalledWith(['user/avatar.png']);
    });

    it('should throw on remove error', async () => {
      mockStorage.from.mockReturnValue({
        remove: vi.fn().mockResolvedValue({ error: { message: 'Remove failed' } }),
      });

      await expect(service.remove('avatars', ['bad/path'])).rejects.toThrow();
    });
  });
});
