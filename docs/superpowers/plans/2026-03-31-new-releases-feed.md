# New Releases Feed Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a personalized new releases feed that syncs artists from the user's Spotify library, checks for recent releases via server-side Edge Functions, and serves a filterable feed from Supabase.

**Architecture:** Three-layer Angular pattern (Service → Store → Component) with Supabase backend. Spotify OAuth provides access tokens stored server-side. Edge Functions handle release syncing — onboarding (parallel batch) and scheduled refresh (every 6 hours). Client reads from Supabase, never calls Spotify for feed data.

**Tech Stack:** Angular 21 (zoneless signals), Supabase (Postgres + Edge Functions + Realtime), Spotify Web API, Angular Material

**Spec:** `docs/superpowers/specs/2026-03-31-new-releases-feed-design.md`

---

## Chunk 1: Database Foundation

### Task 1: Supabase Migration — Tables and RLS

**Files:**
- Create: `supabase/migrations/20260331000001_releases_feature.sql`

- [ ] **Step 1: Write the migration SQL**

```sql
-- Spotify token storage for Edge Functions
create table angular_starter.user_spotify_tokens (
  user_id uuid primary key references auth.users(id) on delete cascade,
  access_token text not null,
  refresh_token text not null,
  expires_at timestamptz not null,
  scopes text not null default '',
  updated_at timestamptz default now() not null
);

alter table angular_starter.user_spotify_tokens enable row level security;

create policy "Users can view own tokens"
  on angular_starter.user_spotify_tokens for select
  using (auth.uid() = user_id);

create policy "Users can insert own tokens"
  on angular_starter.user_spotify_tokens for insert
  with check (auth.uid() = user_id);

create policy "Users can update own tokens"
  on angular_starter.user_spotify_tokens for update
  using (auth.uid() = user_id);

-- Shared artists table (not per-user)
create table angular_starter.artists (
  spotify_artist_id text primary key,
  artist_name text not null,
  artist_image_url text,
  last_release_check timestamptz
);

alter table angular_starter.artists enable row level security;

create policy "Authenticated users can read artists"
  on angular_starter.artists for select
  using (auth.role() = 'authenticated');

create policy "Authenticated users can insert artists"
  on angular_starter.artists for insert
  with check (auth.role() = 'authenticated');

create policy "Authenticated users can update artists"
  on angular_starter.artists for update
  using (auth.role() = 'authenticated');

-- Per-user artist list
create table angular_starter.user_artists (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  spotify_artist_id text not null references angular_starter.artists(spotify_artist_id),
  artist_name text not null,
  artist_image_url text,
  source text not null default 'followed',
  synced_at timestamptz default now() not null,
  unique(user_id, spotify_artist_id)
);

alter table angular_starter.user_artists enable row level security;

create policy "Users can view own artists"
  on angular_starter.user_artists for select
  using (auth.uid() = user_id);

create policy "Users can insert own artists"
  on angular_starter.user_artists for insert
  with check (auth.uid() = user_id);

create policy "Users can update own artists"
  on angular_starter.user_artists for update
  using (auth.uid() = user_id);

create policy "Users can delete own artists"
  on angular_starter.user_artists for delete
  using (auth.uid() = user_id);

-- Shared releases table
create table angular_starter.releases (
  spotify_album_id text primary key,
  spotify_artist_id text not null,
  artist_name text not null,
  title text not null,
  release_type text not null,
  release_date date not null,
  image_url text,
  spotify_url text not null,
  track_count integer not null default 0,
  fetched_at timestamptz default now() not null
);

alter table angular_starter.releases enable row level security;

create policy "Authenticated users can read releases"
  on angular_starter.releases for select
  using (auth.role() = 'authenticated');

-- Per-user release state (dismissed)
create table angular_starter.user_release_state (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  spotify_album_id text not null references angular_starter.releases(spotify_album_id),
  dismissed boolean not null default false,
  dismissed_at timestamptz,
  unique(user_id, spotify_album_id)
);

alter table angular_starter.user_release_state enable row level security;

create policy "Users can view own release state"
  on angular_starter.user_release_state for select
  using (auth.uid() = user_id);

create policy "Users can insert own release state"
  on angular_starter.user_release_state for insert
  with check (auth.uid() = user_id);

create policy "Users can update own release state"
  on angular_starter.user_release_state for update
  using (auth.uid() = user_id);

-- Per-user feed preferences
create table angular_starter.user_feed_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  release_type_filter text not null default 'everything',
  min_track_count integer not null default 0,
  recency_days integer not null default 90,
  last_checked_at timestamptz
);

alter table angular_starter.user_feed_preferences enable row level security;

create policy "Users can view own preferences"
  on angular_starter.user_feed_preferences for select
  using (auth.uid() = user_id);

create policy "Users can insert own preferences"
  on angular_starter.user_feed_preferences for insert
  with check (auth.uid() = user_id);

create policy "Users can update own preferences"
  on angular_starter.user_feed_preferences for update
  using (auth.uid() = user_id);

-- Enable Realtime on releases table for live feed updates during sync
alter publication supabase_realtime add table angular_starter.releases;
```

- [ ] **Step 2: Run the migration in Supabase SQL Editor**

Run the SQL above in the Supabase Dashboard SQL Editor. Verify all tables appear under the `angular_starter` schema.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260331000001_releases_feature.sql
git commit -m "feat: add releases feature database tables and RLS policies"
```

---

### Task 2: Add Feature Flag and Environment Config

**Files:**
- Modify: `src/environments/environment.base.ts`
- Modify: `src/environments/environment.interface.ts`

- [ ] **Step 1: Add `releases` feature flag to environment base**

In `src/environments/environment.base.ts`, add `releases: true` to the `featureFlags` object:

```typescript
featureFlags: {
  notes: true,
  chat: true,
  files: true,
  admin: true,
  breadcrumb: true,
  components: true,
  themePicker: true,
  centerContent: true,
  releases: true, // New releases feed
  defaultChildNavMode: 'none',
},
```

- [ ] **Step 2: Verify the environment interface allows string keys**

Check `src/environments/environment.interface.ts` — `featureFlags` should be typed as `Record<string, boolean | string>`. If so, no change needed. If not, update accordingly.

- [ ] **Step 3: Commit**

```bash
git add src/environments/environment.base.ts
git commit -m "feat: add releases feature flag to environment config"
```

---

## Chunk 2: Spotify API Services

### Task 3: SpotifyAuthService — Token Management

**Files:**
- Create: `src/app/core/spotify/spotify-auth.ts`
- Create: `src/app/core/spotify/spotify-auth.spec.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/app/core/spotify/spotify-auth.spec.ts
import { TestBed } from '@angular/core/testing';
import { SpotifyAuthService } from './spotify-auth';
import { SupabaseService } from '@core/supabase/supabase';

