import { Injectable, signal, computed } from '@angular/core';
import { Release, FeedPreferences } from './releases-service';

export interface SyncProgress {
  total: number;
  checked: number;
  syncing: boolean;
}

const DEFAULT_PREFERENCES: FeedPreferences = {
  release_type_filter: 'everything',
  min_track_count: 0,
  recency_days: 90,
  last_checked_at: null,
};

const DEFAULT_SYNC: SyncProgress = { total: 0, checked: 0, syncing: false };

@Injectable({
  providedIn: 'root',
})
export class ReleasesStore {
  private releases = signal<Release[]>([]);
  private loading = signal(false);
  private total = signal(0);
  private dismissed = signal<Set<string>>(new Set());
  private sync = signal<SyncProgress>({ ...DEFAULT_SYNC });
  private preferences = signal<FeedPreferences>({ ...DEFAULT_PREFERENCES });
  private artistIds = signal<string[]>([]);

  // Public readonly accessors
  readonly allReleases = this.releases.asReadonly();
  readonly isLoading = this.loading.asReadonly();
  readonly totalCount = this.total.asReadonly();
  readonly dismissedIds = this.dismissed.asReadonly();
  readonly syncProgress = this.sync.asReadonly();
  readonly feedPreferences = this.preferences.asReadonly();
  readonly followedArtistIds = this.artistIds.asReadonly();

  // Computed signals
  readonly isEmpty = computed(() => this.releases().length === 0 && !this.loading());
  readonly isSyncing = computed(() => this.sync().syncing);
  readonly lastCheckedAt = computed(() => this.preferences().last_checked_at);

  // --- Mutation methods ---

  setReleases(releases: Release[], total: number): void {
    this.releases.set(releases);
    this.total.set(total);
  }

  appendReleases(releases: Release[], total: number): void {
    this.releases.update((existing) => [...existing, ...releases]);
    this.total.set(total);
  }

  /**
   * Add a release to the front if it's not already present, keeping sort by
   * release_date descending.
   */
  addRelease(release: Release): void {
    this.releases.update((existing) => {
      if (existing.some((r) => r.spotify_album_id === release.spotify_album_id)) {
        return existing;
      }
      return [release, ...existing].sort(
        (a, b) => new Date(b.release_date).getTime() - new Date(a.release_date).getTime(),
      );
    });
  }

  setLoading(loading: boolean): void {
    this.loading.set(loading);
  }

  setDismissedIds(ids: Set<string>): void {
    this.dismissed.set(ids);
  }

  addDismissedId(id: string): void {
    this.dismissed.update((set) => new Set([...set, id]));
  }

  removeDismissedId(id: string): void {
    this.dismissed.update((set) => {
      const next = new Set(set);
      next.delete(id);
      return next;
    });
  }

  setSyncProgress(progress: SyncProgress): void {
    this.sync.set(progress);
  }

  setPreferences(prefs: FeedPreferences): void {
    this.preferences.set(prefs);
  }

  setArtistIds(ids: string[]): void {
    this.artistIds.set(ids);
  }

  clear(): void {
    this.releases.set([]);
    this.loading.set(false);
    this.total.set(0);
    this.dismissed.set(new Set());
    this.sync.set({ ...DEFAULT_SYNC });
    this.preferences.set({ ...DEFAULT_PREFERENCES });
    this.artistIds.set([]);
  }
}
