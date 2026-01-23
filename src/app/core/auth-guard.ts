import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, map, take } from 'rxjs';

/**
 * Functional route guard for authenticated routes.
 *
 * This guard demonstrates the modern Angular pattern for route guards:
 * - Functional style (no class needed)
 * - Uses inject() for dependency injection
 * - Bridges signals and observables with toObservable()
 *
 * Key pattern: Wait for auth loading to complete before checking user.
 * This prevents race conditions where the guard runs before the session
 * is restored from Supabase.
 */
export const authGuard = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // Wait for loading to complete, then check user
  return toObservable(auth.loading).pipe(
    filter(loading => !loading),  // Wait until not loading
    take(1),
    map(() => {
      if (auth.currentUser()) {
        return true;
      }
      return router.parseUrl('/login');
    })
  );
};