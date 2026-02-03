import { Injectable } from '@angular/core';
import { environment } from '@env';

/**
 * Lightweight feature flags service.
 *
 * Reads flags from environment config at startup. Each flag is a simple
 * boolean keyed by feature name. No external service dependency.
 *
 * Usage:
 *   featureFlags.isEnabled('chat')  // true or false
 *
 * Configure flags in environment.ts / environment.prod.ts:
 *   featureFlags: { notes: true, chat: true, files: true, admin: true }
 */
@Injectable({ providedIn: 'root' })
export class FeatureFlags {
  private flags = environment.featureFlags;

  /** Returns true if the feature is enabled (defaults to true for unknown flags). */
  isEnabled(feature: string): boolean {
    return this.flags[feature] ?? true;
  }
}
