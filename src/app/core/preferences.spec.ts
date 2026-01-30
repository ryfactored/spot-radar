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

  it('should have default theme as dark', () => {
    expect(service.theme()).toBe('dark');
  });

  it('should toggle theme', () => {
    service.toggleTheme();
    expect(service.theme()).toBe('light');
    service.toggleTheme();
    expect(service.theme()).toBe('dark');
  });
});
