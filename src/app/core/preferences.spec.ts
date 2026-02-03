import { TestBed } from '@angular/core/testing';

import { PreferencesService } from './preferences';

describe('PreferencesService', () => {
  let service: PreferencesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PreferencesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have default dark mode as true', () => {
    expect(service.darkMode()).toBe(true);
  });

  it('should toggle dark mode', () => {
    service.toggleDarkMode();
    expect(service.darkMode()).toBe(false);
    service.toggleDarkMode();
    expect(service.darkMode()).toBe(true);
  });
});
