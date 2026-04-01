# New Releases Feed — Design Spec

## Overview

A personalized new releases feed that surfaces recent albums, EPs, and singles from artists in the user's Spotify library. Unlike Spotify's native "Music → Following" section, which mixes release types into a single undifferentiated list, this feature gives users real control: filter by release type, set a recency window, dismiss releases they don't care about, and get straight to what matters.

## Data Sources

The feed is built from the **union** of two Spotify data sets:

- **Followed artists** — via `GET /me/following?type=artist` (cursor-paginated, 50/page)
- **Saved album artists** — artists derived from the user's saved albums via `GET /me/albums` (offset-paginated, 50/page)

These are combined and deduplicated by Spotify artist ID to form the user's complete artist list.

## Architecture

### Why Server-Side Sync

There is no Spotify API endpoint for "new releases from artists I follow." The only path is to check each artist individually via `GET /artists/{id}/albums`. For users following thousands of artists, this means thousands of API calls — infeasible in real time on the client.

The solution is a **server-side background sync**: store the artist list in Supabase, use Edge Functions to check releases in batches, and serve the feed from Supabase. The client reads from Supabase, not Spotify.

### Storage Model

- **Spotify Web API** — source of truth for artist lists and release catalog data
- **Supabase** — stores synced artist lists, cached releases, user state (dismissed, preferences, last-checked), and Spotify OAuth tokens for server-side use

### Data Flow

1. **User signs in with Spotify OAuth** — Supabase Auth handles the flow. Scopes: `user-follow-read`, `user-library-read`. Spotify access + refresh tokens are stored in `user_spotify_tokens` for Edge Function use.

2. **Client syncs artist list → Supabase** — On first login, the client fetches followed artists + saved album artists (~40 paginated API calls for 2,000 artists, ~10-15 seconds). Stored in `user_artists` table.

3. **Edge Function: First-time onboarding sync** — Triggered after artist list sync. Fires concurrent batches (~10 parallel requests) of `GET /artists/{id}/albums?include_groups=album,single&limit=5`. For 2,000 artists, completes in ~2-3 minutes. Stores releases in `releases` table. Results appear in the feed progressively via Supabase Realtime.

4. **Client reads feed from Supabase** — Joins `releases` with `user_release_state` (dismissed). Filters by release type + recency window. Sorted by release date, newest first. No Spotify API calls needed.

5. **Edge Function: Scheduled refresh** — Runs every 6 hours via pg_cron. Picks artists with the oldest `last_release_check` across all users, checks their latest release. Full re-check cycle of all artists over ~2.5 days. Keeps the feed fresh without user action.

### Shared Release Data

The `releases` table is **shared across all users**. If 500 users follow the same artist, that artist's releases are stored once. The per-user state (dismissed, last-checked) lives in `user_release_state`. This scales well.

## Supabase Tables

All tables in the `angular_starter` schema.

### user_spotify_tokens

| Column | Type | Notes |
|--------|------|-------|
| user_id | UUID PK, FK → profiles | |
| access_token | TEXT | Encrypted |
| refresh_token | TEXT | Encrypted |
| expires_at | TIMESTAMPTZ | |
| scopes | TEXT | |
| updated_at | TIMESTAMPTZ | |

### user_artists

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| user_id | UUID FK → profiles | |
| spotify_artist_id | TEXT | |
| artist_name | TEXT | |
| artist_image_url | TEXT | |
| source | TEXT | 'followed' or 'saved' |
| last_release_check | TIMESTAMPTZ | When this artist was last checked for releases |
| synced_at | TIMESTAMPTZ | |

Unique constraint on (user_id, spotify_artist_id).

### releases

| Column | Type | Notes |
|--------|------|-------|
| spotify_album_id | TEXT PK | |
| spotify_artist_id | TEXT | |
| artist_name | TEXT | Denormalized for query simplicity |
| title | TEXT | |
| release_type | TEXT | 'album', 'single', or 'ep' |
| release_date | DATE | |
| image_url | TEXT | |
| spotify_url | TEXT | Direct link to open in Spotify |
| track_count | INTEGER | |
| fetched_at | TIMESTAMPTZ | |

### user_release_state

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| user_id | UUID FK → profiles | |
| spotify_album_id | TEXT FK → releases | |
| dismissed | BOOLEAN | Default false |
| dismissed_at | TIMESTAMPTZ | |

Unique constraint on (user_id, spotify_album_id).

### user_feed_preferences

| Column | Type | Notes |
|--------|------|-------|
| user_id | UUID PK, FK → profiles | |
| release_type_filter | TEXT | 'albums', 'eps', 'albums_eps', 'everything'. Default 'albums_eps' |
| recency_days | INTEGER | 30, 90, 180, etc. Default 90 |
| last_checked_at | TIMESTAMPTZ | Timestamp of last "mark all seen" action |

## Spotify OAuth

The starter already supports Spotify as a social login provider via Supabase Auth. Additional requirements:

- **Scopes**: `user-follow-read`, `user-library-read` must be configured in Supabase Auth Spotify provider settings
- **Token capture**: After OAuth callback, the Spotify access + refresh tokens are extracted and stored in `user_spotify_tokens` for Edge Function use
- **Token refresh**: Edge Functions use the refresh token to obtain new access tokens from Spotify when the stored token expires

## Feed UI

### Design System

Follows the Neon Nocturne design system defined in `docs/design.md`:

