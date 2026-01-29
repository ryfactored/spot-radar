import { Component, inject, effect, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { PreferencesService, ColorTheme } from './core/preferences';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <router-outlet />
    @if (!isProd && isBrowser) {
      <div class="dev-badge"><span class="material-icons">code</span></div>
    }
  `,
  styles: `
    .dev-badge {
      position: fixed;
      bottom: 8px;
      left: 8px;
      background: #03a9f4;
      color: white;
      padding: 6px;
      border-radius: 4px;
      z-index: 99999;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .dev-badge .material-icons {
      font-size: 18px;
    }
  `,
})
export class App {
  private preferences = inject(PreferencesService);
  private platformId = inject(PLATFORM_ID);

  isProd = environment.production;
  isBrowser = false;
  private colorThemeClasses: ColorTheme[] = ['default', 'ocean', 'forest'];

  constructor() {
    // Skip theme handling on server (no document)
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    // Restore visibility (hidden by inline script to prevent SSR flash)
    document.documentElement.style.visibility = '';

    // Enable dev badge (only in browser to avoid hydration mismatch)
    this.isBrowser = true;

    // Apply color theme class to body
    effect(() => {
      const colorTheme = this.preferences.colorTheme();
      // Remove all theme classes first
      this.colorThemeClasses.forEach((t) => {
        document.body.classList.remove(`theme-${t}`);
      });
      // Add current theme class (except default which has no class)
      if (colorTheme !== 'default') {
        document.body.classList.add(`theme-${colorTheme}`);
      }
    });

    // Apply dark mode class to body
    effect(() => {
      const darkMode = this.preferences.darkMode();
      document.body.classList.toggle('dark-mode', darkMode);
      // Legacy support for existing dark-theme class
      document.body.classList.toggle('dark-theme', darkMode);
    });
  }
}
