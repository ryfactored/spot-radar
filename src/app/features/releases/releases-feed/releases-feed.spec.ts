import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReleasesFeed } from './releases-feed';
import { ReleasesService } from '../releases-service';
import { ReleasesStore } from '../releases-store';
import { AuthService } from '@core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('ReleasesFeed', () => {
  let fixture: ComponentFixture<ReleasesFeed>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReleasesFeed, NoopAnimationsModule],
      providers: [
        {
          provide: ReleasesService,
          useValue: {
            getFeed: vi.fn().mockResolvedValue({ data: [], count: 0 }),
            getPreferences: vi.fn().mockResolvedValue({
              release_type_filter: 'everything',
              min_track_count: 0,
              recency_days: 90,
              last_checked_at: null,
            }),
            getDismissedIds: vi.fn().mockResolvedValue(new Set()),
            getUserArtistIds: vi.fn().mockResolvedValue([]),
            subscribeToNewReleases: vi.fn().mockReturnValue(() => {}),
            savePreferences: vi.fn().mockResolvedValue(undefined),
            markAllSeen: vi.fn().mockResolvedValue(undefined),
            dismissRelease: vi.fn().mockResolvedValue(undefined),
            undismissRelease: vi.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: AuthService,
          useValue: { currentUser: vi.fn(() => ({ id: 'user-1' })) },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ReleasesFeed);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
