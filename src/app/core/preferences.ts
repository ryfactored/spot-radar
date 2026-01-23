import { Injectable, signal, effect } from '@angular/core';

export interface UserPreferences {
  theme: 'light' | 'dark';
  sidenavOpened: boolean;
}

const STORAGE_KEY = 'user_preferences';

const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'light',
  sidenavOpened: true,
};

/**
 * User preferences service with automatic localStorage persistence.
 *
 * Demonstrates the Angular effect() pattern for side effects:
 * - The effect() automatically tracks signal dependencies
 * - Runs whenever the preferences signal changes
 * - Persists state to localStorage without manual subscriptions
 *
 * This pattern is ideal for:
 * - Auto-saving form drafts
 * - Syncing state with external systems
 * - Analytics tracking
 */
@Injectable({
  providedIn: 'root'
})
export class PreferencesService {
  private preferences = signal<UserPreferences>(this.loadFromStorage());

  // Expose individual preferences as readonly signals
  readonly theme = () => this.preferences().theme;
  readonly sidenavOpened = () => this.preferences().sidenavOpened;

  constructor() {
    // Auto-save to localStorage whenever preferences change
    effect(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.preferences()));
    });
  }

  private loadFromStorage(): UserPreferences {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) };
      }
    } catch {
      // Invalid JSON, use defaults
    }
    return DEFAULT_PREFERENCES;
  }

  setTheme(theme: 'light' | 'dark') {
    this.preferences.update(prefs => ({ ...prefs, theme }));
  }

  toggleTheme() {
    this.preferences.update(prefs => ({
      ...prefs,
      theme: prefs.theme === 'light' ? 'dark' : 'light'
    }));
  }

  setSidenavOpened(opened: boolean) {
    this.preferences.update(prefs => ({ ...prefs, sidenavOpened: opened }));
  }

  toggleSidenav() {
    this.preferences.update(prefs => ({
      ...prefs,
      sidenavOpened: !prefs.sidenavOpened
    }));
  }
}