describe('SpotifyAuthService', () => {
  let service: SpotifyAuthService;
  let mockSupabase: { client: any };

  beforeEach(() => {
    mockSupabase = {
      client: {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            access_token: 'test-token',
            refresh_token: 'test-refresh',
            expires_at: new Date(Date.now() + 3600000).toISOString(),
            scopes: 'user-follow-read user-library-read',
          },
          error: null,
        }),
        upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
        auth: {
          getSession: vi.fn().mockResolvedValue({
            data: { session: { provider_token: 'spotify-token', provider_refresh_token: 'spotify-refresh' } },
            error: null,
          }),
        },
      },
    };

    TestBed.configureTestingModule({
      providers: [{ provide: SupabaseService, useValue: mockSupabase }],
    });
    service = TestBed.inject(SpotifyAuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should store tokens', async () => {
    await service.storeTokens('user-1', 'access', 'refresh', 3600);
    expect(mockSupabase.client.from).toHaveBeenCalledWith('user_spotify_tokens');
  });

  it('should get access token', async () => {
    const token = await service.getAccessToken('user-1');
    expect(token).toBe('test-token');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --no-watch src/app/core/spotify/spotify-auth.spec.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Write the implementation**

```typescript
// src/app/core/spotify/spotify-auth.ts
import { inject, Injectable } from '@angular/core';
import { SupabaseService } from '@core/supabase/supabase';
import { unwrap } from '@core/errors/error-mapper';

interface SpotifyTokenRow {
  user_id: string;
  access_token: string;
  refresh_token: string;
  expires_at: string;
  scopes: string;
  updated_at: string;
}

@Injectable({ providedIn: 'root' })
export class SpotifyAuthService {
  private supabase = inject(SupabaseService);

  async storeTokens(
    userId: string,
    accessToken: string,
    refreshToken: string,
    expiresInSeconds: number,
  ): Promise<void> {
    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000).toISOString();
    await unwrap(
      this.supabase.client.from('user_spotify_tokens').upsert(
        {
          user_id: userId,
          access_token: accessToken,
          refresh_token: refreshToken,
          expires_at: expiresAt,
          scopes: 'user-follow-read user-library-read',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' },
      ),
    );
  }

  async getAccessToken(userId: string): Promise<string> {
    const row = await unwrap<SpotifyTokenRow>(
      this.supabase.client
        .from('user_spotify_tokens')
        .select('*')
        .eq('user_id', userId)
        .single(),
    );

    if (new Date(row.expires_at) < new Date()) {
      return this.refreshAccessToken(userId, row.refresh_token);
    }
    return row.access_token;
  }

  async captureTokensFromSession(userId: string): Promise<void> {
    const { data, error } = await this.supabase.client.auth.getSession();
    if (error || !data.session) return;

    const providerToken = data.session.provider_token;
    const providerRefreshToken = data.session.provider_refresh_token;
    if (!providerToken || !providerRefreshToken) return;

    await this.storeTokens(userId, providerToken, providerRefreshToken, 3600);
  }

  private async refreshAccessToken(userId: string, refreshToken: string): Promise<string> {
    // Token refresh is handled by the Edge Functions server-side (they have the client credentials).
    // Client-side, if the token is expired, we re-trigger the Supabase OAuth flow to get fresh tokens.
    // For now, throw to prompt re-authentication.
    throw new Error('Spotify token expired — please sign in again with Spotify');
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- --no-watch src/app/core/spotify/spotify-auth.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/core/spotify/spotify-auth.ts src/app/core/spotify/spotify-auth.spec.ts
git commit -m "feat: add SpotifyAuthService for token management"
```

---

### Task 4: SpotifyApiService — Spotify Web API Wrapper

**Files:**
- Create: `src/app/core/spotify/spotify-api.ts`
- Create: `src/app/core/spotify/spotify-api.spec.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/app/core/spotify/spotify-api.spec.ts
import { TestBed } from '@angular/core/testing';
import { SpotifyApiService, SpotifyArtist, SpotifyAlbum } from './spotify-api';
import { SpotifyAuthService } from './spotify-auth';
import { AuthService } from '@core/auth/auth';

describe('SpotifyApiService', () => {
  let service: SpotifyApiService;

  const mockArtist: SpotifyArtist = {
    id: 'artist-1',
    name: 'Test Artist',
    images: [{ url: 'https://img.spotify.com/artist.jpg', height: 300, width: 300 }],
  };

  const mockAlbum: SpotifyAlbum = {
    id: 'album-1',
    name: 'Test Album',
    album_type: 'album',
    release_date: '2026-03-15',
    total_tracks: 12,
    images: [{ url: 'https://img.spotify.com/album.jpg', height: 300, width: 300 }],
    external_urls: { spotify: 'https://open.spotify.com/album/album-1' },
    artists: [{ id: 'artist-1', name: 'Test Artist' }],
  };

  beforeEach(() => {
    global.fetch = vi.fn();

    TestBed.configureTestingModule({
      providers: [
        {
          provide: SpotifyAuthService,
          useValue: { getAccessToken: vi.fn().mockResolvedValue('test-token') },
        },
        {
          provide: AuthService,
          useValue: { currentUser: vi.fn(() => ({ id: 'user-1' })) },
        },
      ],
    });
    service = TestBed.inject(SpotifyApiService);
  });

  it('should fetch followed artists', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        artists: { items: [mockArtist], cursors: { after: null }, total: 1 },
      }),
    });

    const result = await service.getFollowedArtists();
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('artist-1');
  });

  it('should fetch artist albums', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ items: [mockAlbum] }),
    });

    const result = await service.getArtistAlbums('artist-1', 5);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Test Album');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --no-watch src/app/core/spotify/spotify-api.spec.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Write the implementation**

```typescript
// src/app/core/spotify/spotify-api.ts
import { inject, Injectable } from '@angular/core';
import { SpotifyAuthService } from './spotify-auth';
import { AuthService } from '@core/auth/auth';

export interface SpotifyImage {
  url: string;
  height: number;
  width: number;
}

export interface SpotifyArtist {
  id: string;
  name: string;
  images: SpotifyImage[];
}

export interface SpotifyAlbum {
  id: string;
  name: string;
  album_type: 'album' | 'single' | 'compilation';
  release_date: string;
  total_tracks: number;
  images: SpotifyImage[];
  external_urls: { spotify: string };
  artists: { id: string; name: string }[];
}

const SPOTIFY_API = 'https://api.spotify.com/v1';

@Injectable({ providedIn: 'root' })
export class SpotifyApiService {
  private spotifyAuth = inject(SpotifyAuthService);
  private auth = inject(AuthService);

  private async fetchWithAuth(url: string): Promise<Response> {
    const userId = this.auth.currentUser()?.id;
    if (!userId) throw new Error('User not authenticated');

    const token = await this.spotifyAuth.getAccessToken(userId);
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.status === 429) {
      const retryAfter = parseInt(response.headers.get('Retry-After') || '1', 10);
      await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
      return this.fetchWithAuth(url);
    }

    if (!response.ok) {
      throw new Error(`Spotify API error: ${response.status} ${response.statusText}`);
    }

    return response;
  }

  async getFollowedArtists(): Promise<SpotifyArtist[]> {
    const artists: SpotifyArtist[] = [];
    let after: string | null = null;

    do {
      const url = `${SPOTIFY_API}/me/following?type=artist&limit=50${after ? `&after=${after}` : ''}`;
      const response = await this.fetchWithAuth(url);
      const data = await response.json();
      artists.push(...data.artists.items);
      after = data.artists.cursors?.after ?? null;
    } while (after);

    return artists;
  }

  async getSavedAlbumArtists(): Promise<SpotifyArtist[]> {
    const artistMap = new Map<string, SpotifyArtist>();
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      const url = `${SPOTIFY_API}/me/albums?limit=50&offset=${offset}`;
      const response = await this.fetchWithAuth(url);
      const data = await response.json();

      for (const item of data.items) {
        for (const artist of item.album.artists) {
          if (!artistMap.has(artist.id)) {
            artistMap.set(artist.id, {
              id: artist.id,
              name: artist.name,
              images: [], // Saved albums don't include full artist images
            });
          }
        }
      }

      hasMore = data.next !== null;
      offset += 50;
    }

    return Array.from(artistMap.values());
  }

  async getArtistAlbums(
    artistId: string,
    limit = 5,
  ): Promise<SpotifyAlbum[]> {
    const url = `${SPOTIFY_API}/artists/${artistId}/albums?include_groups=album,single&limit=${limit}`;
    const response = await this.fetchWithAuth(url);
    const data = await response.json();
    return data.items;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- --no-watch src/app/core/spotify/spotify-api.spec.ts`
Expected: PASS

- [ ] **Step 5: Add barrel export**

Add to `src/app/core/index.ts`:

```typescript
export { SpotifyAuthService } from './spotify/spotify-auth';
export { SpotifyApiService } from './spotify/spotify-api';
```

- [ ] **Step 6: Commit**

```bash
git add src/app/core/spotify/spotify-api.ts src/app/core/spotify/spotify-api.spec.ts src/app/core/index.ts
git commit -m "feat: add SpotifyApiService for Spotify Web API calls"
```

---

## Chunk 3: Releases Feature — Service, Store, Data Layer

### Task 5: ReleasesService — Supabase CRUD

**Files:**
- Create: `src/app/features/releases/releases-service.ts`
- Create: `src/app/features/releases/releases-service.spec.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/app/features/releases/releases-service.spec.ts
import { TestBed } from '@angular/core/testing';
import { ReleasesService, Release, FeedPreferences } from './releases-service';
import { SupabaseService } from '@core/supabase/supabase';

describe('ReleasesService', () => {
  let service: ReleasesService;
  let mockSupabase: any;

  const mockRelease: Release = {
    spotify_album_id: 'album-1',
    spotify_artist_id: 'artist-1',
    artist_name: 'Test Artist',
    title: 'Test Album',
    release_type: 'album',
    release_date: '2026-03-15',
    image_url: 'https://img.spotify.com/album.jpg',
    spotify_url: 'https://open.spotify.com/album/album-1',
    track_count: 12,
    fetched_at: '2026-03-15T00:00:00Z',
  };

  beforeEach(() => {
    const chainable = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockRelease, error: null }),
      upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
      then: vi.fn(),
    };
    mockSupabase = {
      client: { from: vi.fn().mockReturnValue(chainable) },
      dbSchema: 'angular_starter',
    };

    TestBed.configureTestingModule({
      providers: [{ provide: SupabaseService, useValue: mockSupabase }],
    });
    service = TestBed.inject(ReleasesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --no-watch src/app/features/releases/releases-service.spec.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Write the implementation**

```typescript
// src/app/features/releases/releases-service.ts
import { inject, Injectable } from '@angular/core';
import { SupabaseService } from '@core/supabase/supabase';
import { RealtimeService } from '@core/supabase/realtime';
import { unwrap, unwrapWithCount } from '@core/errors/error-mapper';

export interface Release {
  spotify_album_id: string;
  spotify_artist_id: string;
  artist_name: string;
  title: string;
  release_type: string;
  release_date: string;
  image_url: string | null;
  spotify_url: string;
  track_count: number;
  fetched_at: string;
  dismissed?: boolean;
}

export interface FeedPreferences {
  release_type_filter: string;
  min_track_count: number;
  recency_days: number;
  last_checked_at: string | null;
}

export interface ArtistRow {
  spotify_artist_id: string;
  artist_name: string;
  artist_image_url: string | null;
}

@Injectable({ providedIn: 'root' })
export class ReleasesService {
  private supabase = inject(SupabaseService);
  private realtime = inject(RealtimeService);

  async getFeed(
    userId: string,
    artistIds: string[],
    filters: FeedPreferences,
    page: number,
    pageSize: number,
  ): Promise<{ data: Release[]; count: number }> {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - filters.recency_days);

    let query = this.supabase.client
      .from('releases')
      .select('*', { count: 'exact' })
      .in('spotify_artist_id', artistIds)
      .gte('release_date', sinceDate.toISOString().split('T')[0])
      .order('release_date', { ascending: false })
      .range(from, to);

    if (filters.release_type_filter === 'albums') {
      query = query.eq('release_type', 'album');
    }

    if (filters.min_track_count > 0) {
      query = query.gte('track_count', filters.min_track_count);
    }

    return unwrapWithCount<Release[]>(await query);
  }

  async getPreferences(userId: string): Promise<FeedPreferences> {
    const { data, error } = await this.supabase.client
      .from('user_feed_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code === 'PGRST116') {
      // No row yet — return defaults
      return {
        release_type_filter: 'everything',
        min_track_count: 0,
        recency_days: 90,
        last_checked_at: null,
      };
    }
    if (error) throw error;
    return data;
  }

  async savePreferences(userId: string, prefs: Partial<FeedPreferences>): Promise<void> {
    await unwrap(
      this.supabase.client.from('user_feed_preferences').upsert(
        { user_id: userId, ...prefs },
        { onConflict: 'user_id' },
      ),
    );
  }

  async markAllSeen(userId: string): Promise<void> {
    await this.savePreferences(userId, {
      last_checked_at: new Date().toISOString(),
    });
  }

  async dismissRelease(userId: string, albumId: string): Promise<void> {
    await unwrap(
      this.supabase.client.from('user_release_state').upsert(
        {
          user_id: userId,
          spotify_album_id: albumId,
          dismissed: true,
          dismissed_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,spotify_album_id' },
      ),
    );
  }

  async undismissRelease(userId: string, albumId: string): Promise<void> {
    await unwrap(
      this.supabase.client.from('user_release_state').upsert(
        {
          user_id: userId,
          spotify_album_id: albumId,
          dismissed: false,
          dismissed_at: null,
        },
        { onConflict: 'user_id,spotify_album_id' },
      ),
    );
  }

  async getDismissedIds(userId: string): Promise<Set<string>> {
    const { data } = await unwrap(
      this.supabase.client
        .from('user_release_state')
        .select('spotify_album_id')
        .eq('user_id', userId)
        .eq('dismissed', true),
    );
    return new Set((data as { spotify_album_id: string }[]).map((r) => r.spotify_album_id));
  }

  async getUserArtistIds(userId: string): Promise<string[]> {
    const { data } = await unwrap(
      this.supabase.client
        .from('user_artists')
        .select('spotify_artist_id')
        .eq('user_id', userId),
    );
    return (data as { spotify_artist_id: string }[]).map((r) => r.spotify_artist_id);
  }

  async syncArtists(
    userId: string,
    artists: ArtistRow[],
    source: 'followed' | 'saved',
  ): Promise<void> {
    // Upsert into shared artists table first
    const sharedRows = artists.map((a) => ({
      spotify_artist_id: a.spotify_artist_id,
      artist_name: a.artist_name,
      artist_image_url: a.artist_image_url,
    }));

    // Batch upsert in chunks of 500
    for (let i = 0; i < sharedRows.length; i += 500) {
      await this.supabase.client
        .from('artists')
        .upsert(sharedRows.slice(i, i + 500), { onConflict: 'spotify_artist_id', ignoreDuplicates: true });
    }

    // Upsert into user_artists
    const userRows = artists.map((a) => ({
      user_id: userId,
      spotify_artist_id: a.spotify_artist_id,
      artist_name: a.artist_name,
      artist_image_url: a.artist_image_url,
      source,
      synced_at: new Date().toISOString(),
    }));

    for (let i = 0; i < userRows.length; i += 500) {
      await this.supabase.client
        .from('user_artists')
        .upsert(userRows.slice(i, i + 500), { onConflict: 'user_id,spotify_artist_id' });
    }
  }

  subscribeToNewReleases(
    artistIds: string[],
    callback: (release: Release) => void,
  ): () => void {
    return this.realtime.subscribeToTable<Release>(
      'releases',
      (payload) => {
        if (payload.eventType === 'INSERT' && artistIds.includes(payload.new.spotify_artist_id)) {
          callback(payload.new);
        }
      },
    );
  }

  async triggerOnboardingSync(userId: string): Promise<void> {
    const { error } = await this.supabase.client.functions.invoke('sync-releases', {
      body: { userId },
    });
    if (error) throw error;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- --no-watch src/app/features/releases/releases-service.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/features/releases/releases-service.ts src/app/features/releases/releases-service.spec.ts
git commit -m "feat: add ReleasesService for Supabase CRUD operations"
```

---

### Task 6: ReleasesStore — Signal-Based State

**Files:**
- Create: `src/app/features/releases/releases-store.ts`
- Create: `src/app/features/releases/releases-store.spec.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/app/features/releases/releases-store.spec.ts
import { TestBed } from '@angular/core/testing';
import { ReleasesStore } from './releases-store';

describe('ReleasesStore', () => {
  let store: ReleasesStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(ReleasesStore);
  });

  it('should be created with empty state', () => {
    expect(store.allReleases()).toEqual([]);
    expect(store.isLoading()).toBe(false);
    expect(store.syncProgress().syncing).toBe(false);
  });

  it('should set releases', () => {
    const releases = [
      {
        spotify_album_id: 'a1',
        spotify_artist_id: 'ar1',
        artist_name: 'Artist',
        title: 'Album',
        release_type: 'album',
        release_date: '2026-03-15',
        image_url: null,
        spotify_url: 'https://open.spotify.com/album/a1',
        track_count: 10,
        fetched_at: '2026-03-15T00:00:00Z',
      },
    ];
    store.setReleases(releases, 1);
    expect(store.allReleases()).toHaveLength(1);
    expect(store.totalCount()).toBe(1);
  });

  it('should track dismissed IDs', () => {
    store.setDismissedIds(new Set(['a1', 'a2']));
    expect(store.dismissedIds().has('a1')).toBe(true);
  });

  it('should add a dismissed ID', () => {
    store.setDismissedIds(new Set(['a1']));
    store.addDismissedId('a2');
    expect(store.dismissedIds().has('a2')).toBe(true);
  });

  it('should remove a dismissed ID', () => {
    store.setDismissedIds(new Set(['a1', 'a2']));
    store.removeDismissedId('a1');
    expect(store.dismissedIds().has('a1')).toBe(false);
  });

  it('should update sync progress', () => {
    store.setSyncProgress({ total: 100, checked: 50, syncing: true });
    expect(store.syncProgress().checked).toBe(50);
  });

  it('should clear state', () => {
    store.setReleases([{ spotify_album_id: 'a1' } as any], 1);
    store.clear();
    expect(store.allReleases()).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --no-watch src/app/features/releases/releases-store.spec.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Write the implementation**

```typescript
// src/app/features/releases/releases-store.ts
import { computed, Injectable, signal } from '@angular/core';
import { Release, FeedPreferences } from './releases-service';

export interface SyncProgress {
  total: number;
  checked: number;
  syncing: boolean;
}

@Injectable({ providedIn: 'root' })
export class ReleasesStore {
  private releases = signal<Release[]>([]);
  private loading = signal(false);
  private total = signal(0);
  private dismissed = signal<Set<string>>(new Set());
  private sync = signal<SyncProgress>({ total: 0, checked: 0, syncing: false });
  private preferences = signal<FeedPreferences>({
    release_type_filter: 'everything',
    min_track_count: 0,
    recency_days: 90,
    last_checked_at: null,
  });
  private artistIds = signal<string[]>([]);

  readonly allReleases = this.releases.asReadonly();
  readonly isLoading = this.loading.asReadonly();
  readonly totalCount = this.total.asReadonly();
  readonly dismissedIds = this.dismissed.asReadonly();
  readonly syncProgress = this.sync.asReadonly();
  readonly feedPreferences = this.preferences.asReadonly();
  readonly userArtistIds = this.artistIds.asReadonly();

  readonly isEmpty = computed(() => this.releases().length === 0 && !this.loading());
  readonly isSyncing = computed(() => this.sync().syncing);
  readonly lastCheckedAt = computed(() => this.preferences().last_checked_at);

  setReleases(releases: Release[], total: number): void {
    this.releases.set(releases);
    this.total.set(total);
  }

  appendReleases(releases: Release[], total: number): void {
    this.releases.update((current) => [...current, ...releases]);
    this.total.set(total);
  }

  addRelease(release: Release): void {
    this.releases.update((current) => {
      if (current.some((r) => r.spotify_album_id === release.spotify_album_id)) return current;
      return [release, ...current].sort(
        (a, b) => new Date(b.release_date).getTime() - new Date(a.release_date).getTime(),
      );
    });
    this.total.update((t) => t + 1);
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
    this.sync.set({ total: 0, checked: 0, syncing: false });
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- --no-watch src/app/features/releases/releases-store.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/features/releases/releases-store.ts src/app/features/releases/releases-store.spec.ts
git commit -m "feat: add ReleasesStore for signal-based feed state"
```

---

## Chunk 4: UI Components

### Task 7: ReleaseCardSkeleton

**Files:**
- Create: `src/app/features/releases/release-card-skeleton.ts`

- [ ] **Step 1: Create the skeleton component**

```typescript
// src/app/features/releases/release-card-skeleton.ts
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Skeleton } from '@shared/skeleton/skeleton';

@Component({
  selector: 'app-release-card-skeleton',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Skeleton],
  template: `
    <div class="skeleton-card">
      <app-skeleton width="88px" height="88px" radius="8px" />
      <div class="skeleton-content">
        <app-skeleton width="60%" height="1rem" />
        <app-skeleton width="40%" height="0.75rem" />
        <app-skeleton width="30%" height="0.625rem" />
        <div class="skeleton-actions">
          <app-skeleton width="120px" height="28px" radius="20px" />
          <app-skeleton width="80px" height="28px" radius="20px" />
        </div>
      </div>
    </div>
  `,
  styles: `
    .skeleton-card {
      display: flex;
      gap: 16px;
      padding: 16px;
      border-radius: 12px;
      background: var(--mat-sys-surface-container-high);
    }
    .skeleton-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 6px;
      justify-content: center;
    }
    .skeleton-actions {
      display: flex;
      gap: 8px;
      margin-top: 4px;
    }
  `,
})
export class ReleaseCardSkeleton {}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/features/releases/release-card-skeleton.ts
git commit -m "feat: add ReleaseCardSkeleton component"
```

---

### Task 8: ReleaseCard — Expanded Card

**Files:**
- Create: `src/app/features/releases/release-card.ts`
- Create: `src/app/features/releases/release-card.spec.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/app/features/releases/release-card.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReleaseCard } from './release-card';
import { Release } from './releases-service';

describe('ReleaseCard', () => {
  let component: ReleaseCard;
  let fixture: ComponentFixture<ReleaseCard>;

  const mockRelease: Release = {
    spotify_album_id: 'album-1',
    spotify_artist_id: 'artist-1',
    artist_name: 'Test Artist',
    title: 'Test Album',
    release_type: 'album',
    release_date: '2026-03-15',
    image_url: 'https://img.spotify.com/album.jpg',
    spotify_url: 'https://open.spotify.com/album/album-1',
    track_count: 12,
    fetched_at: '2026-03-15T00:00:00Z',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReleaseCard],
    }).compileComponents();

    fixture = TestBed.createComponent(ReleaseCard);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('release', mockRelease);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit dismiss event', () => {
    const spy = vi.spyOn(component.dismiss, 'emit');
    component.onDismiss();
    expect(spy).toHaveBeenCalledWith('album-1');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --no-watch src/app/features/releases/release-card.spec.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Write the implementation**

```typescript
// src/app/features/releases/release-card.ts
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Release } from './releases-service';

@Component({
  selector: 'app-release-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe],
  template: `
    <div class="release-card">
      <div class="album-art">
        @if (release().image_url) {
          <img [src]="release().image_url" [alt]="release().title + ' album art'" />
        }
        <span class="track-badge">{{ release().track_count }} tracks</span>
      </div>
      <div class="card-content">
        <h3 class="title">{{ release().title }}</h3>
        <p class="artist">{{ release().artist_name }}</p>
        <p class="meta">
          {{ release().release_type === 'album' ? 'Album' : 'Single' }} · {{ release().release_date | date: 'MMM d, y' }}
        </p>
        <div class="actions">
          <a class="btn-spotify" [href]="release().spotify_url" target="_blank" rel="noopener">
            Open in Spotify
          </a>
          <button class="btn-dismiss" (click)="onDismiss()">Dismiss</button>
        </div>
      </div>
    </div>
  `,
  styles: `
    .release-card {
      display: flex;
      gap: 16px;
      padding: 16px;
      border-radius: 12px;
      background: var(--mat-sys-surface-container-high);
    }
    .album-art {
      width: 88px;
      height: 88px;
      border-radius: 8px;
      overflow: hidden;
      flex-shrink: 0;
      position: relative;
      background: var(--mat-sys-surface-container);
    }
    .album-art img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .track-badge {
      position: absolute;
      bottom: 4px;
      right: 4px;
      font-size: 0.625rem;
      background: rgba(0, 0, 0, 0.6);
      padding: 2px 5px;
      border-radius: 4px;
      color: #fff;
    }
    .card-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      min-width: 0;
    }
    .title {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 0.9375rem;
      font-weight: 700;
      color: var(--mat-sys-on-surface);
      letter-spacing: -0.3px;
      margin: 0;
    }
    .artist {
      font-size: 0.75rem;
      color: var(--mat-sys-on-surface-variant);
      margin: 2px 0 0;
    }
    .meta {
      font-size: 0.625rem;
      color: var(--mat-sys-outline);
      margin: 4px 0 0;
    }
    .actions {
      display: flex;
      gap: 8px;
      margin-top: 10px;
    }
    .btn-spotify {
      padding: 5px 16px;
      border-radius: 20px;
      background: linear-gradient(135deg, var(--mat-sys-primary-dim, #8455ef), var(--mat-sys-primary));
      color: var(--mat-sys-on-primary);
      font-size: 0.6875rem;
      font-weight: 600;
      text-decoration: none;
      cursor: pointer;
    }
    .btn-dismiss {
      padding: 5px 12px;
      border-radius: 20px;
      background: var(--mat-sys-surface-container);
      color: var(--mat-sys-on-surface-variant);
      font-size: 0.6875rem;
      border: none;
      cursor: pointer;
    }
  `,
})
export class ReleaseCard {
  release = input.required<Release>();
  dismiss = output<string>();

  onDismiss(): void {
    this.dismiss.emit(this.release().spotify_album_id);
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- --no-watch src/app/features/releases/release-card.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/features/releases/release-card.ts src/app/features/releases/release-card.spec.ts
git commit -m "feat: add ReleaseCard expanded card component"
```

---

### Task 9: ReleaseCardCollapsed — Dismissed Slim Row

**Files:**
- Create: `src/app/features/releases/release-card-collapsed.ts`
- Create: `src/app/features/releases/release-card-collapsed.spec.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/app/features/releases/release-card-collapsed.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReleaseCardCollapsed } from './release-card-collapsed';

describe('ReleaseCardCollapsed', () => {
  let component: ReleaseCardCollapsed;
  let fixture: ComponentFixture<ReleaseCardCollapsed>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReleaseCardCollapsed],
    }).compileComponents();

    fixture = TestBed.createComponent(ReleaseCardCollapsed);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('release', {
      spotify_album_id: 'album-1',
      title: 'Test',
      artist_name: 'Artist',
      release_type: 'album',
      release_date: '2026-03-15',
      image_url: null,
      spotify_url: '',
      track_count: 10,
      spotify_artist_id: 'a1',
      fetched_at: '',
    });
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit expand event on click', () => {
    const spy = vi.spyOn(component.expand, 'emit');
    component.onExpand();
    expect(spy).toHaveBeenCalledWith('album-1');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --no-watch src/app/features/releases/release-card-collapsed.spec.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Write the implementation**

```typescript
// src/app/features/releases/release-card-collapsed.ts
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Release } from './releases-service';

@Component({
  selector: 'app-release-card-collapsed',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe],
  template: `
    <button class="collapsed-card" (click)="onExpand()">
      <div class="collapsed-art">
        @if (release().image_url) {
          <img [src]="release().image_url" [alt]="release().title" />
        }
      </div>
      <span class="collapsed-title">{{ release().title }}</span>
      <span class="collapsed-artist">{{ release().artist_name }}</span>
      <span class="collapsed-meta">
        {{ release().release_type === 'album' ? 'Album' : 'Single' }} · {{ release().release_date | date: 'MMM d' }}
      </span>
    </button>
  `,
  styles: `
    .collapsed-card {
      display: flex;
      align-items: center;
      gap: 10px;
      width: 100%;
      padding: 10px 14px;
      border-radius: 10px;
      background: var(--mat-sys-surface-container);
      opacity: 0.6;
      cursor: pointer;
      border: none;
      text-align: left;
      color: inherit;
      font: inherit;
    }
    .collapsed-card:hover {
      opacity: 0.8;
    }
    .collapsed-art {
      width: 36px;
      height: 36px;
      border-radius: 6px;
      overflow: hidden;
      flex-shrink: 0;
      background: var(--mat-sys-surface-container-high);
    }
    .collapsed-art img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .collapsed-title {
      font-size: 0.75rem;
      color: var(--mat-sys-on-surface-variant);
      flex: 1;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .collapsed-artist {
      font-size: 0.6875rem;
      color: var(--mat-sys-outline);
    }
    .collapsed-meta {
      font-size: 0.625rem;
      color: var(--mat-sys-outline-variant);
      flex-shrink: 0;
    }
  `,
})
export class ReleaseCardCollapsed {
  release = input.required<Release>();
  expand = output<string>();

  onExpand(): void {
    this.expand.emit(this.release().spotify_album_id);
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- --no-watch src/app/features/releases/release-card-collapsed.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/features/releases/release-card-collapsed.ts src/app/features/releases/release-card-collapsed.spec.ts
git commit -m "feat: add ReleaseCardCollapsed slim row component"
```

---

### Task 10: FeedFilterBar

**Files:**
- Create: `src/app/features/releases/feed-filter-bar.ts`
- Create: `src/app/features/releases/feed-filter-bar.spec.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/app/features/releases/feed-filter-bar.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FeedFilterBar } from './feed-filter-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('FeedFilterBar', () => {
  let component: FeedFilterBar;
  let fixture: ComponentFixture<FeedFilterBar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FeedFilterBar, NoopAnimationsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(FeedFilterBar);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('releaseTypeFilter', 'everything');
    fixture.componentRef.setInput('minTrackCount', 0);
    fixture.componentRef.setInput('recencyDays', 90);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit filter changes', () => {
    const spy = vi.spyOn(component.releaseTypeChange, 'emit');
    component.onReleaseTypeChange('albums');
    expect(spy).toHaveBeenCalledWith('albums');
  });

  it('should emit mark all seen', () => {
    const spy = vi.spyOn(component.markAllSeen, 'emit');
    component.onMarkAllSeen();
    expect(spy).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --no-watch src/app/features/releases/feed-filter-bar.spec.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Write the implementation**

```typescript
// src/app/features/releases/feed-filter-bar.ts
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-feed-filter-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonToggleModule, MatSelectModule, MatButtonModule, MatIconModule],
  template: `
    <div class="filter-bar">
      <h2 class="filter-title">New Releases</h2>

      <div class="filter-controls">
        <div class="filter-group">
          <span class="filter-label">Type</span>
          <mat-button-toggle-group
            [value]="releaseTypeFilter()"
            (change)="onReleaseTypeChange($event.value)"
            hideSingleSelectionIndicator
          >
            <mat-button-toggle value="everything">Everything</mat-button-toggle>
            <mat-button-toggle value="albums">Albums</mat-button-toggle>
          </mat-button-toggle-group>
        </div>

        <div class="filter-group">
          <span class="filter-label">Min tracks</span>
          <mat-select [value]="minTrackCount()" (selectionChange)="onMinTrackChange($event.value)">
            <mat-option [value]="0">No minimum</mat-option>
            <mat-option [value]="3">3+</mat-option>
            <mat-option [value]="5">5+</mat-option>
            <mat-option [value]="8">8+</mat-option>
          </mat-select>
        </div>

        <div class="filter-group">
          <span class="filter-label">Since</span>
          <mat-select [value]="recencyDays()" (selectionChange)="onRecencyChange($event.value)">
            <mat-option [value]="30">Last 30 days</mat-option>
            <mat-option [value]="90">Last 90 days</mat-option>
            <mat-option [value]="180">Last 6 months</mat-option>
            <mat-option [value]="365">Last year</mat-option>
          </mat-select>
        </div>

        <button mat-button class="btn-mark-seen" (click)="onMarkAllSeen()">
          <mat-icon>check</mat-icon>
          Mark all seen
        </button>
      </div>
    </div>
  `,
  styles: `
    .filter-bar {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px 24px;
      background: var(--mat-sys-surface-container);
      flex-wrap: wrap;
    }
    .filter-title {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--mat-sys-on-surface);
      letter-spacing: -0.5px;
      margin: 0 auto 0 0;
    }
    .filter-controls {
      display: flex;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
    }
    .filter-group {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .filter-label {
      font-size: 0.625rem;
      color: var(--mat-sys-outline);
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .btn-mark-seen {
      font-size: 0.6875rem;
    }
    mat-select {
      width: 140px;
    }
  `,
})
export class FeedFilterBar {
  releaseTypeFilter = input.required<string>();
  minTrackCount = input.required<number>();
  recencyDays = input.required<number>();

  releaseTypeChange = output<string>();
  minTrackChange = output<number>();
  recencyChange = output<number>();
  markAllSeen = output<void>();

  onReleaseTypeChange(value: string): void {
    this.releaseTypeChange.emit(value);
  }

  onMinTrackChange(value: number): void {
    this.minTrackChange.emit(value);
  }

  onRecencyChange(value: number): void {
    this.recencyChange.emit(value);
  }

  onMarkAllSeen(): void {
    this.markAllSeen.emit();
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- --no-watch src/app/features/releases/feed-filter-bar.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/features/releases/feed-filter-bar.ts src/app/features/releases/feed-filter-bar.spec.ts
git commit -m "feat: add FeedFilterBar component with type, track count, and recency filters"
```

---

### Task 11: SyncIndicator

**Files:**
- Create: `src/app/features/releases/sync-indicator.ts`

- [ ] **Step 1: Create the component**

```typescript
// src/app/features/releases/sync-indicator.ts
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { SyncProgress } from './releases-store';

@Component({
  selector: 'app-sync-indicator',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecimalPipe, MatProgressBarModule],
  template: `
    @if (progress().syncing) {
      <div class="sync-bar">
        <span class="sync-text">
          Syncing your library... {{ progress().checked | number }} of {{ progress().total | number }} artists checked
        </span>
        <mat-progress-bar
          mode="determinate"
          [value]="progress().total ? (progress().checked / progress().total) * 100 : 0"
        />
      </div>
    }
  `,
  styles: `
    .sync-bar {
      padding: 8px 24px;
      background: var(--mat-sys-surface-container);
    }
    .sync-text {
      font-size: 0.6875rem;
      color: var(--mat-sys-on-surface-variant);
    }
  `,
})
export class SyncIndicator {
  progress = input.required<SyncProgress>();
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/features/releases/sync-indicator.ts
git commit -m "feat: add SyncIndicator component for onboarding progress"
```

---

## Chunk 5: Page Component and Routing

### Task 12: ReleasesFeed — Page Component

**Files:**
- Create: `src/app/features/releases/releases-feed/releases-feed.ts`
- Create: `src/app/features/releases/releases-feed/releases-feed.spec.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/app/features/releases/releases-feed/releases-feed.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReleasesFeed } from './releases-feed';
import { ReleasesService } from '../releases-service';
import { ReleasesStore } from '../releases-store';
import { SpotifyApiService } from '@core/spotify/spotify-api';
import { SpotifyAuthService } from '@core/spotify/spotify-auth';
import { AuthService } from '@core/auth/auth';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('ReleasesFeed', () => {
  let component: ReleasesFeed;
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
          },
        },
        {
          provide: SpotifyApiService,
          useValue: {},
        },
        {
          provide: SpotifyAuthService,
          useValue: {},
        },
        {
          provide: AuthService,
          useValue: { currentUser: vi.fn(() => ({ id: 'user-1' })) },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ReleasesFeed);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --no-watch src/app/features/releases/releases-feed/releases-feed.spec.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Write the implementation**

```typescript
// src/app/features/releases/releases-feed/releases-feed.ts
import { AfterViewInit, ChangeDetectionStrategy, Component, computed, effect, ElementRef, inject, OnDestroy, OnInit, signal, viewChild } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ReleasesService, Release } from '../releases-service';
import { ReleasesStore } from '../releases-store';
import { AuthService } from '@core/auth/auth';
import { ToastService } from '@shared/toast';
import { extractErrorMessage } from '@core/errors/extract-error-message';
import { ReleaseCard } from '../release-card';
import { ReleaseCardCollapsed } from '../release-card-collapsed';
import { ReleaseCardSkeleton } from '../release-card-skeleton';
import { FeedFilterBar } from '../feed-filter-bar';
import { SyncIndicator } from '../sync-indicator';
import { EmptyState } from '@shared/empty-state/empty-state';

const PAGE_SIZE = 20;

@Component({
  selector: 'app-releases-feed',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    ReleaseCard,
    ReleaseCardCollapsed,
    ReleaseCardSkeleton,
    FeedFilterBar,
    SyncIndicator,
    EmptyState,
  ],
  template: `
    <app-feed-filter-bar
      [releaseTypeFilter]="store.feedPreferences().release_type_filter"
      [minTrackCount]="store.feedPreferences().min_track_count"
      [recencyDays]="store.feedPreferences().recency_days"
      (releaseTypeChange)="onFilterChange('release_type_filter', $event)"
      (minTrackChange)="onFilterChange('min_track_count', $event)"
      (recencyChange)="onFilterChange('recency_days', $event)"
      (markAllSeen)="onMarkAllSeen()"
    />

    <app-sync-indicator [progress]="store.syncProgress()" />

    <div class="feed-container">
      @if (store.isLoading() && store.allReleases().length === 0) {
        @for (i of skeletons; track i) {
          <app-release-card-skeleton />
        }
      } @else if (store.isEmpty() && !store.isSyncing()) {
        <app-empty-state
          icon="album"
          title="No releases found"
          description="Try adjusting your filters or check back later."
        />
      } @else {
        @if (newReleases().length > 0) {
          <div class="feed-divider new">
            <span class="divider-text">{{ newReleases().length }} new since {{ store.lastCheckedAt() | date: 'MMM d' }}</span>
            <div class="divider-line"></div>
          </div>
        }

        @for (release of newReleases(); track release.spotify_album_id) {
          @if (store.dismissedIds().has(release.spotify_album_id)) {
            <app-release-card-collapsed
              [release]="release"
              (expand)="onUndismiss($event)"
            />
          } @else {
            <app-release-card
              [release]="release"
              (dismiss)="onDismiss($event)"
            />
          }
        }

        @if (seenReleases().length > 0 && newReleases().length > 0) {
          <div class="feed-divider seen">
            <span class="divider-text">Previously seen</span>
            <div class="divider-line"></div>
          </div>
        }

        @for (release of seenReleases(); track release.spotify_album_id) {
          @if (store.dismissedIds().has(release.spotify_album_id)) {
            <app-release-card-collapsed
              [release]="release"
              (expand)="onUndismiss($event)"
            />
          } @else {
            <app-release-card
              [release]="release"
              (dismiss)="onDismiss($event)"
            />
          }
        }

        @if (hasMore()) {
          <div class="scroll-sentinel" #scrollSentinel></div>
        }
      }
    </div>
  `,
  styles: `
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
      padding: 8px 0;
    }
    .feed-divider.new .divider-text {
      font-size: 0.625rem;
      color: var(--mat-sys-secondary);
      text-transform: uppercase;
      letter-spacing: 1.5px;
      font-weight: 600;
      white-space: nowrap;
    }
    .feed-divider.new .divider-line {
      flex: 1;
      height: 1px;
      background: var(--mat-sys-secondary);
      opacity: 0.2;
    }
    .feed-divider.seen .divider-text {
      font-size: 0.625rem;
      color: var(--mat-sys-outline);
      text-transform: uppercase;
      letter-spacing: 1.5px;
      white-space: nowrap;
    }
    .feed-divider.seen .divider-line {
      flex: 1;
      height: 1px;
      background: var(--mat-sys-outline-variant);
      opacity: 0.15;
    }
    .scroll-sentinel {
      height: 1px;
    }
  `,
})
export class ReleasesFeed implements OnInit, OnDestroy, AfterViewInit {
  private releasesService = inject(ReleasesService);
  protected store = inject(ReleasesStore);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private unsubscribeRealtime: (() => void) | null = null;
  private currentPage = signal(1);
  private observer: IntersectionObserver | null = null;
  private scrollSentinel = viewChild<ElementRef>('scrollSentinel');

  protected skeletons = [1, 2, 3, 4, 5, 6];

  protected newReleases = computed(() => {
    const lastChecked = this.store.lastCheckedAt();
    if (!lastChecked) return this.store.allReleases();
    return this.store.allReleases().filter(
      (r) => new Date(r.release_date) > new Date(lastChecked),
    );
  });

  protected seenReleases = computed(() => {
    const lastChecked = this.store.lastCheckedAt();
    if (!lastChecked) return [];
    return this.store.allReleases().filter(
      (r) => new Date(r.release_date) <= new Date(lastChecked),
    );
  });

  protected hasMore = computed(() => {
    return this.store.allReleases().length < this.store.totalCount();
  });

  async ngOnInit(): Promise<void> {
    const userId = this.auth.currentUser()?.id;
    if (!userId) return;

    this.store.setLoading(true);
    try {
      const [prefs, dismissedIds, artistIds] = await Promise.all([
        this.releasesService.getPreferences(userId),
        this.releasesService.getDismissedIds(userId),
        this.releasesService.getUserArtistIds(userId),
      ]);

      this.store.setPreferences(prefs);
      this.store.setDismissedIds(dismissedIds);
      this.store.setArtistIds(artistIds);

      if (artistIds.length > 0) {
        const { data, count } = await this.releasesService.getFeed(
          userId,
          artistIds,
          prefs,
          1,
          PAGE_SIZE,
        );
        this.store.setReleases(data, count);

        // Subscribe to Realtime for live updates during sync
        this.unsubscribeRealtime = this.releasesService.subscribeToNewReleases(
          artistIds,
          (release) => this.store.addRelease(release),
        );
      }
    } catch (err) {
      this.toast.error(extractErrorMessage(err, 'Failed to load releases'));
    } finally {
      this.store.setLoading(false);
    }
  }

  ngAfterViewInit(): void {
    this.setupInfiniteScroll();
  }

  ngOnDestroy(): void {
    this.unsubscribeRealtime?.();
    this.observer?.disconnect();
  }

  private setupInfiniteScroll(): void {
    this.observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting && this.hasMore() && !this.store.isLoading()) {
        this.loadMore();
      }
    });

    // Re-observe whenever the sentinel element appears in the DOM
    effect(() => {
      const el = this.scrollSentinel();
      if (el) {
        this.observer?.observe(el.nativeElement);
      }
    });
  }

  async onFilterChange(key: string, value: string | number): Promise<void> {
    const userId = this.auth.currentUser()?.id;
    if (!userId) return;

    const updatedPrefs = { ...this.store.feedPreferences(), [key]: value };
    this.store.setPreferences(updatedPrefs);
    await this.releasesService.savePreferences(userId, { [key]: value });

    this.currentPage.set(1);
    await this.loadFeed();
  }

  async onMarkAllSeen(): Promise<void> {
    const userId = this.auth.currentUser()?.id;
    if (!userId) return;

    await this.releasesService.markAllSeen(userId);
    this.store.setPreferences({
      ...this.store.feedPreferences(),
      last_checked_at: new Date().toISOString(),
    });
    this.toast.success('Marked all as seen');
  }

  async onDismiss(albumId: string): Promise<void> {
    const userId = this.auth.currentUser()?.id;
    if (!userId) return;

    this.store.addDismissedId(albumId);
    await this.releasesService.dismissRelease(userId, albumId);
  }

  async onUndismiss(albumId: string): Promise<void> {
    const userId = this.auth.currentUser()?.id;
    if (!userId) return;

    this.store.removeDismissedId(albumId);
    await this.releasesService.undismissRelease(userId, albumId);
  }

  async loadMore(): Promise<void> {
    const userId = this.auth.currentUser()?.id;
    if (!userId) return;

    this.currentPage.update((p) => p + 1);
    const { data, count } = await this.releasesService.getFeed(
      userId,
      this.store.userArtistIds(),
      this.store.feedPreferences(),
      this.currentPage(),
      PAGE_SIZE,
    );
    this.store.appendReleases(data, count);
  }

  private async loadFeed(): Promise<void> {
    const userId = this.auth.currentUser()?.id;
    if (!userId) return;

    this.store.setLoading(true);
    try {
      const { data, count } = await this.releasesService.getFeed(
        userId,
        this.store.userArtistIds(),
        this.store.feedPreferences(),
        1,
        PAGE_SIZE,
      );
      this.store.setReleases(data, count);
    } catch (err) {
      this.toast.error(extractErrorMessage(err, 'Failed to load releases'));
    } finally {
      this.store.setLoading(false);
    }
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- --no-watch src/app/features/releases/releases-feed/releases-feed.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/features/releases/releases-feed/releases-feed.ts src/app/features/releases/releases-feed/releases-feed.spec.ts
git commit -m "feat: add ReleasesFeed page component with filtering and infinite scroll"
```

---

### Task 13: Add Route and Sidenav Entry

**Files:**
- Modify: `src/app/app.routes.ts`
- Modify: `src/app/layouts/shell/shell.html`

- [ ] **Step 1: Add route to app.routes.ts**

Add the releases route inside the Shell children array, after the dashboard route:

```typescript
{
  path: 'releases',
  data: { title: 'New Releases' },
  loadComponent: () =>
    import('./features/releases/releases-feed/releases-feed').then((m) => m.ReleasesFeed),
  canActivate: [featureFlagGuard('releases')],
},
```

- [ ] **Step 2: Add sidenav entry to shell.html**

Add after the dashboard nav item and before the notes nav item:

```html
@if (featureFlags.isEnabled('releases')) {
  <a
    mat-list-item
    routerLink="/releases"
    routerLinkActive="active-link"
    #rlaReleases="routerLinkActive"
    [attr.aria-current]="rlaReleases.isActive ? 'page' : null"
  >
    <mat-icon matListItemIcon>album</mat-icon>
    <span matListItemTitle>New Releases</span>
  </a>
}
```

- [ ] **Step 3: Verify the app compiles**

Run: `npm start` — verify no compilation errors, the new route loads at `/releases`, and the sidenav shows "New Releases".

- [ ] **Step 4: Commit**

```bash
git add src/app/app.routes.ts src/app/layouts/shell/shell.html
git commit -m "feat: add releases route and sidenav navigation entry"
```

---

## Chunk 6: Edge Functions

### Task 14: sync-releases Edge Function (Onboarding)

**Files:**
- Create: `supabase/functions/sync-releases/index.ts`

- [ ] **Step 1: Create the Edge Function**

```typescript
// supabase/functions/sync-releases/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SPOTIFY_API = 'https://api.spotify.com/v1';
const BATCH_SIZE = 10;

interface ArtistRow {
  spotify_artist_id: string;
}

Deno.serve(async (req) => {
  try {
    const { userId } = await req.json();
    if (!userId) {
      return new Response(JSON.stringify({ error: 'userId required' }), { status: 400 });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Get user's Spotify token
    const { data: tokenRow, error: tokenError } = await supabase
      .schema('angular_starter')
      .from('user_spotify_tokens')
      .select('access_token, refresh_token, expires_at')
      .eq('user_id', userId)
      .single();

    if (tokenError || !tokenRow) {
      return new Response(JSON.stringify({ error: 'No Spotify token found' }), { status: 400 });
    }

    let accessToken = tokenRow.access_token;

    // Refresh token if expired
    if (new Date(tokenRow.expires_at) < new Date()) {
      const refreshResp = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: tokenRow.refresh_token,
        }),
      });

      if (!refreshResp.ok) {
        return new Response(JSON.stringify({ error: 'Token refresh failed' }), { status: 401 });
      }

      const refreshData = await refreshResp.json();
      accessToken = refreshData.access_token;

      await supabase.schema('angular_starter').from('user_spotify_tokens').update({
        access_token: accessToken,
        expires_at: new Date(Date.now() + refreshData.expires_in * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      }).eq('user_id', userId);
    }

    // Get user's artist IDs
    const { data: artistRows } = await supabase
      .schema('angular_starter')
      .from('user_artists')
      .select('spotify_artist_id')
      .eq('user_id', userId);

    if (!artistRows || artistRows.length === 0) {
      return new Response(JSON.stringify({ message: 'No artists to sync' }));
    }

    // Skip artists already checked in last 24h
    const { data: recentlyChecked } = await supabase
      .schema('angular_starter')
      .from('artists')
      .select('spotify_artist_id')
      .gt('last_release_check', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    const recentIds = new Set((recentlyChecked ?? []).map((r: ArtistRow) => r.spotify_artist_id));
    const artistsToCheck = artistRows.filter((r: ArtistRow) => !recentIds.has(r.spotify_artist_id));

    let checked = 0;
    const total = artistsToCheck.length;

    // Process in batches
    for (let i = 0; i < artistsToCheck.length; i += BATCH_SIZE) {
      const batch = artistsToCheck.slice(i, i + BATCH_SIZE);

      const results = await Promise.allSettled(
        batch.map(async (row: ArtistRow) => {
          const url = `${SPOTIFY_API}/artists/${row.spotify_artist_id}/albums?include_groups=album,single&limit=5`;
          const resp = await fetch(url, {
            headers: { Authorization: `Bearer ${accessToken}` },
          });

          if (resp.status === 429) {
            const retryAfter = parseInt(resp.headers.get('Retry-After') || '5', 10);
            await new Promise((r) => setTimeout(r, retryAfter * 1000));
            const retryResp = await fetch(url, {
              headers: { Authorization: `Bearer ${accessToken}` },
            });
            if (!retryResp.ok) return [];
            const retryData = await retryResp.json();
            return retryData.items;
          }

          if (!resp.ok) return [];
          const data = await resp.json();
          return data.items;
        }),
      );

      const releases = results
        .filter((r): r is PromiseFulfilledResult<any[]> => r.status === 'fulfilled')
        .flatMap((r) => r.value)
        .filter(Boolean)
        .map((album: any) => ({
          spotify_album_id: album.id,
          spotify_artist_id: album.artists[0]?.id ?? '',
          artist_name: album.artists[0]?.name ?? 'Unknown',
          title: album.name,
          release_type: album.album_type === 'album' ? 'album' : 'single',
          release_date: album.release_date,
          image_url: album.images?.[0]?.url ?? null,
          spotify_url: album.external_urls?.spotify ?? '',
          track_count: album.total_tracks ?? 0,
          fetched_at: new Date().toISOString(),
        }));

      // Upsert releases
      if (releases.length > 0) {
        await supabase
          .schema('angular_starter')
          .from('releases')
          .upsert(releases, { onConflict: 'spotify_album_id' });
      }

      // Update last_release_check on shared artists table
      const checkedIds = batch.map((r: ArtistRow) => r.spotify_artist_id);
      await supabase
        .schema('angular_starter')
        .from('artists')
        .update({ last_release_check: new Date().toISOString() })
        .in('spotify_artist_id', checkedIds);

      checked += batch.length;
    }

    return new Response(JSON.stringify({ total, checked, releases: 'synced' }));
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500 });
  }
});
```

- [ ] **Step 2: Commit**

```bash
git add supabase/functions/sync-releases/index.ts
git commit -m "feat: add sync-releases Edge Function for onboarding sync"
```

---

### Task 15: refresh-releases Edge Function (Scheduled)

**Files:**
- Create: `supabase/functions/refresh-releases/index.ts`

- [ ] **Step 1: Create the Edge Function**

```typescript
// supabase/functions/refresh-releases/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SPOTIFY_API = 'https://api.spotify.com/v1';
const BATCH_LIMIT = 200;

