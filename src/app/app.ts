import { Component, inject, effect } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PreferencesService } from './core/preferences';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet />`,
})
export class App {
  private preferences = inject(PreferencesService);

  constructor() {
    // Apply theme class to body whenever theme changes
    effect(() => {
      const theme = this.preferences.theme();
      document.body.classList.toggle('dark-theme', theme === 'dark');
    });
  }
}