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

  it('should have default theme as light', () => {
    expect(service.theme()).toBe('light');
  });

  it('should toggle theme', () => {
    service.toggleTheme();
    expect(service.theme()).toBe('dark');
    service.toggleTheme();
    expect(service.theme()).toBe('light');
  });
});