- **Surfaces**: No 1px borders. Separation via background color shifts (`surface` → `surface-container` → `surface-container-high`)
- **Typography**: Plus Jakarta Sans for titles/headings (tight tracking), Manrope for utility/metadata text
- **CTAs**: Gradient buttons (`primary_dim` #8455ef → `primary` #ba9eff at 135°), black text
- **Accents**: Teal (#6df5e1) for "new since" indicators, Electric Pink (#ff97b5) for like/heart actions
- **Depth**: Atmospheric shadows using `surface_tint` at 5% opacity, no traditional drop shadows
- **Roundedness**: `xl` (1rem) for cards and art, `full` for pill buttons

### Filter Bar

Persistent toolbar pinned above the feed:

- **Release type**: Segmented toggle — Albums + EPs (default), Albums, Everything
- **Recency window**: Dropdown — Last 30 days, Last 90 days (default), Last 6 months, Last year
- **Mark all seen**: Button that sets `last_checked_at` to now. Creates a "new since" divider in the feed.

### Feed Items

**Expanded card** (default state):
- Album art (88px, `lg` corner radius) with track count badge
- Title (Plus Jakarta Sans, 15px, bold, white)
- Artist name (Manrope, 12px, `on_surface_variant`)
- Release type + date (Manrope, 10px, muted)
- "Open in Spotify" button (gradient CTA)
- "Dismiss" button (ghost, `surface-container` background)

**Collapsed card** (dismissed state):
- Slim row, 36px album art
- Title, artist, type + date in a single line
- Reduced opacity (0.6)
- Click anywhere to re-expand
- Background: `surface-container` (vs `surface-container-high` for expanded)

### Feed Sections

- **"New since [date]" divider** — teal accent line with count, separates unseen releases from previously seen. Only appears after user has clicked "Mark all seen" at least once.
- **"Previously seen" divider** — subtle, muted divider below the new section.

### Sorting

Release date, newest first. No sort options for v1.

### First-Time Sync UI

During onboarding sync, the feed shows:
- A sync indicator in the filter bar area: "Syncing your library... 847 of 2,031 artists checked"
- Releases appear in the feed progressively as they're found via Supabase Realtime
- The feed is usable immediately — it gets more complete over the next 2-3 minutes
- Sync indicator disappears once complete

## Angular Architecture

Follows the starter's three-layer pattern (Service → Store → Component).

### Services

- **SpotifyAuthService** — manages Spotify-specific tokens (store in Supabase, refresh, retrieve). Separate from Supabase Auth's session management.
- **SpotifyApiService** — wraps Spotify Web API calls using the user's access token. Methods: `getFollowedArtists()`, `getSavedAlbums()`, `getArtistAlbums()`.
- **ReleasesService** — Supabase CRUD for releases, user_release_state, user_feed_preferences. Triggers the onboarding Edge Function. Subscribes to Realtime for live feed updates during sync.

### Store

- **ReleasesStore** — signal-based state management:
  - `releases` signal — the raw releases list from Supabase
  - `filters` signal — active release type + recency window
  - `dismissedIds` signal — set of dismissed release IDs
  - `syncProgress` signal — `{ total: number, checked: number, syncing: boolean }`
  - `lastCheckedAt` signal — timestamp from user_feed_preferences
  - `filteredFeed` computed — applies filters, sort, and dismiss state to produce the final feed

### Components

- **ReleasesFeed** — page component at `/releases`. Orchestrates service calls, pushes results to store, binds to store signals.
- **ReleaseCard** — expanded card with album art, metadata, and action buttons.
- **ReleaseCardCollapsed** — slim dismissed row. Click to re-expand.
- **FeedFilterBar** — persistent filter toolbar with release type toggle, recency dropdown, mark all seen.
- **SyncIndicator** — progress display during onboarding sync.

### Route

- Path: `/releases`
- Lazy-loaded via `loadComponent()`
- Protected by `authGuard`
- Added to shell sidenav navigation
- Route data: `{ childNavMode: 'none' }`

## Edge Functions

### sync-releases (Onboarding)

- **Trigger**: Called by client after initial artist list sync
- **Input**: User ID
- **Behavior**: Retrieves user's artist list from `user_artists`. Fetches `GET /artists/{id}/albums?include_groups=album,single&limit=5` for each artist in concurrent batches (~10 parallel). Stores results in `releases` table (upsert by `spotify_album_id`). Updates `last_release_check` on each `user_artists` row.
- **Rate limiting**: Respects Spotify's `Retry-After` header. Backs off and retries on 429 responses.
- **Duration**: ~2-3 minutes for 2,000 artists.

### refresh-releases (Scheduled)

- **Trigger**: pg_cron, every 6 hours
- **Behavior**: Queries `user_artists` across all users for rows with the oldest `last_release_check`. Picks a batch (e.g., 200 artists). For each, calls `GET /artists/{id}/albums?include_groups=album,single&limit=1` to check for new releases. Upserts any new releases into `releases`. Updates `last_release_check`.
- **Token management**: Reads Spotify tokens from `user_spotify_tokens`. Refreshes expired tokens automatically.
- **Deduplication**: If multiple users follow the same artist, only checks once per cycle (uses the shared `releases` table).

## RLS Policies

- `user_artists`: Users can read/write only their own rows
- `releases`: All authenticated users can read (shared table). Only Edge Functions write (via service role key).
- `user_release_state`: Users can read/write only their own rows
- `user_feed_preferences`: Users can read/write only their own rows
- `user_spotify_tokens`: Users can read/write only their own rows. Edge Functions read via service role key.

## Future Considerations

Not in scope for v1, but noted for the roadmap:

- **Artist list re-sync** — periodically re-fetch the user's followed/saved artists to catch new follows and unfollows
- **Sort options** — group by artist, sort by artist name, etc.
- **Push notifications** — notify users when a favorite artist drops something new
- **Smart playlist builder** — "one song from every new album this month"
- **Release Radar integration** — supplement the feed with Spotify's auto-generated playlist as a fast data source
