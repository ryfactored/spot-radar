import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, map, take } from 'rxjs';

/**
 * Factory that creates auth-related route guards.
 *
 * @param requireAuth - When true, requires an authenticated user (redirects to /login).
 *                      When false, requires NO user (redirects to /dashboard).
 */
function createAuthGuard(requireAuth: boolean) {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    return toObservable(auth.loading).pipe(
      filter((loading) => !loading),
      take(1),
      map(() => {
        const hasUser = !!auth.currentUser();
        if (hasUser === requireAuth) return true;
        return router.parseUrl(requireAuth ? '/login' : '/dashboard');
      }),
    );
  };
}

export const authGuard = createAuthGuard(true);
export const guestGuard = createAuthGuard(false);
