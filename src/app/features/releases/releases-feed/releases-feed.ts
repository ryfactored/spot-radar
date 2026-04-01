import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { DatePipe } from '@angular/common';

import { AuthService, SpotifyApiService, extractErrorMessage } from '@core';
import { ToastService, EmptyState } from '@shared';

import { ReleasesService, Release, FeedPreferences } from '../releases-service';
import { ReleasesStore } from '../releases-store';
import { ReleaseCard } from '../release-card';
import { ReleaseCardCollapsed } from '../release-card-collapsed';
import { ReleaseCardSkeleton } from '../release-card-skeleton';
import { FeedFilterBar } from '../feed-filter-bar';
import { SyncIndicator } from '../sync-indicator';

const PAGE_SIZE = 20;

@Component({
  selector: 'app-releases-feed',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    EmptyState,
    ReleaseCard,
    ReleaseCardCollapsed,
    ReleaseCardSkeleton,
    FeedFilterBar,
    SyncIndicator,
  ],
  template: `
    <app-feed-filter-bar
      [releaseTypeFilter]="store.feedPreferences().release_type_filter"
      [minTrackCount]="store.feedPreferences().min_track_count"
      [recencyDays]="store.feedPreferences().recency_days"
      [hideLive]="store.feedPreferences().hide_live"
      [syncing]="store.isSyncing()"
      (releaseTypeChange)="onReleaseTypeChange($event)"
      (minTrackChange)="onMinTrackChange($event)"
      (recencyChange)="onRecencyChange($event)"
      (hideLiveChange)="onHideLiveChange($event)"
      (markAllSeen)="onMarkAllSeen()"
      (syncNow)="onSyncNow($event)"
    />

    <app-sync-indicator [progress]="store.syncProgress()" />

    <div class="feed-container">
      @if (store.isLoading() && store.allReleases().length === 0) {
        <app-release-card-skeleton />
        <app-release-card-skeleton />
        <app-release-card-skeleton />
        <app-release-card-skeleton />
        <app-release-card-skeleton />
        <app-release-card-skeleton />
      } @else if (store.isEmpty() && !store.isSyncing()) {
        <app-empty-state icon="album" title="No releases found" />
      } @else {
        @if (store.lastCheckedAt() && newReleases().length > 0) {
          <div class="feed-divider new">
            <div class="divider-line"></div>
            <span class="divider-text">
              {{ newReleases().length }} new since
              {{ store.lastCheckedAt() | date: 'MMM d' }}
            </span>
            <div class="divider-line"></div>
          </div>
        }

        @for (release of newReleases(); track release.spotify_album_id) {
          @if (store.dismissedIds().has(release.spotify_album_id)) {
            <app-release-card-collapsed [release]="release" (expand)="onUndismiss($event)" />
          } @else {
            <app-release-card [release]="release" (dismiss)="onDismiss($event)" />
          }
        }

        @if (seenReleases().length > 0) {
          <div class="feed-divider seen">
            <div class="divider-line"></div>
            <span class="divider-text">Previously seen</span>
            <div class="divider-line"></div>
          </div>
        }

        @for (release of seenReleases(); track release.spotify_album_id) {
          @if (store.dismissedIds().has(release.spotify_album_id)) {
            <app-release-card-collapsed [release]="release" (expand)="onUndismiss($event)" />
          } @else {
            <app-release-card [release]="release" (dismiss)="onDismiss($event)" />
          }
        }

        <div class="scroll-sentinel" #scrollSentinel></div>
      }
    </div>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .feed-container {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 0 24px 24px;
    }

    .feed-divider {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 4px 0;
    }

    .divider-line {
      flex: 1;
      height: 1px;
    }

    .feed-divider.new .divider-line {
      background: color-mix(in srgb, var(--mat-sys-secondary) 30%, transparent);
    }

    .feed-divider.new .divider-text {
      color: var(--mat-sys-secondary);
      text-transform: uppercase;
      letter-spacing: 0.08em;
      font-size: 0.75rem;
      font-weight: 600;
      white-space: nowrap;
    }

    .feed-divider.seen .divider-line {
      background: color-mix(in srgb, var(--mat-sys-outline) 30%, transparent);
    }

    .feed-divider.seen .divider-text {
      color: var(--mat-sys-outline);
      text-transform: uppercase;
      letter-spacing: 0.08em;
      font-size: 0.75rem;
      font-weight: 600;
      white-space: nowrap;
    }

    .scroll-sentinel {
      height: 1px;
    }
  `,
})
export class ReleasesFeed implements OnInit, AfterViewInit, OnDestroy {
  protected store = inject(ReleasesStore);
  private service = inject(ReleasesService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private spotifyApi = inject(SpotifyApiService);

  private scrollSentinel = viewChild<ElementRef<HTMLDivElement>>('scrollSentinel');

  private userId = '';
  private currentPage = signal(1);
  private unsubscribeRealtime: (() => void) | null = null;
  private intersectionObserver: IntersectionObserver | null = null;

  protected newReleases = computed(() => {
    const lastChecked = this.store.lastCheckedAt();
    if (!lastChecked) return this.store.allReleases();
    const cutoff = new Date(lastChecked);
    return this.store.allReleases().filter((r) => new Date(r.release_date) > cutoff);
  });

  protected seenReleases = computed(() => {
    const lastChecked = this.store.lastCheckedAt();
    if (!lastChecked) return [];
    const cutoff = new Date(lastChecked);
    return this.store.allReleases().filter((r) => new Date(r.release_date) <= cutoff);
  });

  protected hasMore = computed(() => this.store.allReleases().length < this.store.totalCount());

  constructor() {
    effect(() => {
      const sentinel = this.scrollSentinel();
      if (sentinel) {
        this.intersectionObserver?.disconnect();
        this.setupIntersectionObserver(sentinel.nativeElement);
      }
    });
  }

  async ngOnInit(): Promise<void> {
    this.userId = this.auth.currentUser()?.id ?? '';
    if (!this.userId) return;

    await this.loadInitialData();
  }

  ngAfterViewInit(): void {
    const sentinel = this.scrollSentinel();
    if (sentinel) {
      this.setupIntersectionObserver(sentinel.nativeElement);
    }
  }

  ngOnDestroy(): void {
    this.unsubscribeRealtime?.();
    this.intersectionObserver?.disconnect();
  }

  private async loadInitialData(): Promise<void> {
    try {
      const [prefs, dismissedIds, artistIds] = await Promise.all([
        this.service.getPreferences(this.userId),
        this.service.getDismissedIds(this.userId),
        this.service.getUserArtistIds(this.userId),
      ]);

      this.store.setPreferences(prefs);
      this.store.setDismissedIds(dismissedIds);
      this.store.setArtistIds(artistIds);

      if (artistIds.length === 0) {
        // First visit — sync artist list from Spotify
        this.store.setSyncProgress({ total: 0, checked: 0, syncing: true, releasesFound: 0 });
        try {
          let followedIds = new Set<string>();
          let savedIds = new Set<string>();

          const updateTotal = () => {
            const uniqueCount = new Set([...followedIds, ...savedIds]).size;
            if (uniqueCount > 0) {
              this.store.setSyncProgress({
                total: uniqueCount,
                checked: 0,
                syncing: true,
                releasesFound: 0,
              });
            }
          };

          const [followedArtists, savedArtists] = await Promise.all([
            this.spotifyApi.getFollowedArtists().then((artists) => {
              followedIds = new Set(artists.map((a) => a.id));
              updateTotal();
              return artists;
            }),
            this.spotifyApi.getSavedAlbumArtists().then((artists) => {
              savedIds = new Set(artists.map((a) => a.id));
              updateTotal();
              return artists;
            }),
          ]);

          const followedRows = followedArtists.map((a) => ({
            spotify_artist_id: a.id,
            artist_name: a.name,
          }));
          const savedRows = savedArtists.map((a) => ({
            spotify_artist_id: a.id,
            artist_name: a.name,
          }));

          await this.service.syncArtists(this.userId, savedRows, 'saved');
          await this.service.syncArtists(this.userId, followedRows, 'followed');

          const allActiveIds = [
            ...new Set([...followedRows, ...savedRows].map((r) => r.spotify_artist_id)),
          ];
          await this.service.removeStaleArtists(this.userId, allActiveIds);

          const newArtistIds = await this.service.getUserArtistIds(this.userId);
          this.store.setArtistIds(newArtistIds);

          // Subscribe to Realtime before triggering sync
          this.unsubscribeRealtime = this.service.subscribeToNewReleases(newArtistIds, (release) =>
            this.store.addRelease(release),
          );

          // Trigger the onboarding Edge Function and wait for it to finish
          await this.service.triggerOnboardingSync(this.userId);
          this.store.setSyncProgress({ total: 0, checked: 0, syncing: false, releasesFound: 0 });
          // Load the full feed now — Realtime may have missed some during sync
          await this.loadFeed(1);
        } catch (err) {
          this.toast.error(extractErrorMessage(err, 'Failed to sync your Spotify library'));
          this.store.setSyncProgress({ total: 0, checked: 0, syncing: false, releasesFound: 0 });
          await this.loadFeed(1);
        }
        return;
      }

      if (artistIds.length > 0) {
        await this.loadFeed(1);
        this.subscribeToRealtime(artistIds);
      }
    } catch (err) {
      this.toast.error(extractErrorMessage(err, 'Failed to load your feed.'));
    }
  }

  private async loadFeed(page: number): Promise<void> {
    this.store.setLoading(true);
    try {
      const prefs = this.store.feedPreferences();
      const artistIds = this.store.followedArtistIds();
      const { data, count } = await this.service.getFeed(
        this.userId,
        artistIds,
        prefs,
        page,
        PAGE_SIZE,
      );

      if (page === 1) {
        this.store.setReleases(data, count);
      } else {
        this.store.appendReleases(data, count);
      }
      this.currentPage.set(page);
    } catch (err) {
      this.toast.error(extractErrorMessage(err, 'Failed to load releases.'));
    } finally {
      this.store.setLoading(false);
    }
  }

  private subscribeToRealtime(artistIds: string[]): void {
    this.unsubscribeRealtime = this.service.subscribeToNewReleases(
      artistIds,
      (release: Release) => {
        this.store.addRelease(release);
      },
    );
  }

  private setupIntersectionObserver(sentinel: Element): void {
    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && this.hasMore() && !this.store.isLoading()) {
          this.loadMore();
        }
      },
      { threshold: 0.1 },
    );
    this.intersectionObserver.observe(sentinel);
  }

  protected async loadMore(): Promise<void> {
    if (!this.hasMore() || this.store.isLoading()) return;
    await this.loadFeed(this.currentPage() + 1);
  }

  protected async onReleaseTypeChange(value: string): Promise<void> {
    const updated: FeedPreferences = {
      ...this.store.feedPreferences(),
      release_type_filter: value,
    };
    this.store.setPreferences(updated);
    await this.saveAndReload(updated);
  }

  protected async onMinTrackChange(value: number): Promise<void> {
    const updated: FeedPreferences = { ...this.store.feedPreferences(), min_track_count: value };
    this.store.setPreferences(updated);
    await this.saveAndReload(updated);
  }

  protected async onRecencyChange(value: number): Promise<void> {
    const updated: FeedPreferences = { ...this.store.feedPreferences(), recency_days: value };
    this.store.setPreferences(updated);
    await this.saveAndReload(updated);
  }

  protected async onHideLiveChange(value: boolean): Promise<void> {
    const updated: FeedPreferences = { ...this.store.feedPreferences(), hide_live: value };
    this.store.setPreferences(updated);
    await this.saveAndReload(updated);
  }

  private async saveAndReload(prefs: FeedPreferences): Promise<void> {
    try {
      await this.service.savePreferences(this.userId, prefs);
      await this.loadFeed(1);
    } catch (err) {
      this.toast.error(extractErrorMessage(err, 'Failed to save preferences.'));
    }
  }

  protected async onMarkAllSeen(): Promise<void> {
    try {
      await this.service.markAllSeen(this.userId);
      const updated: FeedPreferences = {
        ...this.store.feedPreferences(),
        last_checked_at: new Date().toISOString(),
      };
      this.store.setPreferences(updated);
      this.toast.success('All releases marked as seen.');
    } catch (err) {
      this.toast.error(extractErrorMessage(err, 'Failed to mark releases as seen.'));
    }
  }

  protected async onSyncNow(mode: 'quick' | 'full'): Promise<void> {
    if (this.store.isSyncing()) return;
    this.store.setSyncProgress({ total: 0, checked: 0, syncing: true, releasesFound: 0 });
    try {
      let artistIds = this.store.followedArtistIds();

      if (mode === 'full') {
        // Re-fetch artist lists from Spotify to pick up new follows/saves and fix sources
        const [followedArtists, savedArtists] = await Promise.all([
          this.spotifyApi.getFollowedArtists(),
          this.spotifyApi.getSavedAlbumArtists(),
        ]);
        const followedRows = followedArtists.map((a) => ({
          spotify_artist_id: a.id,
          artist_name: a.name,
        }));
        const savedRows = savedArtists.map((a) => ({
          spotify_artist_id: a.id,
          artist_name: a.name,
        }));
        await this.service.syncArtists(this.userId, savedRows, 'saved');
        await this.service.syncArtists(this.userId, followedRows, 'followed');

        // Remove artists no longer in followed or saved lists
        const allActiveIds = [
          ...new Set([...followedRows, ...savedRows].map((r) => r.spotify_artist_id)),
        ];
        await this.service.removeStaleArtists(this.userId, allActiveIds);

        artistIds = await this.service.getUserArtistIds(this.userId);
        this.store.setArtistIds(artistIds);
      }

      this.store.setSyncProgress({
        total: artistIds.length,
        checked: 0,
        syncing: true,
        releasesFound: 0,
      });
      this.unsubscribeRealtime?.();
      this.unsubscribeRealtime = this.service.subscribeToNewReleases(artistIds, (release) =>
        this.store.addRelease(release),
      );
      await this.service.triggerOnboardingSync(this.userId);
      this.store.setSyncProgress({ total: 0, checked: 0, syncing: false, releasesFound: 0 });
      await this.loadFeed(1);
      this.toast.success(mode === 'full' ? 'Full sync complete.' : 'Sync complete.');
    } catch (err) {
      this.store.setSyncProgress({ total: 0, checked: 0, syncing: false, releasesFound: 0 });
      this.toast.error(extractErrorMessage(err, 'Sync failed.'));
    }
  }

  protected async onDismiss(albumId: string): Promise<void> {
    this.store.addDismissedId(albumId);
    try {
      await this.service.dismissRelease(this.userId, albumId);
    } catch (err) {
      this.store.removeDismissedId(albumId);
      this.toast.error(extractErrorMessage(err, 'Failed to dismiss release.'));
    }
  }

  protected async onUndismiss(albumId: string): Promise<void> {
    this.store.removeDismissedId(albumId);
    try {
      await this.service.undismissRelease(this.userId, albumId);
    } catch (err) {
      this.store.addDismissedId(albumId);
      this.toast.error(extractErrorMessage(err, 'Failed to restore release.'));
    }
  }
}
