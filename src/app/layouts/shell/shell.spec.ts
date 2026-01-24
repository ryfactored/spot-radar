import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { signal } from '@angular/core';

import { Shell } from './shell';
import { PreferencesService, AuthService } from '@core';

describe('Shell', () => {
  let component: Shell;
  let fixture: ComponentFixture<Shell>;

  beforeEach(async () => {
    const preferencesMock = {
      theme: signal('light'),
      darkMode: signal(false),
      colorTheme: signal('default'),
      sidenavOpened: signal(true),
      toggleTheme: vi.fn(),
      toggleDarkMode: vi.fn(),
      toggleSidenav: vi.fn(),
      setColorTheme: vi.fn(),
    };

    const authMock = {
      signOut: vi.fn().mockResolvedValue(undefined),
    };

    await TestBed.configureTestingModule({
      imports: [Shell, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        { provide: PreferencesService, useValue: preferencesMock },
        { provide: AuthService, useValue: authMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Shell);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
