import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth';
import { SupabaseService } from './supabase';
import { ToastService } from '@shared';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, map, take, from, switchMap } from 'rxjs';

export type UserRole = 'user' | 'admin';

/**
 * Factory function that creates a role-based route guard.
 *
 * Usage in routes:
 *   canActivate: [roleGuard('admin')]
 *   canActivate: [roleGuard('admin', 'moderator')]
 *
 * The guard:
 * 1. Waits for auth to load
 * 2. Checks if user is authenticated (redirects to /login if not)
 * 3. Fetches user's role from profile
 * 4. Allows access if role matches, otherwise redirects to /dashboard
 */
export const roleGuard = (...allowedRoles: UserRole[]) => {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    const supabase = inject(SupabaseService);
    const toast = inject(ToastService);

    return toObservable(auth.loading).pipe(
      filter((loading) => !loading),
      take(1),
      switchMap(() => {
        const user = auth.currentUser();

        // Not authenticated - redirect to login
        if (!user) {
          return [router.parseUrl('/login')];
        }

        // Fetch role from profile
        return from(
          supabase.client.from('profiles').select('role').eq('id', user.id).single(),
        ).pipe(
          map(({ data, error }) => {
            if (error || !data) {
              toast.error('Unable to verify permissions');
              return router.parseUrl('/dashboard');
            }

            const userRole = data.role as UserRole;

            if (allowedRoles.includes(userRole)) {
              return true;
            }

            toast.error('You do not have permission to access this page');
            return router.parseUrl('/dashboard');
          }),
        );
      }),
    );
  };
};
