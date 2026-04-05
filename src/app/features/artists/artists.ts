import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';

import { AuthService, SupabaseService, extractErrorMessage } from '@core';
import { ToastService, EmptyState } from '@shared';

export interface UserArtist {
  spotify_artist_id: string;
  artist_name: string;
  artist_image_url: string | null;
  source: 'followed' | 'saved';
}

@Component({
  selector: 'app-artists',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [EmptyState],
  template: `
    <div class="page-header">
      <h2 class="page-title">My Artists</h2>
      <p class="page-subtitle">{{ allArtists().length }} artists in your collection</p>
    </div>

    <div class="controls">
      <div class="search-wrapper">
        <span class="material-icons search-icon">search</span>
        <input
          class="search-input"
          type="text"
          placeholder="Search artists…"
          [value]="searchQuery()"
          (input)="searchQuery.set($any($event.target).value)"
          aria-label="Search artists"
        />
        @if (searchQuery()) {
          <button class="search-clear" (click)="searchQuery.set('')" aria-label="Clear search">
            <span class="material-icons">close</span>
          </button>
        }
      </div>

      <div class="source-tabs" role="tablist" aria-label="Filter by source">
        <button
          class="tab"
          [class.active]="sourceFilter() === 'all'"
          (click)="sourceFilter.set('all')"
          role="tab"
        >
          All
          <span class="tab-count">{{ allArtists().length }}</span>
        </button>
        <button
          class="tab"
          [class.active]="sourceFilter() === 'followed'"
          (click)="sourceFilter.set('followed')"
          role="tab"
        >
          Following
          <span class="tab-count">{{ followedCount() }}</span>
        </button>
        <button
          class="tab"
          [class.active]="sourceFilter() === 'saved'"
          (click)="sourceFilter.set('saved')"
          role="tab"
        >
          In Library
          <span class="tab-count">{{ savedCount() }}</span>
        </button>
      </div>
    </div>

    @if (loading()) {
      <div class="artist-list">
        @for (i of skeletons; track i) {
          <div class="artist-item skeleton">
            <div class="artist-avatar-skeleton"></div>
            <div class="artist-info-skeleton">
              <div class="name-skeleton"></div>
              <div class="source-skeleton"></div>
            </div>
          </div>
        }
      </div>
    } @else if (filteredArtists().length === 0) {
      @if (searchQuery()) {
        <app-empty-state
          icon="search_off"
          title="No artists found"
          [message]="'No results for &quot;' + searchQuery() + '&quot;'"
        />
      } @else {
        <app-empty-state
          icon="person_search"
          title="No artists yet"
          message="Sync your Spotify library to see your artists here."
        />
      }
    } @else {
      <div class="artist-list">
        @for (artist of filteredArtists(); track artist.spotify_artist_id) {
          <a
            class="artist-item"
            [href]="'https://open.spotify.com/artist/' + artist.spotify_artist_id"
            target="_blank"
            rel="noopener"
          >
            @if (artist.artist_image_url) {
              <img
                class="artist-avatar-img"
                [src]="artist.artist_image_url"
                [alt]="artist.artist_name"
              />
            } @else {
              <div class="artist-avatar">
                <span class="material-icons">person</span>
              </div>
            }
            <div class="artist-info">
              <span class="artist-name">{{ artist.artist_name }}</span>
              <span class="artist-source" [class.saved]="artist.source === 'saved'">
                {{ artist.source === 'saved' ? 'In library' : 'Following' }}
              </span>
            </div>
            <span class="material-icons artist-link-icon">open_in_new</span>
          </a>
        }
      </div>
    }
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding-bottom: 80px;
    }

    .page-header {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 16px 0 0;
    }

    .page-title {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 2rem;
      font-weight: 800;
      letter-spacing: -0.02em;
      color: #f0edf1;
      margin: 0;
    }

    .page-subtitle {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 0.875rem;
      color: #767579;
      margin: 0;
    }

    .controls {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .search-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }

    .search-icon {
      position: absolute;
      left: 12px;
      font-size: 20px;
      color: #767579;
      pointer-events: none;
    }

    .search-input {
      width: 100%;
      padding: 10px 40px 10px 40px;
      border: 1px solid rgba(72, 72, 71, 0.2);
      border-radius: 0.5rem;
      background: rgba(25, 25, 29, 0.6);
      color: #f0edf1;
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 14px;
      outline: none;
      transition: border-color 0.2s;

      &::placeholder {
        color: #767579;
      }

      &:focus {
        border-color: rgba(186, 158, 255, 0.4);
      }
    }

    .search-clear {
      position: absolute;
      right: 8px;
      background: none;
      border: none;
      color: #767579;
      cursor: pointer;
      padding: 4px;
      display: flex;

      .material-icons {
        font-size: 18px;
      }
    }

    .source-tabs {
      display: flex;
      gap: 4px;
      background: rgba(25, 25, 29, 0.6);
      border-radius: 0.5rem;
      padding: 4px;
    }

    .tab {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 8px 12px;
      border: none;
      border-radius: 6px;
      background: transparent;
      color: #acaaae;
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;

      &.active {
        background: rgba(186, 158, 255, 0.12);
        color: #ba9eff;
      }
    }

    .tab-count {
      font-size: 11px;
      font-weight: 700;
      opacity: 0.6;
    }

    .artist-list {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .artist-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 12px;
      border-radius: 0.5rem;
      text-decoration: none;
      color: inherit;
      transition: background 0.2s;

      &:hover {
        background: rgba(255, 255, 255, 0.03);
      }
    }

    .artist-avatar-img {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      object-fit: cover;
      flex-shrink: 0;
    }

    .artist-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: rgba(186, 158, 255, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      .material-icons {
        font-size: 20px;
        color: #ba9eff;
      }
    }

    .artist-info {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .artist-name {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 14px;
      font-weight: 600;
      color: #f0edf1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .artist-source {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 11px;
      font-weight: 600;
      color: #767579;

      &.saved {
        color: #ff97b5;
      }
    }

    .artist-link-icon {
      font-size: 16px;
      color: #767579;
      opacity: 0;
      transition: opacity 0.2s;
    }

    .artist-item:hover .artist-link-icon {
      opacity: 1;
    }

    /* ── Skeletons ── */
    .artist-item.skeleton {
      pointer-events: none;
    }

    .artist-avatar-skeleton {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: #1f1f23;
    }

    .artist-info-skeleton {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .name-skeleton {
      width: 60%;
      height: 14px;
      border-radius: 4px;
      background: #1f1f23;
    }

    .source-skeleton {
      width: 30%;
      height: 10px;
      border-radius: 4px;
      background: #1f1f23;
    }

    @media (max-width: 600px) {
      .page-title {
        font-size: 1.5rem;
      }

      .tab {
        font-size: 12px;
        padding: 6px 8px;
      }
    }
  `,
})
export class Artists implements OnInit {
  private supabase = inject(SupabaseService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);

