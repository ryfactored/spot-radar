import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { AuthService } from './auth';
import { SupabaseService } from '../supabase/supabase';

describe('AuthService', () => {
  let service: AuthService;
  let routerMock: { navigate: ReturnType<typeof vi.fn> };
  let authStateCallback: (event: string, session: any) => void;
  let supabaseMock: {
    client: {
      auth: {
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
          onAuthStateChange: vi.fn().mockImplementation((cb: any) => {
            authStateCallback = cb;
            return { data: { subscription: { unsubscribe: vi.fn() } } };
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

  describe('onAuthStateChange (initial session)', () => {
    it('should set currentUser from INITIAL_SESSION', () => {
      const mockUser = { id: '456', email: 'user@test.com' };
      authStateCallback('INITIAL_SESSION', { user: mockUser });

      expect(service.currentUser()).toEqual(mockUser);
      expect(service.loading()).toBe(false);
    });

    it('should set loading to false when no session', () => {
      authStateCallback('INITIAL_SESSION', null);

      expect(service.currentUser()).toBeNull();
      expect(service.loading()).toBe(false);
    });

    it('should navigate to /login on SIGNED_OUT', () => {
      authStateCallback('SIGNED_OUT', null);

      expect(service.currentUser()).toBeNull();
      expect(routerMock.navigate).toHaveBeenCalledWith(['/login']);
    });
  });

  describe('signOut', () => {
    it('should call supabase signOut', async () => {
      await service.signOut();

      expect(supabaseMock.client.auth.signOut).toHaveBeenCalled();
    });

    it('should not throw when supabase signOut fails', async () => {
      supabaseMock.client.auth.signOut.mockRejectedValue(new Error('Session not found'));

      await expect(service.signOut()).resolves.not.toThrow();
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
});
