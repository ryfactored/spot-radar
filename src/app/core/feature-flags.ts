import { computed, Injectable, signal } from '@angular/core';
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
  private flags = signal<Record<string, boolean>>({ ...environment.featureFlags });

  /** All flags as a list of { name, enabled } entries. */
  readonly allFlags = computed(() =>
    Object.entries(this.flags()).map(([name, enabled]) => ({ name, enabled })),
  );

  /** Returns true if the feature is enabled (defaults to true for unknown flags). */
  isEnabled(feature: string): boolean {
    return this.flags()[feature] ?? true;
  }

  /** Toggle a single flag at runtime (session-scoped, resets on reload). */
  setEnabled(feature: string, enabled: boolean): void {
    this.flags.update((current) => ({ ...current, [feature]: enabled }));
  }
}
