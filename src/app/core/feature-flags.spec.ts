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

  it('should return true for the admin flag', () => {
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
    expect(flags.find((f) => f.name === 'notes')).toEqual({ name: 'notes', enabled: false });
    expect(flags.find((f) => f.name === 'chat')).toEqual({ name: 'chat', enabled: false });
  });

  it('should reflect setEnabled changes in allFlags', () => {
    service.setEnabled('chat', false);
    const chatFlag = service.allFlags().find((f) => f.name === 'chat');
    expect(chatFlag?.enabled).toBe(false);
  });

  describe('string flags', () => {
    it('should return undefined for unknown string flags', () => {
      expect(service.getString('unknown-string-flag')).toBeUndefined();
    });

    it('should set and get string flag via setString', () => {
      service.setString('testFlag', 'value1');
      expect(service.getString('testFlag')).toBe('value1');

      service.setString('testFlag', 'value2');
      expect(service.getString('testFlag')).toBe('value2');
    });

    it('should reflect setString changes in allStringFlags', () => {
      service.setString('testFlag', 'testValue');
      const flag = service.allStringFlags().find((f) => f.name === 'testFlag');
      expect(flag?.value).toBe('testValue');
    });

    it('should not include boolean flags in allStringFlags', () => {
      const stringFlags = service.allStringFlags();
      expect(stringFlags.find((f) => f.name === 'notes')).toBeUndefined();
    });
  });
});
