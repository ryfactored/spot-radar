import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { signal, WritableSignal } from '@angular/core';
import { firstValueFrom, timeout } from 'rxjs';

import { guestGuard } from './guest-guard';
import { AuthService } from './auth';

describe('guestGuard', () => {
  let loadingSignal: WritableSignal<boolean>;
  let userSignal: WritableSignal<any>;
  let routerMock: { parseUrl: ReturnType<typeof vi.fn> };

  function setupGuard(isAuthenticated: boolean, isLoading = false) {
    loadingSignal = signal(isLoading);
    userSignal = signal(isAuthenticated ? { id: '123', email: 'test@test.com' } : null);

    const authMock = {
      currentUser: userSignal,
      loading: loadingSignal,
    };

    routerMock = {
      parseUrl: vi.fn().mockReturnValue({} as UrlTree),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authMock },
        { provide: Router, useValue: routerMock },
      ],
    });

    return { authMock, routerMock, loadingSignal, userSignal };
  }

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  describe('when not loading', () => {
    it('should allow access when not authenticated (guest)', async () => {
      setupGuard(false, false);
      const result$ = TestBed.runInInjectionContext(() => guestGuard());

      const result = await firstValueFrom(result$ as any);
      expect(result).toBe(true);
    });

    it('should redirect to /dashboard when authenticated', async () => {
      setupGuard(true, false);
      const result$ = TestBed.runInInjectionContext(() => guestGuard());

      const result = await firstValueFrom(result$ as any);
      expect(routerMock.parseUrl).toHaveBeenCalledWith('/dashboard');
    });

    it('should return UrlTree when redirecting', async () => {
      const mockUrlTree = { toString: () => '/dashboard' } as UrlTree;
      setupGuard(true, false);
      routerMock.parseUrl.mockReturnValue(mockUrlTree);

      const result$ = TestBed.runInInjectionContext(() => guestGuard());
      const result = await firstValueFrom(result$ as any);

      expect(result).toBe(mockUrlTree);
    });
  });

  describe('when loading', () => {
    it('should wait until loading completes before checking auth', async () => {
      const { loadingSignal } = setupGuard(false, true);
      const result$ = TestBed.runInInjectionContext(() => guestGuard());

      // Simulate loading complete
      setTimeout(() => loadingSignal.set(false), 10);

      const result = await firstValueFrom((result$ as any).pipe(timeout(1000)));
      expect(result).toBe(true);
    });

    it('should redirect after loading completes if authenticated', async () => {
      const { loadingSignal } = setupGuard(true, true);
      const result$ = TestBed.runInInjectionContext(() => guestGuard());

      // Simulate loading complete
      setTimeout(() => loadingSignal.set(false), 10);

      await firstValueFrom((result$ as any).pipe(timeout(1000)));
      expect(routerMock.parseUrl).toHaveBeenCalledWith('/dashboard');
    });
  });

  describe('edge cases', () => {
    it('should only emit once (take 1)', async () => {
      const { loadingSignal } = setupGuard(false, false);
      const result$ = TestBed.runInInjectionContext(() => guestGuard());

      let emitCount = 0;
      const subscription = (result$ as any).subscribe(() => emitCount++);

      // Change loading state multiple times
      loadingSignal.set(true);
      loadingSignal.set(false);

      await new Promise(resolve => setTimeout(resolve, 50));
      subscription.unsubscribe();

      expect(emitCount).toBe(1);
    });
  });
});
