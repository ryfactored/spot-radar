import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';

import { NotesService, Note } from './notes';
import { SupabaseService } from '../../core/supabase';
import { AuthService } from '../../core/auth';

describe('NotesService', () => {
  let service: NotesService;
  let mockSupabaseClient: any;

  const mockUser = { id: 'user-123', email: 'test@test.com' };
  const mockNote: Note = {
    id: 'note-1',
    user_id: 'user-123',
    title: 'Test Note',
    content: 'Test content',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  function createMockSupabaseClient(overrides: any = {}) {
    return {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            range: vi.fn().mockReturnValue({
              ilike: vi.fn().mockResolvedValue({ data: [mockNote], error: null, count: 1 }),
              then: (cb: any) => Promise.resolve({ data: [mockNote], error: null, count: 1 }).then(cb),
              ...overrides.range,
            }),
            ...overrides.order,
          }),
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockNote, error: null }),
            ...overrides.selectEq,
          }),
          ...overrides.select,
        }),
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockNote, error: null }),
            ...overrides.insertSelect,
          }),
          ...overrides.insert,
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: mockNote, error: null }),
              ...overrides.updateSelect,
            }),
            ...overrides.updateEq,
          }),
          ...overrides.update,
        }),
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
          ...overrides.delete,
        }),
        ...overrides.from,
      }),
    };
  }

  beforeEach(() => {
    mockSupabaseClient = createMockSupabaseClient();

    const supabaseMock = { client: mockSupabaseClient };
    const authMock = { currentUser: signal(mockUser as any) };

    TestBed.configureTestingModule({
      providers: [
        NotesService,
        { provide: SupabaseService, useValue: supabaseMock },
        { provide: AuthService, useValue: authMock },
      ],
    });

    service = TestBed.inject(NotesService);
  });

  describe('list', () => {
    it('should return notes with count', async () => {
      const result = await service.list(1, 10, '');
      expect(result.data).toEqual([mockNote]);
      expect(result.count).toBe(1);
    });

    it('should call from with notes table', async () => {
      await service.list(1, 10, '');
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('notes');
    });

    it('should apply search filter when provided', async () => {
      const mockQuery = {
        ilike: vi.fn().mockResolvedValue({ data: [mockNote], error: null, count: 1 }),
      };
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            range: vi.fn().mockReturnValue(mockQuery),
          }),
        }),
      });

      await service.list(1, 10, 'test');
      expect(mockQuery.ilike).toHaveBeenCalledWith('title', '%test%');
    });

    it('should calculate correct range for pagination', async () => {
      const rangeMock = vi.fn().mockResolvedValue({ data: [], error: null, count: 0 });
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            range: rangeMock,
          }),
        }),
      });

      await service.list(2, 10, '');
      expect(rangeMock).toHaveBeenCalledWith(10, 19);
    });

    it('should throw error when query fails', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            range: vi.fn().mockResolvedValue({ data: null, error: new Error('Query failed'), count: 0 }),
          }),
        }),
      });

      await expect(service.list(1, 10, '')).rejects.toThrow('Query failed');
    });
  });

  describe('get', () => {
    it('should return a single note by id', async () => {
      const result = await service.get('note-1');
      expect(result).toEqual(mockNote);
    });

    it('should call eq with correct id', async () => {
      const eqMock = vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: mockNote, error: null }),
      });
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: eqMock,
        }),
      });

      await service.get('note-123');
      expect(eqMock).toHaveBeenCalledWith('id', 'note-123');
    });

    it('should throw error when note not found', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: new Error('Not found') }),
          }),
        }),
      });

      await expect(service.get('invalid-id')).rejects.toThrow('Not found');
    });
  });

  describe('create', () => {
    it('should create a note with user_id', async () => {
      const insertMock = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockNote, error: null }),
        }),
      });
      mockSupabaseClient.from.mockReturnValue({ insert: insertMock });

      await service.create({ title: 'New Note', content: 'Content' });

      expect(insertMock).toHaveBeenCalledWith({
        user_id: 'user-123',
        title: 'New Note',
        content: 'Content',
      });
    });

    it('should throw error when not authenticated', async () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          NotesService,
          { provide: SupabaseService, useValue: { client: mockSupabaseClient } },
          { provide: AuthService, useValue: { currentUser: signal(null) } },
        ],
      });
      const unauthService = TestBed.inject(NotesService);

      await expect(unauthService.create({ title: 'Test' })).rejects.toThrow('Not authenticated');
    });

    it('should set content to null when not provided', async () => {
      const insertMock = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockNote, error: null }),
        }),
      });
      mockSupabaseClient.from.mockReturnValue({ insert: insertMock });

      await service.create({ title: 'Title Only' });

      expect(insertMock).toHaveBeenCalledWith({
        user_id: 'user-123',
        title: 'Title Only',
        content: null,
      });
    });
  });

  describe('update', () => {
    it('should update a note', async () => {
      const updateMock = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockNote, error: null }),
          }),
        }),
      });
      mockSupabaseClient.from.mockReturnValue({ update: updateMock });

      await service.update('note-1', { title: 'Updated Title' });

      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Updated Title', updated_at: expect.any(String) })
      );
    });

    it('should throw error when update fails', async () => {
      mockSupabaseClient.from.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: null, error: new Error('Update failed') }),
            }),
          }),
        }),
      });

      await expect(service.update('note-1', { title: 'Test' })).rejects.toThrow('Update failed');
    });
  });

  describe('delete', () => {
    it('should delete a note by id', async () => {
      const eqMock = vi.fn().mockResolvedValue({ error: null });
      const deleteMock = vi.fn().mockReturnValue({ eq: eqMock });
      mockSupabaseClient.from.mockReturnValue({ delete: deleteMock });

      await service.delete('note-1');

      expect(deleteMock).toHaveBeenCalled();
      expect(eqMock).toHaveBeenCalledWith('id', 'note-1');
    });

    it('should throw error when delete fails', async () => {
      mockSupabaseClient.from.mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: new Error('Delete failed') }),
        }),
      });

      await expect(service.delete('note-1')).rejects.toThrow('Delete failed');
    });
  });
});
