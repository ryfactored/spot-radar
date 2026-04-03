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

  async function setupTest(
    user: { id: string; email: string } | null = {
      id: '123',
      email: 'test@example.com',
    },
    displayName: string | null = null,
  ) {
    const authMock = { currentUser: signal(user) };
    const featureFlagsMock = {
      isEnabled: () => true,
    };
    const profileStoreMock = {
      displayName: signal(displayName),
    };
    const releasesStoreMock = {
      allReleases: signal([]),
      followedArtistIds: signal([]),
      totalCount: signal(0),
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
        source_filter: 'all',
        last_checked_at: null,
      }),
      getFeed: vi.fn().mockResolvedValue({ data: [], count: 0 }),
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

  it('should show welcome with display name when no releases', async () => {
    await setupTest({ id: '1', email: 'jane@example.com' }, 'Jane');
    expect(fixture.nativeElement.textContent).toContain('Welcome, Jane');
  });

  it('should show welcome with email when no display name', async () => {
    await setupTest({ id: '1', email: 'jane@example.com' }, null);
    expect(fixture.nativeElement.textContent).toContain('Welcome, jane@example.com');
  });

  it('should display Followed Artists section', async () => {
    await setupTest();
    expect(fixture.nativeElement.textContent).toContain('Followed Artists');
  });

  it('should display Library Sync section', async () => {
    await setupTest();
    expect(fixture.nativeElement.textContent).toContain('Library Sync');
  });
});
