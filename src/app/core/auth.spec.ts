import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { AuthService } from './auth';
import { SupabaseService } from './supabase';

describe('AuthService', () => {
  let service: AuthService;
  let routerMock: { navigate: ReturnType<typeof vi.fn> };
  let supabaseMock: {
    client: {
      auth: {
        getSession: ReturnType<typeof vi.fn>;
        onAuthStateChange: ReturnType<typeof vi.fn>;
        signOut: ReturnType<typeof vi.fn>;
        signUp: ReturnType<typeof vi.fn>;
        signInWithPassword: ReturnType<typeof vi.fn>;
        signInWithOAuth: ReturnType<typeof vi.fn>;
        resetPasswordForEmail: ReturnType<typeof vi.fn>;
        updateUser: ReturnType<typeof vi.fn>;
      };
    };
  };

  beforeEach(() => {
    routerMock = {
      navigate: vi.fn(),
    };

    supabaseMock = {
      client: {
        auth: {
          getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
          onAuthStateChange: vi.fn().mockReturnValue({
            data: { subscription: { unsubscribe: vi.fn() } },
          }),
          signOut: vi.fn().mockResolvedValue({ error: null }),
          signUp: vi.fn(),
          signInWithPassword: vi.fn(),
          signInWithOAuth: vi.fn().mockResolvedValue({ error: null }),
          resetPasswordForEmail: vi.fn().mockResolvedValue({ error: null }),
          updateUser: vi.fn().mockResolvedValue({ data: {}, error: null }),
        },
      },
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: SupabaseService, useValue: supabaseMock },
        { provide: Router, useValue: routerMock },
      ],
    });
    service = TestBed.inject(AuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('signOut', () => {
    it('should call supabase signOut', async () => {
      await service.signOut();

      expect(supabaseMock.client.auth.signOut).toHaveBeenCalled();
    });

    it('should clear currentUser signal', async () => {
      // Set a user first
      service.currentUser.set({ id: '123', email: 'test@test.com' } as any);
      expect(service.currentUser()).not.toBeNull();

      await service.signOut();

      expect(service.currentUser()).toBeNull();
    });

    it('should navigate to /login', async () => {
      await service.signOut();

      expect(routerMock.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('should still clear user and navigate when supabase signOut fails', async () => {
      // Simulate server error (e.g., session already invalidated)
      supabaseMock.client.auth.signOut.mockRejectedValue(new Error('Session not found'));
      service.currentUser.set({ id: '123', email: 'test@test.com' } as any);

      await service.signOut();

      // Should still clear local state and navigate
      expect(service.currentUser()).toBeNull();
      expect(routerMock.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('should still clear user and navigate when supabase returns error object', async () => {
      // Supabase sometimes returns { error } instead of throwing
      supabaseMock.client.auth.signOut.mockResolvedValue({
        error: { message: 'session_not_found' },
      });
      service.currentUser.set({ id: '123', email: 'test@test.com' } as any);

      await service.signOut();

      expect(service.currentUser()).toBeNull();
      expect(routerMock.navigate).toHaveBeenCalledWith(['/login']);
    });
  });

  describe('signInWithProvider', () => {
    it('should redirect to /dashboard after OAuth', async () => {
      await service.signInWithProvider('google');

      expect(supabaseMock.client.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: { redirectTo: expect.stringContaining('/dashboard') },
      });
    });
  });

  describe('resetPassword', () => {
    it('should call supabase resetPasswordForEmail', async () => {
      await service.resetPassword('test@test.com');

      expect(supabaseMock.client.auth.resetPasswordForEmail).toHaveBeenCalledWith('test@test.com', {
        redirectTo: expect.stringContaining('/reset-password'),
      });
    });

    it('should throw mapped error on failure', async () => {
      supabaseMock.client.auth.resetPasswordForEmail.mockResolvedValue({
        error: { code: 'over_request_rate_limit', message: 'rate limited' },
      });

      await expect(service.resetPassword('test@test.com')).rejects.toThrow(
        'Too many attempts. Please wait and try again.',
      );
    });
  });

  describe('updatePassword', () => {
    it('should call supabase updateUser', async () => {
      await service.updatePassword('newpassword123');

      expect(supabaseMock.client.auth.updateUser).toHaveBeenCalledWith({
        password: 'newpassword123',
      });
    });

    it('should throw mapped error on failure', async () => {
      supabaseMock.client.auth.updateUser.mockResolvedValue({
        error: { code: 'same_password', message: 'same password' },
      });

      await expect(service.updatePassword('oldpassword')).rejects.toThrow(
        'New password must be different from your current password',
      );
    });
  });

  describe('loadUser', () => {
    it('should set currentUser from session', async () => {
      const mockUser = { id: '456', email: 'user@test.com' };
      supabaseMock.client.auth.getSession.mockResolvedValue({
        data: { session: { user: mockUser } },
      });

      // Create new instance to trigger loadUser
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          { provide: SupabaseService, useValue: supabaseMock },
          { provide: Router, useValue: routerMock },
        ],
      });
      const newService = TestBed.inject(AuthService);

      // Wait for async loadUser to complete
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(newService.currentUser()).toEqual(mockUser);
      expect(newService.loading()).toBe(false);
    });

    it('should set loading to false when no session', async () => {
      supabaseMock.client.auth.getSession.mockResolvedValue({
        data: { session: null },
      });

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          { provide: SupabaseService, useValue: supabaseMock },
          { provide: Router, useValue: routerMock },
        ],
      });
      const newService = TestBed.inject(AuthService);

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(newService.currentUser()).toBeNull();
      expect(newService.loading()).toBe(false);
    });
  });
});
