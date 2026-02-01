import { Injectable, inject, signal, effect } from '@angular/core';
import { AuthService } from './auth';
import { environment } from '@env';

export const COLOR_THEMES = [
  { value: 'default', label: 'Default', colors: { primary: '#3b82f6', accent: '#38bdf8' } },
  { value: 'teal', label: 'Teal', colors: { primary: '#14b8a6', accent: '#38bdf8' } },
  { value: 'slate', label: 'Slate', colors: { primary: '#475569', accent: '#38bdf8' } },
] as const;

export type ColorTheme = (typeof COLOR_THEMES)[number]['value'];

export interface UserPreferences {
  colorTheme: ColorTheme;
  darkMode: boolean;
  sidenavOpened: boolean;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  colorTheme: environment.defaults.colorTheme,
  darkMode: environment.defaults.darkMode,
  sidenavOpened: environment.defaults.sidenavOpened,
};

/**
 * User preferences service with automatic localStorage persistence.
 * Preferences are stored per-user using the user's ID as a namespace.
 *
 * Storage key: `{appName}:preferences:{userId}`
 *
 * On auth state change, preferences are reloaded for the new user.
 * Guests use default preferences (not persisted).
 */
@Injectable({
  providedIn: 'root',
})
export class PreferencesService {
  private auth = inject(AuthService);
  private preferences = signal<UserPreferences>(DEFAULT_PREFERENCES);

  // Expose individual preferences as readonly signals
  readonly colorTheme = () => this.preferences().colorTheme;
  readonly darkMode = () => this.preferences().darkMode;
  readonly sidenavOpened = () => this.preferences().sidenavOpened;

  // Legacy support: theme() returns 'light' or 'dark' based on darkMode
  readonly theme = () => (this.preferences().darkMode ? 'dark' : 'light');

  constructor() {
    // Reload preferences when user changes (login/logout)
    effect(() => {
      const user = this.auth.currentUser();
      this.preferences.set(this.loadFromStorage(user?.id));
    });

    // Auto-save to localStorage whenever preferences change (only for authenticated users)
    effect(() => {
      const prefs = this.preferences();
      const key = this.getStorageKey();
      if (key) {
        localStorage.setItem(key, JSON.stringify(prefs));
      }
    });

    // Cache theme to non-user-scoped key for the inline script in index.html
    effect(() => {
      const { darkMode, colorTheme } = this.preferences();
      try {
        localStorage.setItem(
          `${environment.appName}:theme`,
          JSON.stringify({ darkMode, colorTheme }),
        );
      } catch {
        // localStorage may be unavailable (e.g. private browsing quota exceeded)
      }
    });
  }

  private getStorageKey(): string | null {
    const userId = this.auth.currentUser()?.id;
    return userId ? `${environment.appName}:preferences:${userId}` : null;
  }

  private loadFromStorage(userId?: string): UserPreferences {
    if (!userId) return DEFAULT_PREFERENCES;

    try {
      const key = `${environment.appName}:preferences:${userId}`;
      const stored = localStorage.getItem(key);
      if (stored) {
        return { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) };
      }
    } catch {
      // Invalid JSON, use defaults
    }
    return DEFAULT_PREFERENCES;
  }

  setColorTheme(colorTheme: ColorTheme) {
    this.preferences.update((prefs) => ({ ...prefs, colorTheme }));
  }

  setDarkMode(darkMode: boolean) {
    this.preferences.update((prefs) => ({ ...prefs, darkMode }));
  }

  toggleDarkMode() {
    this.preferences.update((prefs) => ({
      ...prefs,
      darkMode: !prefs.darkMode,
    }));
  }

  // Legacy method for compatibility
  toggleTheme() {
    this.toggleDarkMode();
  }

  setSidenavOpened(opened: boolean) {
    this.preferences.update((prefs) => ({ ...prefs, sidenavOpened: opened }));
  }

  toggleSidenav() {
    this.preferences.update((prefs) => ({
      ...prefs,
      sidenavOpened: !prefs.sidenavOpened,
    }));
  }
}
