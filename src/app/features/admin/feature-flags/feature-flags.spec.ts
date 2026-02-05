import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FeatureFlagsPage } from './feature-flags';
import { FeatureFlags } from '@core';

describe('FeatureFlagsPage', () => {
  let component: FeatureFlagsPage;
  let fixture: ComponentFixture<FeatureFlagsPage>;
  let featureFlags: FeatureFlags;

  async function setupTest() {
    await TestBed.configureTestingModule({
      imports: [FeatureFlagsPage],
    }).compileComponents();

    featureFlags = TestBed.inject(FeatureFlags);
    fixture = TestBed.createComponent(FeatureFlagsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('should create', async () => {
    await setupTest();
    expect(component).toBeTruthy();
  });

  it('should display heading', async () => {
    await setupTest();
    const heading = fixture.nativeElement.querySelector('h1');
    expect(heading.textContent).toContain('Feature Flags');
  });

  it('should show session-only subtitle', async () => {
    await setupTest();
    expect(fixture.nativeElement.textContent).toContain('session-only');
  });

  it('should render a toggle for each flag', async () => {
    await setupTest();
    const toggles = fixture.nativeElement.querySelectorAll('mat-slide-toggle');
    expect(toggles.length).toBe(featureFlags.allFlags().length);
  });

  it('should display flag names', async () => {
    await setupTest();
    const flagNames = fixture.nativeElement.querySelectorAll('.flag-name');
    const names = Array.from(flagNames).map((el: any) => el.textContent.trim());
    expect(names).toContain('notes');
    expect(names).toContain('chat');
  });

  it('should call setEnabled when toggle is changed', async () => {
    await setupTest();
    const spy = vi.spyOn(featureFlags, 'setEnabled');
    const toggle = fixture.nativeElement.querySelector('mat-slide-toggle button');
    toggle.click();
    fixture.detectChanges();
    expect(spy).toHaveBeenCalled();
  });
});
