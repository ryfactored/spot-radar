import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';

import { ProfileService } from './profile-service';
import { SupabaseService, AuthService } from '@core';

describe('ProfileService', () => {
  let service: ProfileService;
  let authMock: { currentUser: ReturnType<typeof signal> };

  // Supabase chain mocks
  let mockSingle: ReturnType<typeof vi.fn>;
  let mockSelect: ReturnType<typeof vi.fn>;
  let mockEq: ReturnType<typeof vi.fn>;
  let mockInsert: ReturnType<typeof vi.fn>;
  let mockUpdate: ReturnType<typeof vi.fn>;
  let mockDelete: ReturnType<typeof vi.fn>;
  let mockFrom: ReturnType<typeof vi.fn>;
  let mockRpc: ReturnType<typeof vi.fn>;

  const mockProfile = {
    id: 'user-123',
    email: 'test@test.com',
    display_name: 'Test User',
    avatar_url: null,
    bio: null,
    role: 'user' as const,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  beforeEach(() => {
    mockSingle = vi.fn();
    mockSelect = vi.fn();
    mockEq = vi.fn();
    mockInsert = vi.fn();
    mockUpdate = vi.fn();
    mockDelete = vi.fn();
    mockFrom = vi.fn();
    mockRpc = vi.fn();

    authMock = {
      currentUser: signal({
        id: 'user-123',
        email: 'test@test.com',
        user_metadata: { full_name: 'Test User' },
      }),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: SupabaseService, useValue: { client: { from: mockFrom, rpc: mockRpc } } },
        { provide: AuthService, useValue: authMock },
      ],
    });

    service = TestBed.inject(ProfileService);
  });

  describe('getProfile', () => {
    it('should return profile data on success', async () => {
      mockSingle.mockResolvedValue({ data: mockProfile, error: null });
      mockEq.mockReturnValue({ single: mockSingle });
      mockSelect.mockReturnValue({ eq: mockEq });
      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await service.getProfile('user-123');

      expect(result).toEqual(mockProfile);
      expect(mockFrom).toHaveBeenCalledWith('profiles');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockEq).toHaveBeenCalledWith('id', 'user-123');
    });

    it('should auto-create profile when PGRST116 error occurs', async () => {
      // First call (getProfile) returns PGRST116
      mockSingle.mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } });
      mockEq.mockReturnValue({ single: mockSingle });
      mockSelect.mockReturnValue({ eq: mockEq });

      // Second call (createProfile insert) returns new profile
      const insertSingle = vi.fn().mockResolvedValue({ data: mockProfile, error: null });
      const insertSelect = vi.fn().mockReturnValue({ single: insertSingle });
      mockInsert.mockReturnValue({ select: insertSelect });

      mockFrom
        .mockReturnValueOnce({ select: mockSelect }) // getProfile
        .mockReturnValueOnce({ insert: mockInsert }); // createProfile

      const result = await service.getProfile('user-123');

      expect(result).toEqual(mockProfile);
      expect(mockInsert).toHaveBeenCalledWith({
        id: 'user-123',
        email: 'test@test.com',
        display_name: 'Test User',
      });
    });

    it('should use email as display_name when full_name is not available', async () => {
      authMock.currentUser.set({
        id: 'user-123',
        email: 'test@test.com',
        user_metadata: {},
      } as any);

      mockSingle.mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } });
      mockEq.mockReturnValue({ single: mockSingle });
      mockSelect.mockReturnValue({ eq: mockEq });

      const insertSingle = vi.fn().mockResolvedValue({ data: mockProfile, error: null });
      const insertSelect = vi.fn().mockReturnValue({ single: insertSingle });
      mockInsert.mockReturnValue({ select: insertSelect });

      mockFrom
        .mockReturnValueOnce({ select: mockSelect })
        .mockReturnValueOnce({ insert: mockInsert });

      await service.getProfile('user-123');

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({ display_name: 'test@test.com' }),
      );
    });

    it('should throw mapped error for non-PGRST116 errors', async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { code: 'other_error', message: 'fail' },
      });
      mockEq.mockReturnValue({ single: mockSingle });
      mockSelect.mockReturnValue({ eq: mockEq });
      mockFrom.mockReturnValue({ select: mockSelect });

      await expect(service.getProfile('user-123')).rejects.toThrow();
    });
  });

  describe('updateProfile', () => {
    it('should pass updates with updated_at timestamp', async () => {
      const updated = { ...mockProfile, display_name: 'New Name' };
      mockSingle.mockResolvedValue({ data: updated, error: null });
      mockSelect.mockReturnValue({ single: mockSingle });
      mockEq.mockReturnValue({ select: mockSelect });
      mockUpdate.mockReturnValue({ eq: mockEq });
      mockFrom.mockReturnValue({ update: mockUpdate });

      const result = await service.updateProfile('user-123', { display_name: 'New Name' });

      expect(result.display_name).toBe('New Name');
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          display_name: 'New Name',
          updated_at: expect.any(String),
        }),
      );
      expect(mockEq).toHaveBeenCalledWith('id', 'user-123');
    });
  });

  describe('deleteAccount', () => {
    it('should call delete_my_account RPC successfully', async () => {
      mockRpc.mockResolvedValue({ error: null });

      await expect(service.deleteAccount()).resolves.not.toThrow();
      expect(mockRpc).toHaveBeenCalledWith('delete_my_account');
    });

    it('should throw mapped error on failure', async () => {
      mockRpc.mockResolvedValue({ error: { code: 'other_error', message: 'fail' } });

      await expect(service.deleteAccount()).rejects.toThrow();
    });
  });
});
