import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { featureFlagGuard } from './feature-flag-guard';
import { FeatureFlags } from './feature-flags';

describe('featureFlagGuard', () => {
  let featureFlags: FeatureFlags;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        FeatureFlags,
        {
          provide: Router,
          useValue: { parseUrl: vi.fn((url: string) => ({ toString: () => url })) },
        },
      ],
    });

    featureFlags = TestBed.inject(FeatureFlags);
    router = TestBed.inject(Router);
  });

  it('should allow access when feature is enabled', () => {
    vi.spyOn(featureFlags, 'isEnabled').mockReturnValue(true);

    const guard = TestBed.runInInjectionContext(() => featureFlagGuard('chat')());
    expect(guard).toBe(true);
  });

  it('should redirect to /dashboard when feature is disabled', () => {
    vi.spyOn(featureFlags, 'isEnabled').mockReturnValue(false);

    const guard = TestBed.runInInjectionContext(() => featureFlagGuard('chat')());
    expect(router.parseUrl).toHaveBeenCalledWith('/dashboard');
    expect(guard).toBeTruthy();
    expect(guard).not.toBe(true);
  });

  it('should check the correct feature name', () => {
    const spy = vi.spyOn(featureFlags, 'isEnabled').mockReturnValue(true);

    TestBed.runInInjectionContext(() => featureFlagGuard('notes')());
    expect(spy).toHaveBeenCalledWith('notes');

    TestBed.runInInjectionContext(() => featureFlagGuard('files')());
    expect(spy).toHaveBeenCalledWith('files');
  });
});