Deno.serve(async () => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Get stale artists (oldest last_release_check)
    const { data: staleArtists } = await supabase
      .schema('angular_starter')
      .from('artists')
      .select('spotify_artist_id')
      .order('last_release_check', { ascending: true, nullsFirst: true })
      .limit(BATCH_LIMIT);

    if (!staleArtists || staleArtists.length === 0) {
      return new Response(JSON.stringify({ message: 'No artists to refresh' }));
    }

    // For each artist, find a valid token from any user who follows them
    // Get a valid token — pick the user with the freshest token
    const { data: tokenRow } = await supabase
      .schema('angular_starter')
      .from('user_spotify_tokens')
      .select('user_id, access_token, refresh_token, expires_at')
      .order('expires_at', { ascending: false })
      .limit(1)
      .single();

    if (!tokenRow) {
      return new Response(JSON.stringify({ message: 'No valid tokens available' }));
    }

    let accessToken = tokenRow.access_token;

    // Refresh if expired
    if (new Date(tokenRow.expires_at) < new Date()) {
      const refreshResp = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: tokenRow.refresh_token,
        }),
      });

      if (!refreshResp.ok) {
        return new Response(JSON.stringify({ error: 'Token refresh failed' }), { status: 401 });
      }

      const refreshData = await refreshResp.json();
      accessToken = refreshData.access_token;

      await supabase.schema('angular_starter').from('user_spotify_tokens').update({
        access_token: accessToken,
        expires_at: new Date(Date.now() + refreshData.expires_in * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      }).eq('user_id', tokenRow.user_id);
    }

    // Process in concurrent batches of 10
    const CONCURRENT = 10;
    let checked = 0;

    for (let i = 0; i < staleArtists.length; i += CONCURRENT) {
      const batch = staleArtists.slice(i, i + CONCURRENT);

      const results = await Promise.allSettled(
        batch.map(async (artist: any) => {
          const url = `${SPOTIFY_API}/artists/${artist.spotify_artist_id}/albums?include_groups=album,single&limit=1`;
          const resp = await fetch(url, {
            headers: { Authorization: `Bearer ${accessToken}` },
          });

          if (resp.status === 429) {
            const retryAfter = parseInt(resp.headers.get('Retry-After') || '5', 10);
            await new Promise((r) => setTimeout(r, retryAfter * 1000));
            return null;
          }

          if (!resp.ok) return null;
          const data = await resp.json();
          return { artistId: artist.spotify_artist_id, items: data.items ?? [] };
        }),
      );

      const releases = results
        .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled' && r.value !== null)
        .flatMap((r) => r.value.items)
        .filter(Boolean)
        .map((album: any) => ({
          spotify_album_id: album.id,
          spotify_artist_id: album.artists[0]?.id ?? '',
          artist_name: album.artists[0]?.name ?? 'Unknown',
          title: album.name,
          release_type: album.album_type === 'album' ? 'album' : 'single',
          release_date: album.release_date,
          image_url: album.images?.[0]?.url ?? null,
          spotify_url: album.external_urls?.spotify ?? '',
          track_count: album.total_tracks ?? 0,
          fetched_at: new Date().toISOString(),
        }));

      if (releases.length > 0) {
        await supabase.schema('angular_starter').from('releases')
          .upsert(releases, { onConflict: 'spotify_album_id' });
      }

      // Update last_release_check for all artists in this batch
      const batchIds = batch.map((a: any) => a.spotify_artist_id);
      await supabase.schema('angular_starter').from('artists')
        .update({ last_release_check: new Date().toISOString() })
        .in('spotify_artist_id', batchIds);

      checked += batch.length;
    }

    return new Response(JSON.stringify({ checked, total: staleArtists.length }));
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500 });
  }
});
```

- [ ] **Step 2: Commit**

```bash
git add supabase/functions/refresh-releases/index.ts
git commit -m "feat: add refresh-releases Edge Function for scheduled sync"
```

---

## Chunk 7: Integration and Wiring

### Task 16: Capture Spotify Tokens After OAuth Login

**Files:**
- Modify: `src/app/core/auth/auth.ts`

- [ ] **Step 1: Add token capture to auth state change handler**

In the `onAuthStateChange` callback in `AuthService`, after `this.currentUser.set(session?.user ?? null)`, add:

```typescript
// Capture Spotify tokens when user signs in via Spotify OAuth
if (event === 'SIGNED_IN' && session?.user) {
  const spotifyAuth = inject(SpotifyAuthService);
  spotifyAuth.captureTokensFromSession(session.user.id);
}
```

Note: Since `inject()` can't be called inside a callback, instead inject `SpotifyAuthService` at the class level and call it in the handler:

Add to class fields:
```typescript
private spotifyAuth = inject(SpotifyAuthService);
```

Add inside the `onAuthStateChange` callback, after setting `currentUser`:
```typescript
if (event === 'SIGNED_IN' && session?.user) {
  this.spotifyAuth.captureTokensFromSession(session.user.id);
}
```

- [ ] **Step 2: Verify the app compiles**

Run: `npm start` — verify no compilation errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/core/auth/auth.ts
git commit -m "feat: capture Spotify OAuth tokens on sign-in for Edge Function use"
```

