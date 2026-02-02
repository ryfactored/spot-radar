import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { FeatureFlags } from './feature-flags';

/**
 * Factory function that creates a route guard checking a feature flag.
 *
 * Usage in routes:
 *   canActivate: [featureFlagGuard('chat')]
 *
 * Redirects to /dashboard when the feature is disabled.
 */
export const featureFlagGuard = (feature: string) => {
  return () => {
    const flags = inject(FeatureFlags);
    const router = inject(Router);

    if (flags.isEnabled(feature)) {
      return true;
    }

    return router.parseUrl('/dashboard');
  };
};
