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
});
