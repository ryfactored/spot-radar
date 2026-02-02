import { TestBed } from '@angular/core/testing';
import { FeatureFlags } from './feature-flags';

describe('FeatureFlags', () => {
  let service: FeatureFlags;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FeatureFlags);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return true for enabled flags', () => {
    expect(service.isEnabled('notes')).toBe(true);
    expect(service.isEnabled('chat')).toBe(true);
    expect(service.isEnabled('files')).toBe(true);
    expect(service.isEnabled('admin')).toBe(true);
  });

  it('should default to true for unknown flags', () => {
    expect(service.isEnabled('unknown-feature')).toBe(true);
  });
});
