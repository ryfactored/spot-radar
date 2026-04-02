import { TestBed } from '@angular/core/testing';
import { ReleasesStore } from './releases-store';
import { Release, FeedPreferences } from './releases-service';
import { SyncProgress } from './releases-store';

describe('ReleasesStore', () => {
  let store: ReleasesStore;

  const mockRelease: Release = {
    spotify_album_id: 'album-1',
    spotify_artist_id: 'artist-1',
    artist_name: 'Test Artist',
    title: 'Test Album',
    release_type: 'album',
    release_date: '2024-01-15',
    image_url: 'https://example.com/image.jpg',
    track_count: 12,
    artist_source: 'followed',
  };

  const mockRelease2: Release = {
    ...mockRelease,
    spotify_album_id: 'album-2',
    title: 'Second Album',
    release_date: '2024-02-01',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(ReleasesStore);
  });

  it('should be created', () => {
    expect(store).toBeTruthy();
  });

  describe('initial state', () => {
    it('should start with empty releases', () => {
      expect(store.allReleases()).toEqual([]);
    });

    it('should start with loading false', () => {
      expect(store.isLoading()).toBe(false);
    });

    it('should start with total 0', () => {
      expect(store.totalCount()).toBe(0);
    });

    it('should start with empty dismissed set', () => {
      expect(store.dismissedIds().size).toBe(0);
    });

    it('should start with syncing false', () => {
      expect(store.isSyncing()).toBe(false);
    });

    it('should start with null lastCheckedAt', () => {
      expect(store.lastCheckedAt()).toBeNull();
    });

    it('should start with isEmpty true', () => {
      expect(store.isEmpty()).toBe(true);
    });

    it('should start with empty artist IDs', () => {
      expect(store.followedArtistIds()).toEqual([]);
    });
  });

  describe('setReleases', () => {
    it('should populate releases array', () => {
      store.setReleases([mockRelease, mockRelease2], 2);
      expect(store.allReleases()).toEqual([mockRelease, mockRelease2]);
    });

    it('should set total count', () => {
      store.setReleases([mockRelease], 42);
      expect(store.totalCount()).toBe(42);
    });

    it('should update isEmpty to false when releases exist', () => {
      store.setReleases([mockRelease], 1);
      expect(store.isEmpty()).toBe(false);
    });
  });

  describe('appendReleases', () => {
    it('should append releases to existing list', () => {
      store.setReleases([mockRelease], 2);
      store.appendReleases([mockRelease2], 2);

      expect(store.allReleases()).toEqual([mockRelease, mockRelease2]);
    });

    it('should update total count', () => {
      store.setReleases([mockRelease], 5);
      store.appendReleases([mockRelease2], 10);

      expect(store.totalCount()).toBe(10);
    });
  });

  describe('addRelease', () => {
    it('should add a new release', () => {
      store.addRelease(mockRelease);
      expect(store.allReleases()).toHaveLength(1);
    });

    it('should not add a duplicate release', () => {
      store.setReleases([mockRelease], 1);
      store.addRelease(mockRelease);
      expect(store.allReleases()).toHaveLength(1);
    });

    it('should maintain descending sort by release_date', () => {
      const older: Release = {
        ...mockRelease,
        spotify_album_id: 'album-old',
        release_date: '2023-06-01',
      };
      store.setReleases([mockRelease], 1); // 2024-01-15
      store.addRelease(mockRelease2); // 2024-02-01 — should go first
      store.addRelease(older); // 2023-06-01 — should go last

      const dates = store.allReleases().map((r) => r.release_date);
      expect(dates).toEqual(['2024-02-01', '2024-01-15', '2023-06-01']);
    });
  });

  describe('setLoading', () => {
    it('should set loading to true', () => {
      store.setLoading(true);
      expect(store.isLoading()).toBe(true);
    });

    it('should set loading to false', () => {
      store.setLoading(true);
      store.setLoading(false);
      expect(store.isLoading()).toBe(false);
    });

    it('isEmpty should be false when loading even with no releases', () => {
      store.setLoading(true);
      expect(store.isEmpty()).toBe(false);
    });
  });

  describe('addDismissedId / removeDismissedId', () => {
    it('should add an id to dismissed set', () => {
      store.addDismissedId('album-1');
      expect(store.dismissedIds().has('album-1')).toBe(true);
    });

    it('should remove an id from dismissed set', () => {
      store.addDismissedId('album-1');
      store.removeDismissedId('album-1');
      expect(store.dismissedIds().has('album-1')).toBe(false);
    });

    it('should not affect other ids when removing', () => {
      store.addDismissedId('album-1');
      store.addDismissedId('album-2');
      store.removeDismissedId('album-1');

      expect(store.dismissedIds().has('album-1')).toBe(false);
      expect(store.dismissedIds().has('album-2')).toBe(true);
    });
  });

  describe('setDismissedIds', () => {
    it('should replace dismissed set', () => {
      store.addDismissedId('old-album');
      store.setDismissedIds(new Set(['album-1', 'album-2']));

      expect(store.dismissedIds().has('old-album')).toBe(false);
      expect(store.dismissedIds().has('album-1')).toBe(true);
      expect(store.dismissedIds().has('album-2')).toBe(true);
    });
  });

  describe('setSyncProgress', () => {
    it('should update sync progress', () => {
      const progress: SyncProgress = { total: 100, checked: 50, syncing: true, releasesFound: 0 };
      store.setSyncProgress(progress);

      expect(store.syncProgress()).toEqual(progress);
      expect(store.isSyncing()).toBe(true);
    });
  });

  describe('setPreferences', () => {
    it('should update preferences', () => {
      const prefs: FeedPreferences = {
        release_type_filter: 'album',
        min_track_count: 5,
        recency_days: 30,
        hide_live: false,
        source_filter: 'all',
        last_checked_at: '2024-01-01T00:00:00Z',
      };
      store.setPreferences(prefs);

      expect(store.feedPreferences()).toEqual(prefs);
      expect(store.lastCheckedAt()).toBe('2024-01-01T00:00:00Z');
    });
  });

  describe('setArtistIds', () => {
    it('should set artist IDs', () => {
      store.setArtistIds(['artist-1', 'artist-2']);
      expect(store.followedArtistIds()).toEqual(['artist-1', 'artist-2']);
    });
  });

  describe('clear', () => {
    it('should reset releases to empty array', () => {
      store.setReleases([mockRelease], 1);
      store.clear();
      expect(store.allReleases()).toEqual([]);
    });

    it('should reset total to 0', () => {
      store.setReleases([mockRelease], 42);
      store.clear();
      expect(store.totalCount()).toBe(0);
    });

    it('should reset loading to false', () => {
      store.setLoading(true);
      store.clear();
      expect(store.isLoading()).toBe(false);
    });

    it('should reset dismissed ids', () => {
      store.addDismissedId('album-1');
      store.clear();
      expect(store.dismissedIds().size).toBe(0);
    });

    it('should reset sync progress', () => {
      store.setSyncProgress({ total: 100, checked: 50, syncing: true, releasesFound: 0 });
      store.clear();
      expect(store.syncProgress()).toEqual({
        total: 0,
        checked: 0,
        syncing: false,
        releasesFound: 0,
      });
      expect(store.isSyncing()).toBe(false);
    });

    it('should reset preferences to defaults', () => {
      store.setPreferences({
        release_type_filter: 'album',
        min_track_count: 5,
        recency_days: 30,
        hide_live: false,
        source_filter: 'all',
        last_checked_at: '2024-01-01T00:00:00Z',
      });
      store.clear();
      expect(store.feedPreferences().release_type_filter).toBe('everything');
      expect(store.lastCheckedAt()).toBeNull();
    });

    it('should reset artist IDs', () => {
      store.setArtistIds(['artist-1', 'artist-2']);
      store.clear();
      expect(store.followedArtistIds()).toEqual([]);
    });

    it('should make isEmpty true', () => {
      store.setReleases([mockRelease], 1);
      store.clear();
      expect(store.isEmpty()).toBe(true);
    });
  });
});
