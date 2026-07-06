import { effect, inject } from '@angular/core';
import { AuthService } from './auth/auth';

/**
 * Clears root-provided store state when the authenticated user changes to null
 * (sign-out or session expiry). Root stores outlive a single session, so
 * without this a second user signing in on the same tab — without a full page
 * reload — would briefly see the previous user's data.
 *
 * Call from a store constructor (injection context required):
 *   constructor() {
 *     resetOnSignOut(() => this.clear());
 *   }
 */
export function resetOnSignOut(clear: () => void): void {
  const auth = inject(AuthService);
  let hadUser = false;
  effect(() => {
    const user = auth.currentUser();
    if (user) {
      hadUser = true;
    } else if (hadUser) {
      // Genuine sign-out transition — not the initial null during startup.
      hadUser = false;
      clear();
    }
  });
}
