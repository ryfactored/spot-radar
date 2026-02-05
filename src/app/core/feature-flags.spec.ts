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

  it('should toggle a flag via setEnabled', () => {
    service.setEnabled('notes', false);
    expect(service.isEnabled('notes')).toBe(false);

    service.setEnabled('notes', true);
    expect(service.isEnabled('notes')).toBe(true);
  });

  it('should return all flags from allFlags', () => {
    const flags = service.allFlags();
    expect(flags.length).toBeGreaterThan(0);
    expect(flags.find((f) => f.name === 'notes')).toEqual({ name: 'notes', enabled: true });
    expect(flags.find((f) => f.name === 'chat')).toEqual({ name: 'chat', enabled: true });
  });

  it('should reflect setEnabled changes in allFlags', () => {
    service.setEnabled('chat', false);
    const chatFlag = service.allFlags().find((f) => f.name === 'chat');
    expect(chatFlag?.enabled).toBe(false);
  });
});