---

### Task 17: First-Visit Onboarding Flow

**Files:**
- Modify: `src/app/features/releases/releases-feed/releases-feed.ts`

- [ ] **Step 1: Add onboarding detection and sync to ReleasesFeed.ngOnInit**

After loading `artistIds` in `ngOnInit`, add a check for empty artist list. If empty, this is a first visit — sync artists from Spotify and trigger the Edge Function:

```typescript
if (artistIds.length === 0) {
  // First visit — sync artist list from Spotify
  const spotifyApi = inject(SpotifyApiService);

  this.store.setSyncProgress({ total: 0, checked: 0, syncing: true });

  try {
    // Fetch followed artists + saved album artists in parallel
    const [followedArtists, savedArtists] = await Promise.all([
      spotifyApi.getFollowedArtists(),
      spotifyApi.getSavedAlbumArtists(),
    ]);

    // Convert to ArtistRow format and sync to Supabase
    const followedRows = followedArtists.map((a) => ({
      spotify_artist_id: a.id,
      artist_name: a.name,
      artist_image_url: a.images[0]?.url ?? null,
    }));
    const savedRows = savedArtists.map((a) => ({
      spotify_artist_id: a.id,
      artist_name: a.name,
      artist_image_url: a.images[0]?.url ?? null,
    }));

    await this.releasesService.syncArtists(userId, followedRows, 'followed');
    await this.releasesService.syncArtists(userId, savedRows, 'saved');

    // Reload artist IDs
    artistIds = await this.releasesService.getUserArtistIds(userId);
    this.store.setArtistIds(artistIds);

    this.store.setSyncProgress({ total: artistIds.length, checked: 0, syncing: true });

    // Subscribe to Realtime before triggering sync so we see results live
    this.unsubscribeRealtime = this.releasesService.subscribeToNewReleases(
      artistIds,
      (release) => this.store.addRelease(release),
    );

    // Trigger the onboarding Edge Function
    await this.releasesService.triggerOnboardingSync(userId);
  } catch (err) {
    this.toast.error(extractErrorMessage(err, 'Failed to sync your Spotify library'));
    this.store.setSyncProgress({ total: 0, checked: 0, syncing: false });
  }
  return;
}
```