  protected allArtists = signal<UserArtist[]>([]);
  protected loading = signal(false);
  protected searchQuery = signal('');
  protected sourceFilter = signal<'all' | 'followed' | 'saved'>('all');
  protected skeletons = Array.from({ length: 12 });

  protected followedCount = computed(
    () => this.allArtists().filter((a) => a.source === 'followed').length,
  );

  protected savedCount = computed(
    () => this.allArtists().filter((a) => a.source === 'saved').length,
  );

  protected filteredArtists = computed(() => {
    let artists = this.allArtists();
    const source = this.sourceFilter();
    if (source !== 'all') {
      artists = artists.filter((a) => a.source === source);
    }
    const query = this.searchQuery().toLowerCase().trim();
    if (query) {
      artists = artists.filter((a) => a.artist_name.toLowerCase().includes(query));
    }
    return artists;
  });

  async ngOnInit(): Promise<void> {
    const userId = this.auth.currentUser()?.id;
    if (!userId) return;

    this.loading.set(true);
    try {
      const [userArtistsResult, artistsResult] = await Promise.all([
        this.supabase.client
          .from('user_artists')
          .select('spotify_artist_id, source')
          .eq('user_id', userId),
        this.supabase.client
          .from('artists')
          .select('spotify_artist_id, artist_name, artist_image_url'),
      ]);

      if (userArtistsResult.error) throw userArtistsResult.error;
      if (artistsResult.error) throw artistsResult.error;

      const artistMap = new Map<string, { artist_name: string; artist_image_url: string | null }>();
      for (const a of artistsResult.data ?? []) {
        artistMap.set(a.spotify_artist_id, {
          artist_name: a.artist_name,
          artist_image_url: a.artist_image_url,
        });
      }

      const artists: UserArtist[] = (userArtistsResult.data ?? [])
        .map((row) => {
          const info = artistMap.get(row.spotify_artist_id);
          return {
            spotify_artist_id: row.spotify_artist_id,
            source: row.source as 'followed' | 'saved',
            artist_name: info?.artist_name ?? 'Unknown',
            artist_image_url: info?.artist_image_url ?? null,
          };
        })
        .sort((a, b) => a.artist_name.localeCompare(b.artist_name));

      this.allArtists.set(artists);
    } catch (err) {
      this.toast.error(extractErrorMessage(err, 'Failed to load artists.'));
    } finally {
      this.loading.set(false);
    }
  }
}
