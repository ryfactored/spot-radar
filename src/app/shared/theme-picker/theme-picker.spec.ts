import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { signal } from '@angular/core';

import { ThemePicker } from './theme-picker';
import { PreferencesService, COLOR_THEMES } from '@core';

describe('ThemePicker', () => {
  let component: ThemePicker;
  let fixture: ComponentFixture<ThemePicker>;
  let preferencesMock: any;

  beforeEach(async () => {
    preferencesMock = {
      colorTheme: signal('default'),
      darkMode: signal(false),
      darkModeToggleDisabled: signal(true),
      setColorTheme: vi.fn(),
      toggleDarkMode: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [ThemePicker, NoopAnimationsModule],
      providers: [{ provide: PreferencesService, useValue: preferencesMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(ThemePicker);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should use COLOR_THEMES as theme options', () => {
    expect(component.themes).toBe(COLOR_THEMES);
  });

  it('should call setColorTheme when theme selected', () => {
    component.selectTheme('default');
    expect(preferencesMock.setColorTheme).toHaveBeenCalledWith('default');
  });

  it('should call toggleDarkMode when toggled', () => {
    component.toggleDarkMode();
    expect(preferencesMock.toggleDarkMode).toHaveBeenCalled();
  });

  it('should include Midnight Studio as a selectable theme option', () => {
    const labels = component.themes.map((t) => t.label);
    expect(labels).toContain('Midnight Studio');
  });

  it('should disable the dark-mode toggle menu item (dark-only app)', async () => {
    // Open the menu trigger to render menu content into the overlay
    const trigger = fixture.nativeElement.querySelector(
      'button[mat-icon-button]',
    ) as HTMLButtonElement;
    trigger.click();
    fixture.detectChanges();
    await fixture.whenStable();

    const menuItems = document.querySelectorAll<HTMLButtonElement>(
      '.mat-mdc-menu-panel button[mat-menu-item]',
    );
    const darkModeToggle = menuItems[menuItems.length - 1];

    expect(darkModeToggle).toBeTruthy();
    expect(darkModeToggle.disabled).toBe(true);
  });
});