Note: `inject(SpotifyApiService)` should be moved to a class field: `private spotifyApi = inject(SpotifyApiService);` and referenced as `this.spotifyApi` in the method. Also add the import for `SpotifyApiService`.

- [ ] **Step 2: Verify the app compiles**

Run: `npm start` — verify no compilation errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/features/releases/releases-feed/releases-feed.ts
git commit -m "feat: add first-visit onboarding flow for artist sync and release fetching"
```

---

### Task 18: Run All Tests and Lint

- [ ] **Step 1: Run unit tests**

Run: `npm test -- --no-watch`
Expected: All tests PASS

- [ ] **Step 2: Run lint**

Run: `npm run lint`
Expected: No errors

- [ ] **Step 3: Run format check**

Run: `npm run format:check`
Expected: All files formatted (run `npm run format` if needed)

- [ ] **Step 4: Run build**

Run: `npm run build`
Expected: Build succeeds with no errors

- [ ] **Step 5: Commit any formatting fixes**

```bash
git add -A
git commit -m "chore: format and lint fixes"
```

---

## Post-Implementation Notes

### Manual Setup Required

These steps cannot be automated and must be done by the developer:

1. **Supabase Auth Config**: Add `user-follow-read` and `user-library-read` scopes to the Spotify OAuth provider in Supabase Dashboard → Authentication → Providers → Spotify.

2. **Deploy Edge Functions**: Deploy `sync-releases` and `refresh-releases` via the Supabase CLI:
   ```bash
   supabase functions deploy sync-releases
   supabase functions deploy refresh-releases
   ```

3. **Schedule refresh-releases**: Set up a pg_cron job to invoke the refresh function every 6 hours:
   ```sql
   select cron.schedule(
     'refresh-releases',
     '0 */6 * * *',
     $$select net.http_post(
       url := '<SUPABASE_URL>/functions/v1/refresh-releases',
       headers := '{"Authorization": "Bearer <SERVICE_ROLE_KEY>"}'::jsonb
     )$$
   );
   ```

4. **Run the migration**: Execute `supabase/migrations/20260331000001_releases_feature.sql` in the Supabase SQL Editor.

### What's Not Covered

- **E2E tests** — Playwright tests for the releases feed require a Spotify test account with followed artists. Consider adding these after the feature is functional.
- **Sync progress updates** — The Edge Function currently doesn't push progress updates back to the client. The `SyncIndicator` shows progress but the store's `syncProgress` is only updated on the client side. A future improvement could use Supabase Realtime broadcast to push progress from the Edge Function.
