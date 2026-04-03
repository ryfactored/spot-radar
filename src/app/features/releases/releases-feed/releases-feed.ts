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
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';

import { AuthService, SpotifyApiService, extractErrorMessage } from '@core';
import { ToastService, EmptyState } from '@shared';

import { ReleasesService, Release, FeedPreferences } from '../releases-service';
import { ReleasesStore } from '../releases-store';
import { ReleaseCard } from '../release-card';
import { ReleaseCardCollapsed } from '../release-card-collapsed';
import { ReleaseCardSkeleton } from '../release-card-skeleton';
import { FeedFilterBar } from '../feed-filter-bar';
import { SyncIndicator } from '../sync-indicator';
import { SavedAlbumsPopover } from '../saved-albums-popover';

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
      [sourceFilter]="store.feedPreferences().source_filter"
      [syncing]="store.isSyncing()"
      (releaseTypeChange)="onReleaseTypeChange($event)"
      (minTrackChange)="onMinTrackChange($event)"
      (recencyChange)="onRecencyChange($event)"
      (hideLiveChange)="onHideLiveChange($event)"
      (sourceFilterChange)="onSourceFilterChange($event)"
      (markAllSeen)="onMarkAllSeen()"
      (syncNow)="onSyncNow($event)"
    />

    <app-sync-indicator [progress]="store.syncProgress()" />

    @if (store.isLoading() && store.allReleases().length === 0) {
      <div class="feed-container">
        <app-release-card-skeleton />
        <app-release-card-skeleton />
        <app-release-card-skeleton />
        <app-release-card-skeleton />
        <app-release-card-skeleton />
        <app-release-card-skeleton />
      </div>
    } @else if (store.isEmpty() && !store.isSyncing()) {
      <app-empty-state icon="album" title="No releases found" />
    } @else {
      <div class="feed-container">
        @if (store.lastCheckedAt() && newReleases().length > 0) {
          <div class="section-label new">
            <span class="dot"></span>
            <span>
              {{ newReleases().length }} new since
              {{ store.lastCheckedAt() | date: 'MMM d' }}
            </span>
          </div>
        }

        @if (featuredRelease(); as featured) {
          <div class="featured-section">
            <app-release-card
              [release]="featured"
              [featured]="true"
              (dismiss)="onDismiss($event)"
              (showSavedAlbums)="onShowSavedAlbums($event)"
            />
          </div>

          @if (gridReleases().length > 0) {
            <div class="secondary-section">
              <app-release-card
                [release]="gridReleases()[0]"
                (dismiss)="onDismiss($event)"
                (showSavedAlbums)="onShowSavedAlbums($event)"
              />
            </div>
          }
        }

        @for (
          release of activeRemainingReleases();
          track release.spotify_album_id;
          let i = $index
        ) {
          <div class="grid-card">
            <app-release-card
              [release]="release"
              (dismiss)="onDismiss($event)"
              (showSavedAlbums)="onShowSavedAlbums($event)"
            />
          </div>
        }

        @if (activeSeenReleases().length > 0) {
          <div class="section-label seen">
            <span class="dot"></span>
            <span>Previously seen</span>
          </div>

          @for (release of activeSeenReleases(); track release.spotify_album_id) {
            <div class="grid-card">
              <app-release-card
                [release]="release"
                (dismiss)="onDismiss($event)"
                (showSavedAlbums)="onShowSavedAlbums($event)"
              />
            </div>
          }
        }

        @if (dismissedNewReleases().length > 0 || dismissedSeenReleases().length > 0) {
          <div class="dismissed-section">
            <span class="section-label seen">Dismissed</span>
            <div class="dismissed-list">
              @for (release of dismissedNewReleases(); track release.spotify_album_id) {
                <app-release-card-collapsed [release]="release" (expand)="onUndismiss($event)" />
              }
              @for (release of dismissedSeenReleases(); track release.spotify_album_id) {
                <app-release-card-collapsed [release]="release" (expand)="onUndismiss($event)" />
              }
            </div>
          </div>
        }

        <div class="scroll-sentinel" #scrollSentinel></div>

        @if (!hasMore() && store.allReleases().length > 0) {
          <div class="footer-section">
            <span class="footer-text">Explore Archives</span>
          </div>
        }
      </div>
    }
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: 16px;
      background: radial-gradient(circle at 50% 0%, rgba(186, 158, 255, 0.06) 0%, transparent 60%);
    }

    .feed-container {
      display: grid;
      grid-template-columns: repeat(12, 1fr);
      gap: 40px;
      padding: 0 0 48px;
    }

    .featured-section {
      grid-column: span 8;
    }

    .secondary-section {
      grid-column: span 4;
    }

    .grid-card {
      grid-column: span 4;
    }

    .section-label {
      grid-column: span 12;
      display: flex;
      align-items: center;
      gap: 8px;
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.15em;
    }

    .section-label.new {
      color: #ba9eff;
    }

    .section-label.seen {
      color: #767579;
    }

    .section-label .dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #6df5e1;
    }

    .section-label.seen .dot {
      background: #767579;
    }

    .footer-section {
      grid-column: span 12;
      display: flex;
      justify-content: center;
      padding: 24px 0;
    }

    .footer-text {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.15em;
      color: #767579;
    }

    .dismissed-section {
      grid-column: span 12;
      margin-top: 16px;
    }

    .dismissed-list {
      display: flex;
      flex-direction: column;
      gap: 4px;
      max-width: 500px;
    }

    .scroll-sentinel {
      grid-column: span 12;
      height: 1px;
    }

    @media (max-width: 900px) {
      .feed-container {
        grid-template-columns: repeat(6, 1fr);
        gap: 20px;
      }

      .featured-section,
      .section-label,
      .footer-section,
      .scroll-sentinel {
        grid-column: span 6;
      }

      .secondary-section {
        grid-column: span 6;
      }

      .grid-card {
        grid-column: span 3;
      }
    }

    @media (max-width: 600px) {
      .feed-container {
        grid-template-columns: 1fr;
        gap: 16px;
      }

      .featured-section,
      .secondary-section,
      .grid-card,
      .section-label,
      .footer-section,
      .scroll-sentinel {
        grid-column: span 1;
      }
    }
  `,
})
export class ReleasesFeed implements OnInit, AfterViewInit, OnDestroy {
  protected store = inject(ReleasesStore);
  private service = inject(ReleasesService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private spotifyApi = inject(SpotifyApiService);
  private overlay = inject(Overlay);

  private scrollSentinel = viewChild<ElementRef<HTMLDivElement>>('scrollSentinel');

  private userId = '';
  private currentPage = signal(1);
  private unsubscribeRealtime: (() => void) | null = null;
  private intersectionObserver: IntersectionObserver | null = null;
  private popoverRef: OverlayRef | null = null;

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

  protected featuredRelease = computed(() => {
    const releases = this.newReleases();
    return releases.find((r) => !this.store.dismissedIds().has(r.spotify_album_id)) ?? null;
  });

  protected gridReleases = computed(() => {
    const releases = this.newReleases();
    const featured = this.featuredRelease();
    if (!featured)
      return releases.filter((r) => !this.store.dismissedIds().has(r.spotify_album_id));
    return releases.filter(
      (r) =>
        r.spotify_album_id !== featured.spotify_album_id &&
        !this.store.dismissedIds().has(r.spotify_album_id),
    );
  });

  protected remainingReleases = computed(() => {
    const grid = this.gridReleases();
    const featured = this.featuredRelease();
    if (!featured || grid.length === 0) return grid;
    return grid.slice(1);
  });

  protected activeRemainingReleases = computed(() =>
    this.remainingReleases().filter((r) => !this.store.dismissedIds().has(r.spotify_album_id)),
  );

  protected activeSeenReleases = computed(() =>
    this.seenReleases().filter((r) => !this.store.dismissedIds().has(r.spotify_album_id)),
  );

  protected dismissedNewReleases = computed(() =>
    this.newReleases().filter((r) => this.store.dismissedIds().has(r.spotify_album_id)),
  );

  protected dismissedSeenReleases = computed(() =>
    this.seenReleases().filter((r) => this.store.dismissedIds().has(r.spotify_album_id)),
  );

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
    this.popoverRef?.dispose();
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
          const newArtistIds = await this.doFullArtistSync();

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
      const { data, count } = await this.service.getFeed(this.userId, prefs, page, PAGE_SIZE);

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

  private async doFullArtistSync(): Promise<string[]> {
    const [followedArtists, savedArtists] = await Promise.all([
      this.spotifyApi.getFollowedArtists(),
      this.spotifyApi.getSavedAlbumArtists(),
    ]);
    const followedRows = followedArtists.map((a) => ({
      spotify_artist_id: a.id,
      artist_name: a.name,
    }));
    const savedRows = savedArtists.map((a) => ({ spotify_artist_id: a.id, artist_name: a.name }));
    await this.service.syncArtists(this.userId, savedRows, 'saved');
    await this.service.syncArtists(this.userId, followedRows, 'followed');
    const allActiveIds = [
      ...new Set([...followedRows, ...savedRows].map((r) => r.spotify_artist_id)),
    ];
    await this.service.removeStaleArtists(this.userId, allActiveIds);
    this.store.setArtistIds(allActiveIds);
    return allActiveIds;
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

  protected onReleaseTypeChange(value: string): Promise<void> {
    return this.updatePref('release_type_filter', value);
  }

  protected onMinTrackChange(value: number): Promise<void> {
    return this.updatePref('min_track_count', value);
  }

  protected onRecencyChange(value: number): Promise<void> {
    return this.updatePref('recency_days', value);
  }

  protected onHideLiveChange(value: boolean): Promise<void> {
    return this.updatePref('hide_live', value);
  }

  protected onSourceFilterChange(value: string): Promise<void> {
    return this.updatePref('source_filter', value);
  }

  private async updatePref<K extends keyof FeedPreferences>(
    key: K,
    value: FeedPreferences[K],
  ): Promise<void> {
    const updated: FeedPreferences = { ...this.store.feedPreferences(), [key]: value };
    this.store.setPreferences(updated);
    try {
      await this.service.savePreferences(this.userId, updated);
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
        artistIds = await this.doFullArtistSync();
        this.unsubscribeRealtime?.();
        this.unsubscribeRealtime = this.service.subscribeToNewReleases(artistIds, (release) =>
          this.store.addRelease(release),
        );
      }

      this.store.setSyncProgress({
        total: artistIds.length,
        checked: 0,
        syncing: true,
        releasesFound: 0,
      });
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

  protected onShowSavedAlbums(event: { artistId: string; triggerElement: HTMLElement }): void {
    this.popoverRef?.dispose();

    const positionStrategy = this.overlay
      .position()
      .flexibleConnectedTo(event.triggerElement)
      .withPositions([
        { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 4 },
        { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom', offsetY: -4 },
      ]);

    this.popoverRef = this.overlay.create({
      positionStrategy,
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-transparent-backdrop',
      panelClass: 'saved-albums-popover-panel',
    });

    this.popoverRef.backdropClick().subscribe(() => this.popoverRef?.dispose());
    this.popoverRef.keydownEvents().subscribe((e) => {
      if (e.key === 'Escape') this.popoverRef?.dispose();
    });

    const portal = new ComponentPortal(SavedAlbumsPopover);
    const ref = this.popoverRef.attach(portal);
    ref.setInput('artistId', event.artistId);
  }
}
