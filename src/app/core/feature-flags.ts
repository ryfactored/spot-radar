import { computed, Injectable, signal } from '@angular/core';
import { environment } from '@env';

/**
 * Lightweight feature flags service.
 *
 * Reads flags from environment config at startup. Supports both boolean
 * flags and string-valued enum flags. No external service dependency.
 *
 * Usage:
 *   featureFlags.isEnabled('chat')  // true or false
 *   featureFlags.getString('theme')  // string value or undefined
 *
 * Configure flags in environment.ts / environment.prod.ts:
 *   featureFlags: { notes: true, chat: true, theme: 'dark' }
 */
@Injectable({ providedIn: 'root' })
export class FeatureFlags {
  private flags = signal<Record<string, boolean>>(
    this.extractBooleanFlags(environment.featureFlags),
  );

  private stringFlags = signal<Record<string, string>>(
    this.extractStringFlags(environment.featureFlags),
  );

  /** All boolean flags as a list of { name, enabled } entries. */
  readonly allFlags = computed(() =>
    Object.entries(this.flags()).map(([name, enabled]) => ({ name, enabled })),
  );

  /** All string flags as a list of { name, value } entries. */
  readonly allStringFlags = computed(() =>
    Object.entries(this.stringFlags()).map(([name, value]) => ({ name, value })),
  );

  /** Returns true if the feature is enabled (defaults to true for unknown flags). */
  isEnabled(feature: string): boolean {
    return this.flags()[feature] ?? true;
  }

  /** Toggle a single boolean flag at runtime (session-scoped, resets on reload). */
  setEnabled(feature: string, enabled: boolean): void {
    this.flags.update((current) => ({ ...current, [feature]: enabled }));
  }

  /** Returns the string value for an enum flag, or undefined if not set. */
  getString(feature: string): string | undefined {
    return this.stringFlags()[feature];
  }

  /** Set a string-valued flag at runtime (session-scoped, resets on reload). */
  setString(feature: string, value: string): void {
    this.stringFlags.update((current) => ({ ...current, [feature]: value }));
  }

  private extractBooleanFlags(flags: Record<string, boolean | string>): Record<string, boolean> {
    return Object.fromEntries(
      Object.entries(flags).filter(([, v]) => typeof v === 'boolean'),
    ) as Record<string, boolean>;
  }

  private extractStringFlags(flags: Record<string, boolean | string>): Record<string, string> {
    return Object.fromEntries(
      Object.entries(flags).filter(([, v]) => typeof v === 'string'),
    ) as Record<string, string>;
  }
}
