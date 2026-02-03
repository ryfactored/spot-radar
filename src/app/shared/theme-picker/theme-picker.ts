import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { PreferencesService, COLOR_THEMES, ColorTheme } from '@core';

@Component({
  selector: 'app-theme-picker',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatMenuModule, MatTooltipModule, MatDividerModule],
  template: `
    <button
      mat-icon-button
      [matMenuTriggerFor]="themeMenu"
      matTooltip="Change theme"
      aria-label="Change theme"
    >
      <mat-icon>palette</mat-icon>
    </button>

    <mat-menu #themeMenu="matMenu">
      <div class="menu-header">Color Theme</div>
      @for (theme of themes; track theme.value) {
        <button
          mat-menu-item
          (click)="selectTheme(theme.value)"
          [class.selected]="preferences.colorTheme() === theme.value"
          role="menuitemradio"
          [attr.aria-checked]="preferences.colorTheme() === theme.value"
        >
          <span class="theme-dots" aria-hidden="true">
            <span class="color-dot" [style.background]="theme.colors.primary"></span>
            <span class="color-dot" [style.background]="theme.colors.accent"></span>
          </span>
          <span>{{ theme.label }}</span>
          <mat-icon
            class="check-icon"
            [style.visibility]="preferences.colorTheme() === theme.value ? 'visible' : 'hidden'"
            aria-hidden="true"
            >check</mat-icon
          >
        </button>
      }
      <mat-divider></mat-divider>
      <button
        mat-menu-item
        (click)="toggleDarkMode()"
        role="menuitemcheckbox"
        [attr.aria-checked]="preferences.darkMode()"
      >
        <mat-icon aria-hidden="true">{{
          preferences.darkMode() ? 'light_mode' : 'dark_mode'
        }}</mat-icon>
        <span>{{ preferences.darkMode() ? 'Light Mode' : 'Dark Mode' }}</span>
      </button>
    </mat-menu>
  `,
  styles: `
    .menu-header {
      padding: 8px 16px;
      font-size: 11px;
      font-weight: 600;
      color: var(--mat-sys-on-surface-variant);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .theme-dots {
      display: inline-flex;
      align-items: center;
      width: 24px;
      margin-right: 16px;
    }

    .color-dot {
      width: 14px;
      height: 14px;
      border-radius: 50%;
      border: 1.5px solid var(--mat-sys-outline-variant);
      flex-shrink: 0;
    }

    .color-dot + .color-dot {
      margin-left: -4px;
    }

    .check-icon {
      margin-left: auto;
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .selected {
      background: color-mix(in srgb, var(--mat-sys-on-surface) 8%, transparent);
    }
  `,
})
export class ThemePicker {
  preferences = inject(PreferencesService);

  themes = COLOR_THEMES;

  selectTheme(theme: ColorTheme) {
    this.preferences.setColorTheme(theme);
  }

  toggleDarkMode() {
    this.preferences.toggleDarkMode();
  }
}
