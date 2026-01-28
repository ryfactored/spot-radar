import { Component, inject, effect } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PreferencesService, ColorTheme } from './core/preferences';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet />`,
})
export class App {
  private preferences = inject(PreferencesService);

  private colorThemeClasses: ColorTheme[] = ['default', 'ocean', 'forest'];

  constructor() {
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
