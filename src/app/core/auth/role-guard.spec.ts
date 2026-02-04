import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { signal, WritableSignal } from '@angular/core';
import { firstValueFrom, timeout } from 'rxjs';

import { roleGuard } from './role-guard';
import { AuthService } from './auth';
import { SupabaseService } from '../supabase/supabase';
import { ToastService } from '@shared';

describe('roleGuard', () => {
  let loadingSignal: WritableSignal<boolean>;
  let userSignal: WritableSignal<any>;
  let routerMock: { parseUrl: ReturnType<typeof vi.fn> };
  let toastMock: { error: ReturnType<typeof vi.fn> };
  let supabaseMock: { client: { from: ReturnType<typeof vi.fn> } };

  function setupGuard(options: {
    isAuthenticated?: boolean;
    isLoading?: boolean;
    userRole?: string | null;
    profileError?: boolean;
  }) {
    const {
      isAuthenticated = true,
      isLoading = false,
      userRole = 'user',
      profileError = false,
    } = options;

    loadingSignal = signal(isLoading);
    userSignal = signal(isAuthenticated ? { id: '123', email: 'test@test.com' } : null);

    const authMock = {
      currentUser: userSignal,
      loading: loadingSignal,
    };

    routerMock = {
      parseUrl: vi.fn().mockImplementation((url: string) => ({ toString: () => url }) as UrlTree),
    };

    toastMock = {
      error: vi.fn(),
    };

    const selectMock = {
      eq: vi.fn().mockReturnValue({
        single: vi
          .fn()
          .mockResolvedValue(
            profileError
              ? { data: null, error: { message: 'Error' } }
              : { data: userRole ? { role: userRole } : null, error: null },
          ),
      }),
    };

    supabaseMock = {
      client: {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue(selectMock),
        }),
      },
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authMock },
        { provide: Router, useValue: routerMock },
        { provide: SupabaseService, useValue: supabaseMock },
        { provide: ToastService, useValue: toastMock },
      ],
    });
  }

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  describe('when user has required role', () => {
    it('should allow access for admin when admin role required', async () => {
      setupGuard({ userRole: 'admin' });
      const guard = roleGuard('admin');
      const result$ = TestBed.runInInjectionContext(() => guard());

      const result = await firstValueFrom((result$ as any).pipe(timeout(1000)));
      expect(result).toBe(true);
    });

    it('should allow access when user has one of multiple allowed roles', async () => {
      setupGuard({ userRole: 'admin' });
      const guard = roleGuard('user', 'admin');
      const result$ = TestBed.runInInjectionContext(() => guard());

      const result = await firstValueFrom((result$ as any).pipe(timeout(1000)));
      expect(result).toBe(true);
    });
  });

  describe('when user lacks required role', () => {
    it('should redirect to dashboard when user role does not match', async () => {
      setupGuard({ userRole: 'user' });
      const guard = roleGuard('admin');
      const result$ = TestBed.runInInjectionContext(() => guard());

      const result = await firstValueFrom((result$ as any).pipe(timeout(1000)));
      expect(routerMock.parseUrl).toHaveBeenCalledWith('/dashboard');
      expect(toastMock.error).toHaveBeenCalledWith(
        'You do not have permission to access this page',
      );
    });
  });

  describe('when user is not authenticated', () => {
    it('should redirect to login', async () => {
      setupGuard({ isAuthenticated: false });
      const guard = roleGuard('admin');
      const result$ = TestBed.runInInjectionContext(() => guard());

      const result = await firstValueFrom((result$ as any).pipe(timeout(1000)));
      expect(routerMock.parseUrl).toHaveBeenCalledWith('/login');
    });
  });

  describe('when profile fetch fails', () => {
    it('should redirect to dashboard with error toast', async () => {
      setupGuard({ profileError: true });
      const guard = roleGuard('admin');
      const result$ = TestBed.runInInjectionContext(() => guard());

      const result = await firstValueFrom((result$ as any).pipe(timeout(1000)));
      expect(routerMock.parseUrl).toHaveBeenCalledWith('/dashboard');
      expect(toastMock.error).toHaveBeenCalledWith('Unable to verify permissions');
    });
  });

  describe('when loading', () => {
    it('should wait until loading completes before checking role', async () => {
      setupGuard({ isLoading: true, userRole: 'admin' });
      const guard = roleGuard('admin');
      const result$ = TestBed.runInInjectionContext(() => guard());

      // Simulate loading complete
      setTimeout(() => loadingSignal.set(false), 10);

      const result = await firstValueFrom((result$ as any).pipe(timeout(1000)));
      expect(result).toBe(true);
    });
  });
});
