import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';

import { AuthService, SupabaseService, SpotifyApiService, extractErrorMessage } from '@core';
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
      <p class="page-subtitle">{{ filteredCount() }} artists</p>
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
          <span class="tab-count">{{ filteredAllCount() }}</span>
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
      <div class="letter-jump-bar">
        @for (letter of availableLetters(); track letter) {
          <button class="letter-jump" (click)="scrollToLetter(letter)">{{ letter }}</button>
        }
      </div>

      <div class="artist-list">
        @for (group of groupedArtists(); track group.letter) {
          <div class="letter-heading" [id]="'letter-' + group.letter">
            <span class="letter">{{ group.letter }}</span>
            <span class="letter-count">{{ group.count }}</span>
            <div class="letter-line"></div>
          </div>
          @for (artist of group.artists; track artist.spotify_artist_id) {
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
        border-color: rgba(164, 201, 255, 0.4);
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
        background: rgba(164, 201, 255, 0.12);
        color: #a4c9ff;
      }
    }

    .tab-count {
      font-size: 11px;
      font-weight: 700;
      opacity: 0.6;
    }

    .letter-jump-bar {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      padding: 4px 0;
      position: sticky;
      top: 0;
      z-index: 5;
      background: #0e0e11;
    }

    .letter-jump {
      min-width: 28px;
      height: 28px;
      border: none;
      border-radius: 6px;
      background: rgba(164, 201, 255, 0.08);
      color: #a4c9ff;
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 11px;
      font-weight: 700;
      cursor: pointer;
      transition: background 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;

      &:hover {
        background: rgba(164, 201, 255, 0.2);
      }
    }

    .letter-heading {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 16px 0 6px;
    }

    .letter {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 16px;
      font-weight: 800;
      color: #a4c9ff;
    }

    .letter-count {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 11px;
      font-weight: 600;
      color: #767579;
    }

    .letter-line {
      flex: 1;
      height: 1px;
      background: rgba(72, 72, 71, 0.2);
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
      background: rgba(164, 201, 255, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      .material-icons {
        font-size: 20px;
        color: #a4c9ff;
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
      .page-header {
        padding: 8px 0 0;
        gap: 2px;
      }

      .page-title {
        font-size: 1.25rem;
      }

      .page-subtitle {
        font-size: 0.75rem;
      }

      .controls {
        gap: 8px;
      }

      .search-input {
        padding: 8px 36px 8px 36px;
        font-size: 13px;
      }

      .source-tabs {
        padding: 3px;
      }

      .tab {
        font-size: 11px;
        padding: 6px 4px;
        gap: 4px;
      }

      .tab-count {
        font-size: 10px;
      }

      .artist-item {
        padding: 8px;
        gap: 10px;
      }

      .artist-avatar,
      .artist-avatar-img {
        width: 36px;
        height: 36px;
      }

      .artist-name {
        font-size: 13px;
      }

      .artist-source {
        font-size: 10px;
      }

      .letter-jump-bar {
        gap: 3px;
      }

      .letter-jump {
        min-width: 24px;
        height: 24px;
        font-size: 10px;
      }

      .letter {
        font-size: 14px;
      }

      .letter-heading {
        padding: 12px 0 4px;
      }
    }
  `,
})
export class Artists implements OnInit {
  private supabase = inject(SupabaseService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private spotifyApi = inject(SpotifyApiService);

  protected allArtists = signal<UserArtist[]>([]);
  protected loading = signal(false);
  protected searchQuery = signal('');
  protected sourceFilter = signal<'all' | 'followed' | 'saved'>('all');
  protected skeletons = Array.from({ length: 12 });

  private searchFiltered = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return this.allArtists();
    return this.allArtists().filter((a) => a.artist_name.toLowerCase().includes(query));
  });

  protected filteredAllCount = computed(() => this.searchFiltered().length);

  protected followedCount = computed(
    () => this.searchFiltered().filter((a) => a.source === 'followed').length,
  );

  protected savedCount = computed(
    () => this.searchFiltered().filter((a) => a.source === 'saved').length,
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

  protected groupedArtists = computed(() => {
    const groups: { letter: string; count: number; artists: UserArtist[] }[] = [];
    const artists = this.filteredArtists();
    let currentLetter = '';

    for (const artist of artists) {
      const first = (artist.artist_name[0] ?? '#').toUpperCase();
      const letter = /[A-Z]/.test(first) ? first : '#';
      if (letter !== currentLetter) {
        currentLetter = letter;
        groups.push({ letter, count: 0, artists: [] });
      }
      groups[groups.length - 1].artists.push(artist);
      groups[groups.length - 1].count++;
    }

    return groups;
  });

  protected availableLetters = computed(() => this.groupedArtists().map((g) => g.letter));

  protected filteredCount = computed(() =>
    this.groupedArtists().reduce((sum, g) => sum + g.count, 0),
  );

  protected scrollToLetter(letter: string): void {
    const el = document.getElementById(`letter-${letter}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async ngOnInit(): Promise<void> {
    const userId = this.auth.currentUser()?.id;
    if (!userId) return;

    this.loading.set(true);
    try {
      // Supabase caps queries at 1000 rows — paginate both tables
      const userArtistsData: { spotify_artist_id: string; source: string }[] = [];
      for (let from = 0; ; from += 1000) {
        const { data, error } = await this.supabase.client
          .from('user_artists')
          .select('spotify_artist_id, source')
          .eq('user_id', userId)
          .range(from, from + 999);
        if (error) throw error;
        const rows = data ?? [];
        userArtistsData.push(...rows);
        if (rows.length < 1000) break;
      }

      const artistsData: {
        spotify_artist_id: string;
        artist_name: string;
        artist_image_url: string | null;
      }[] = [];
      for (let from = 0; ; from += 1000) {
        const { data, error } = await this.supabase.client
          .from('artists')
          .select('spotify_artist_id, artist_name, artist_image_url')
          .range(from, from + 999);
        if (error) throw error;
        const rows = data ?? [];
        artistsData.push(...rows);
        if (rows.length < 1000) break;
      }

      const artistMap = new Map<string, { name: string; image: string | null }>();
      for (const a of artistsData) {
        artistMap.set(a.spotify_artist_id, {
          name: a.artist_name,
          image: a.artist_image_url,
        });
      }

      let artists: UserArtist[] = userArtistsData
        .map((row) => {
          const info = artistMap.get(row.spotify_artist_id);
          return {
            spotify_artist_id: row.spotify_artist_id,
            source: row.source as 'followed' | 'saved',
            artist_name: info?.name ?? 'Unknown',
            artist_image_url: info?.image ?? null,
          };
        })
        .sort((a, b) => {
          const aFirst = a.artist_name[0] ?? '';
          const bFirst = b.artist_name[0] ?? '';
          const aIsLetter = /[A-Za-z]/.test(aFirst);
          const bIsLetter = /[A-Za-z]/.test(bFirst);
          if (!aIsLetter && bIsLetter) return -1;
          if (aIsLetter && !bIsLetter) return 1;
          return a.artist_name.localeCompare(b.artist_name);
        });

      this.allArtists.set(artists);

      // Backfill any "Unknown" artists from Spotify API
      const unknownIds = artists
        .filter((a) => a.artist_name === 'Unknown')
        .map((a) => a.spotify_artist_id);

      if (unknownIds.length > 0) {
        try {
          const fetched = await this.spotifyApi.getArtistsByIds(unknownIds);
          const upsertRows = [...fetched.values()].map((a) => ({
            spotify_artist_id: a.id,
            artist_name: a.name,
            artist_image_url: a.images?.[0]?.url ?? null,
          }));

          // Update DB for future loads
          if (upsertRows.length > 0) {
            await this.supabase.client.from('artists').upsert(upsertRows);
          }

          // Update local state immediately
          artists = artists
            .map((a) => {
              const info = fetched.get(a.spotify_artist_id);
              if (!info) return a;
              return {
                ...a,
                artist_name: info.name,
                artist_image_url: info.images?.[0]?.url ?? null,
              };
            })
            .sort((x, y) => {
              const xFirst = x.artist_name[0] ?? '';
              const yFirst = y.artist_name[0] ?? '';
              const xIsLetter = /[A-Za-z]/.test(xFirst);
              const yIsLetter = /[A-Za-z]/.test(yFirst);
              if (!xIsLetter && yIsLetter) return -1;
              if (xIsLetter && !yIsLetter) return 1;
              return x.artist_name.localeCompare(y.artist_name);
            });
          this.allArtists.set(artists);
        } catch {
          // Best-effort — don't fail the page if backfill fails
        }
      }
    } catch (err) {
      this.toast.error(extractErrorMessage(err, 'Failed to load artists.'));
    } finally {
      this.loading.set(false);
    }
  }
}
