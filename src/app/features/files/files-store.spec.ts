import { TestBed } from '@angular/core/testing';
import { FilesStore } from './files-store';
import { FileRecord } from './files';

describe('FilesStore', () => {
  let store: FilesStore;

  const mockFile: FileRecord = {
    id: 'file-1',
    user_id: 'user-123',
    name: 'document.pdf',
    storage_path: 'user-123/1234567890-document.pdf',
    size: 1024,
    type: 'application/pdf',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  const mockFile2: FileRecord = {
    id: 'file-2',
    user_id: 'user-123',
    name: 'image.png',
    storage_path: 'user-123/1234567891-image.png',
    size: 2048,
    type: 'image/png',
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(FilesStore);
  });

  it('should be created', () => {
    expect(store).toBeTruthy();
  });

  describe('initial state', () => {
    it('should start with empty files', () => {
      expect(store.allFiles()).toEqual([]);
    });

    it('should start with loading false', () => {
      expect(store.isLoading()).toBe(false);
    });

    it('should start with isEmpty true', () => {
      expect(store.isEmpty()).toBe(true);
    });
  });

  describe('setFiles', () => {
    it('should set files array', () => {
      store.setFiles([mockFile, mockFile2]);

      expect(store.allFiles()).toEqual([mockFile, mockFile2]);
    });

    it('should update isEmpty to false when files added', () => {
      expect(store.isEmpty()).toBe(true);

      store.setFiles([mockFile]);

      expect(store.isEmpty()).toBe(false);
    });
  });

  describe('addFile', () => {
    it('should prepend file to array', () => {
      store.setFiles([mockFile2]);
      store.addFile(mockFile);

      expect(store.allFiles()[0]).toEqual(mockFile);
      expect(store.allFiles()[1]).toEqual(mockFile2);
    });
  });

  describe('removeFile', () => {
    it('should remove file by id', () => {
      store.setFiles([mockFile, mockFile2]);
      store.removeFile(mockFile.id);

      expect(store.allFiles()).toEqual([mockFile2]);
    });
  });

  describe('setLoading', () => {
    it('should set loading to true', () => {
      store.setLoading(true);
      expect(store.isLoading()).toBe(true);
    });

    it('should set loading to false', () => {
      store.setLoading(true);
      store.setLoading(false);
      expect(store.isLoading()).toBe(false);
    });
  });

  describe('clear', () => {
    it('should clear all files', () => {
      store.setFiles([mockFile, mockFile2]);
      store.clear();

      expect(store.allFiles()).toEqual([]);
    });

    it('should update isEmpty to true after clear', () => {
      store.setFiles([mockFile]);
      expect(store.isEmpty()).toBe(false);

      store.clear();
      expect(store.isEmpty()).toBe(true);
    });
  });
});
