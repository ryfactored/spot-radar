import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { PreferencesService, ColorTheme } from '@core';

interface ThemeOption {
  value: ColorTheme;
  label: string;
  colors: { primary: string; accent: string };
}

@Component({
  selector: 'app-theme-picker',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatMenuModule, MatTooltipModule, MatDividerModule],
  template: `
    <button mat-icon-button [matMenuTriggerFor]="themeMenu" matTooltip="Change theme" aria-label="Change theme">
      <mat-icon>palette</mat-icon>
    </button>

    <mat-menu #themeMenu="matMenu">
      <div class="menu-header" id="theme-menu-label">Color Theme</div>
      @for (theme of themes; track theme.value) {
        <button mat-menu-item (click)="selectTheme(theme.value)"
                [class.selected]="preferences.colorTheme() === theme.value"
                [attr.aria-current]="preferences.colorTheme() === theme.value ? 'true' : null"
                role="menuitemradio"
                [attr.aria-checked]="preferences.colorTheme() === theme.value">
          <span class="theme-preview" aria-hidden="true">
            <span class="color-dot" [style.background]="theme.colors.primary"></span>
            <span class="color-dot" [style.background]="theme.colors.accent"></span>
          </span>
          <span>{{ theme.label }}</span>
          @if (preferences.colorTheme() === theme.value) {
            <mat-icon class="check-icon" aria-hidden="true">check</mat-icon>
          }
        </button>
      }
      <mat-divider></mat-divider>
      <button mat-menu-item (click)="toggleDarkMode()" role="menuitemcheckbox" [attr.aria-checked]="preferences.darkMode()">
        <mat-icon aria-hidden="true">{{ preferences.darkMode() ? 'light_mode' : 'dark_mode' }}</mat-icon>
        <span>{{ preferences.darkMode() ? 'Light Mode' : 'Dark Mode' }}</span>
      </button>
    </mat-menu>
  `,
  styles: `
    .menu-header {
      padding: 8px 16px;
      font-size: 12px;
      font-weight: 500;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .theme-preview {
      display: flex;
      gap: 4px;
      margin-right: 12px;
    }

    .color-dot {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      border: 1px solid rgba(0, 0, 0, 0.1);
    }

    .selected {
      background: rgba(0, 0, 0, 0.04);
    }

    .check-icon {
      margin-left: auto;
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    :host-context(.dark-mode) .menu-header {
      color: #aaa;
    }

    :host-context(.dark-mode) .selected {
      background: rgba(255, 255, 255, 0.08);
    }
  `
})
export class ThemePicker {
  preferences = inject(PreferencesService);

  themes: ThemeOption[] = [
    { value: 'default', label: 'Default', colors: { primary: '#3f51b5', accent: '#ff4081' } },
    { value: 'ocean', label: 'Ocean', colors: { primary: '#2196f3', accent: '#009688' } },
    { value: 'forest', label: 'Forest', colors: { primary: '#4caf50', accent: '#ffc107' } },
  ];

  selectTheme(theme: ColorTheme) {
    this.preferences.setColorTheme(theme);
  }

  toggleDarkMode() {
    this.preferences.toggleDarkMode();
  }
}
