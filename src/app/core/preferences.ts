import { Injectable, signal, effect } from '@angular/core';

export type ColorTheme = 'default' | 'ocean' | 'forest';

export interface UserPreferences {
  colorTheme: ColorTheme;
  darkMode: boolean;
  sidenavOpened: boolean;
}

const STORAGE_KEY = 'user_preferences';

const DEFAULT_PREFERENCES: UserPreferences = {
  colorTheme: 'default',
  darkMode: false,
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
  readonly colorTheme = () => this.preferences().colorTheme;
  readonly darkMode = () => this.preferences().darkMode;
  readonly sidenavOpened = () => this.preferences().sidenavOpened;

  // Legacy support: theme() returns 'light' or 'dark' based on darkMode
  readonly theme = () => this.preferences().darkMode ? 'dark' : 'light';

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
        const parsed = JSON.parse(stored);
        // Migration: convert old 'theme' to new 'darkMode'
        if ('theme' in parsed && !('darkMode' in parsed)) {
          parsed.darkMode = parsed.theme === 'dark';
          delete parsed.theme;
        }
        return { ...DEFAULT_PREFERENCES, ...parsed };
      }
    } catch {
      // Invalid JSON, use defaults
    }
    return DEFAULT_PREFERENCES;
  }

  setColorTheme(colorTheme: ColorTheme) {
    this.preferences.update(prefs => ({ ...prefs, colorTheme }));
  }

  setDarkMode(darkMode: boolean) {
    this.preferences.update(prefs => ({ ...prefs, darkMode }));
  }

  toggleDarkMode() {
    this.preferences.update(prefs => ({
      ...prefs,
      darkMode: !prefs.darkMode
    }));
  }

  // Legacy method for compatibility
  toggleTheme() {
    this.toggleDarkMode();
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