import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { signal } from '@angular/core';

import { ThemePicker } from './theme-picker';
import { PreferencesService } from '@core';

describe('ThemePicker', () => {
  let component: ThemePicker;
  let fixture: ComponentFixture<ThemePicker>;
  let preferencesMock: any;

  beforeEach(async () => {
    preferencesMock = {
      colorTheme: signal('default'),
      darkMode: signal(false),
      setColorTheme: vi.fn(),
      toggleDarkMode: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [ThemePicker, NoopAnimationsModule],
      providers: [
        { provide: PreferencesService, useValue: preferencesMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ThemePicker);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have three theme options', () => {
    expect(component.themes.length).toBe(3);
    expect(component.themes.map(t => t.value)).toEqual(['default', 'ocean', 'forest']);
  });

  it('should call setColorTheme when theme selected', () => {
    component.selectTheme('ocean');
    expect(preferencesMock.setColorTheme).toHaveBeenCalledWith('ocean');
  });

  it('should call toggleDarkMode when toggled', () => {
    component.toggleDarkMode();
    expect(preferencesMock.toggleDarkMode).toHaveBeenCalled();
  });
});
