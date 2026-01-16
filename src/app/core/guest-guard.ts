import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth';

export const guestGuard = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.currentUser()) {
    return true;
  }
  return router.parseUrl('/dashboard');
};