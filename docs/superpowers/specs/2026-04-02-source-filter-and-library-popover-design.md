# Source Filter & "Why In Library?" Popover

**Date:** 2026-04-02

## Problem

The feed shows releases from two artist sources: artists the user explicitly follows on Spotify ("Following") and artists who appear because the user saved one of their albums ("In Library"). Users want to:

1. Filter the feed by source — show only Following, only In Library, or both.
2. Understand _why_ an "In Library" artist appears — which specific saved albums caused it — so they can decide whether to keep or unsave them.

## Design

### 1. Source Filter

A three-way button toggle group in the feed filter bar, matching the existing release type selector:

**All** | **Following** | **In Library**

- Default value: `'all'`
- Persisted in `user_feed_preferences` as a new `source_filter` column (text, values: `'all'`, `'followed'`, `'saved'`)
- Passed to the `get_user_feed` RPC as a new `p_source_filter` parameter
- SQL WHERE clause: `(p_source_filter = 'all' or ua.source = p_source_filter)`

This follows the exact same pattern as the existing `release_type_filter`: one column, one RPC param, one WHERE clause, one toggle group in the filter bar, wired through the existing `updatePref()` helper in `ReleasesFeed`.

**Migration:** `ALTER TABLE spot_radar.user_feed_preferences ADD COLUMN source_filter text NOT NULL DEFAULT 'all';`

### 2. "Why In Library?" Popover

**Trigger:** Tapping the "In Library" chip on a release card opens a popover anchored to the chip.

**Data source:** On-demand from the Spotify API (no new database tables). A new `SpotifyApiService.getSavedAlbumsByArtist(artistId)` method fetches the artist's album catalog via `GET /artists/{id}/albums`, then checks which of those are in the user's library via `GET /me/albums/contains?ids=...` (up to 20 IDs per call). For a typical artist this is 2-3 API calls total.

**Caching:** Results are cached in a `Map<string, SpotifyAlbum[]>` on `SpotifyApiService` for the duration of the session. The cache is not persisted — it clears when the user navigates away from the feed.

**Popover content:**

- Loading state: small spinner while fetching
- Each album row: 32px art thumbnail, album name, year, Spotify link icon
- Empty state: "No saved albums found — run a full sync to update"

**Popover behavior:**

- Positioned using Angular CDK Overlay (`CdkConnectedOverlay`) anchored to the chip element
- Dismissed on backdrop click or Escape key
- Only "In Library" chips are clickable; "Following" chips remain inert

**Popover component:** A new `SavedAlbumsPopover` component in `features/releases/`. Takes an `artistId` input and a `trigger` element reference for positioning.

### 3. Changes to Existing Components

**`FeedFilterBar`:**

- New `sourceFilter` input and `sourceFilterChange` output
- New `MatButtonToggleGroup` with values `'all'`, `'followed'`, `'saved'`

**`ReleaseCard`:**

- The "In Library" chip becomes a `<button>` that emits a new `showSavedAlbums` output with `{ artistId, triggerElement }`
- The "Following" chip remains a static `<span>`

**`ReleasesFeed`:**

- Handles `showSavedAlbums` event: opens the `SavedAlbumsPopover` via CDK Overlay
- Wires `sourceFilterChange` through `updatePref('source_filter', value)`

**`ReleasesService` / `FeedPreferences`:**

- `FeedPreferences` interface gains `source_filter: string`
- `DEFAULT_PREFERENCES` gains `source_filter: 'all'`
- `getFeed()` passes `p_source_filter` to the RPC

**`get_user_feed` RPC:**

- New parameter `p_source_filter text`
- New WHERE clause: `(p_source_filter = 'all' or ua.source = p_source_filter)`

**`SpotifyApiService`:**

- New `getSavedAlbumsByArtist(artistId: string): Promise<SpotifyAlbum[]>` method — fetches artist catalog then checks library membership via `GET /me/albums/contains`
- Session-level cache: `private savedAlbumCache = new Map<string, SpotifyAlbum[]>()`

### 4. Out of Scope

- No new database tables — saved album data is fetched on-demand from Spotify
- No write operations — we do not unsave albums on the user's behalf; the popover links to Spotify
- No changes to sync logic — the existing full sync already handles stale artist cleanup
- No popover on "Following" chips — only "In Library" cards are clickable
