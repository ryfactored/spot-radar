import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';

import { Dashboard } from './dashboard';
import { AuthService, FeatureFlags } from '@core';
import { ProfileStore } from '@features/profile/profile-store';
import { ReleasesStore } from '@features/releases/releases-store';
import { ReleasesService } from '@features/releases/releases-service';

describe('Dashboard', () => {
  let component: Dashboard;
  let fixture: ComponentFixture<Dashboard>;

  const releasesStoreMock = {
    followedArtistIds: signal([] as string[]),
    allReleases: signal([] as any[]),
    totalCount: signal(0),
    dismissedIds: signal(new Set<string>()),
    setArtistIds: vi.fn(),
    setReleases: vi.fn(),
  };
  const releasesServiceMock = {
    getUserArtistIds: vi.fn().mockResolvedValue([]),
    getPreferences: vi.fn().mockResolvedValue({
      release_type_filter: 'everything',
      min_track_count: 0,
      recency_days: 90,
      hide_live: false,
    }),
    getFeed: vi.fn().mockResolvedValue({ data: [], count: 0 }),
  };

  async function setupTest(
    user: { id: string; email: string } | null = {
      id: '123',
      email: 'test@example.com',
    },
    featureOverrides: Record<string, boolean> = {},
    displayName: string | null = null,
  ) {
    const authMock = { currentUser: signal(user) };
    const featureFlagsMock = {
      isEnabled: (feature: string) => featureOverrides[feature] ?? true,
    };
    const profileStoreMock = {
      displayName: signal(displayName),
    };

    await TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authMock },
        { provide: FeatureFlags, useValue: featureFlagsMock },
        { provide: ProfileStore, useValue: profileStoreMock },
        { provide: ReleasesStore, useValue: releasesStoreMock },
        { provide: ReleasesService, useValue: releasesServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Dashboard);
    component = fixture.componentInstance;
    await fixture.whenStable();
    fixture.detectChanges();
  }

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('should create', async () => {
    await setupTest();
    expect(component).toBeTruthy();
  });

  it('should display welcome message with display name', async () => {
    await setupTest({ id: '1', email: 'jane@example.com' }, {}, 'Jane');
    expect(fixture.nativeElement.textContent).toContain('Welcome, Jane');
  });

  it('should fall back to email when no display name', async () => {
    await setupTest({ id: '1', email: 'jane@example.com' }, {}, null);
    expect(fixture.nativeElement.textContent).toContain('Welcome, jane@example.com');
  });

  it('should show Artists Tracked stat', async () => {
    await setupTest();
    expect(fixture.nativeElement.textContent).toContain('Artists Tracked');
  });

  it('should show Releases Found stat', async () => {
    await setupTest();
    expect(fixture.nativeElement.textContent).toContain('Releases Found');
  });

  it('should link to releases feed', async () => {
    await setupTest();
    const links = fixture.nativeElement.querySelectorAll('a[href="/releases"]');
    expect(links.length).toBeGreaterThan(0);
  });
});
