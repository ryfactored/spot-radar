import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, map, take } from 'rxjs';

export const guestGuard = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return toObservable(auth.loading).pipe(
    filter((loading) => !loading),
    take(1),
    map(() => {
      if (!auth.currentUser()) {
        return true;
      }
      return router.parseUrl('/dashboard');
    }),
  );
};
