import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';

import { PreferencesService } from './preferences';
import { AuthService } from './auth/auth';
import { environment } from '@env';

describe('PreferencesService', () => {
  let service: PreferencesService;
  let authMock: { currentUser: ReturnType<typeof signal> };

  const storageKey = (userId: string) => `${environment.appName}:preferences:${userId}`;

  beforeEach(() => {
    authMock = {
      currentUser: signal(null as any),
    };

    TestBed.configureTestingModule({
      providers: [{ provide: AuthService, useValue: authMock }],
    });

    service = TestBed.inject(PreferencesService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have default dark mode as true', () => {
    expect(service.darkMode()).toBe(true);
  });

  it('should no-op toggleDarkMode (dark-only app)', () => {
    expect(service.darkMode()).toBe(true);
    service.toggleDarkMode();
    expect(service.darkMode()).toBe(true);
  });

  it('should always expose darkModeToggleDisabled as true', () => {
    expect(service.darkModeToggleDisabled()).toBe(true);
  });

  it('should set color theme', () => {
    service.setColorTheme('default');
    expect(service.colorTheme()).toBe('default');
  });

  it('should toggle sidenav', () => {
    const initial = service.sidenavOpened();
    service.toggleSidenav();
    expect(service.sidenavOpened()).toBe(!initial);
    service.toggleSidenav();
    expect(service.sidenavOpened()).toBe(initial);
  });

  it('should load stored preferences when user is set (forcing dark mode on)', () => {
    const prefs = { colorTheme: 'default', darkMode: false, sidenavOpened: false };
    localStorage.setItem(storageKey('user-1'), JSON.stringify(prefs));

    authMock.currentUser.set({ id: 'user-1' } as any);
    TestBed.flushEffects();

    expect(service.colorTheme()).toBe('default');
    // Dark-only app: stored darkMode:false is ignored
    expect(service.darkMode()).toBe(true);
    expect(service.sidenavOpened()).toBe(false);
  });

  it('should return defaults for invalid JSON in storage', () => {
    localStorage.setItem(storageKey('user-2'), '{invalid json');

    authMock.currentUser.set({ id: 'user-2' } as any);
    TestBed.flushEffects();

    expect(service.colorTheme()).toBe(environment.defaults.colorTheme);
    expect(service.darkMode()).toBe(environment.defaults.darkMode);
  });

  it('should return defaults when no stored data exists', () => {
    authMock.currentUser.set({ id: 'user-3' } as any);
    TestBed.flushEffects();

    expect(service.colorTheme()).toBe(environment.defaults.colorTheme);
    expect(service.darkMode()).toBe(environment.defaults.darkMode);
    expect(service.sidenavOpened()).toBe(environment.defaults.sidenavOpened);
  });

  it('should auto-save preferences to localStorage', () => {
    authMock.currentUser.set({ id: 'user-4' } as any);
    TestBed.flushEffects();

    service.setColorTheme('default');
    TestBed.flushEffects();

    const stored = JSON.parse(localStorage.getItem(storageKey('user-4'))!);
    expect(stored.colorTheme).toBe('default');
  });

  it('should keep dark mode on when setColorTheme is called', () => {
    service.setColorTheme('default');
    expect(service.darkMode()).toBe(true);
  });
});
