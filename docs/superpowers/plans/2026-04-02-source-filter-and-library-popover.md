# Source Filter & "Why In Library?" Popover Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a three-way source filter (All / Following / In Library) to the feed, and a clickable "In Library" chip that opens a popover showing which saved albums caused the artist to appear.

**Architecture:** Two independent features sharing no new data layer. The source filter follows the existing preference pattern (column + RPC param + toggle group). The popover fetches album data on-demand from Spotify via two targeted API calls (artist catalog + library contains check), cached in-memory for the session.

**Tech Stack:** Angular 21 (zoneless/signals), Angular CDK Overlay, Supabase RPC, Spotify Web API

---

## File Structure

| Action | Path                                                            | Responsibility                                        |
| ------ | --------------------------------------------------------------- | ----------------------------------------------------- |
| Modify | `supabase/migrations/20260402000001_source_filter.sql`          | Add `source_filter` column to preferences             |
| Modify | `supabase/migrations/20260401000001_get_user_feed_function.sql` | Add `p_source_filter` param to RPC                    |
| Modify | `src/app/features/releases/releases-service.ts`                 | Add `source_filter` to `FeedPreferences`, pass to RPC |
| Modify | `src/app/features/releases/releases-store.ts`                   | Add `source_filter` to store defaults                 |
| Modify | `src/app/features/releases/feed-filter-bar.ts`                  | Add source toggle group                               |
| Modify | `src/app/features/releases/releases-feed/releases-feed.ts`      | Wire source filter + popover overlay                  |
| Modify | `src/app/features/releases/release-card.ts`                     | Make "In Library" chip clickable                      |
| Create | `src/app/features/releases/saved-albums-popover.ts`             | Popover component                                     |
| Modify | `src/app/core/spotify/spotify-api.ts`                           | Add `getSavedAlbumsByArtist()` + cache                |
| Modify | `src/app/features/releases/releases-service.spec.ts`            | Update FeedPreferences mocks                          |
| Modify | `src/app/features/releases/releases-store.spec.ts`              | Update FeedPreferences mocks                          |
| Modify | `src/app/features/releases/feed-filter-bar.spec.ts`             | Add sourceFilter input + test                         |
| Modify | `src/app/core/spotify/spotify-api.spec.ts`                      | Test `getSavedAlbumsByArtist()`                       |

---

### Task 1: Migration — Add `source_filter` Column

**Files:**

- Create: `supabase/migrations/20260402000001_source_filter.sql`

- [ ] **Step 1: Write the migration**

```sql
alter table spot_radar.user_feed_preferences
  add column if not exists source_filter text not null default 'all';
```

- [ ] **Step 2: Commit**

```bash
git add supabase/migrations/20260402000001_source_filter.sql
git commit -m "feat: add source_filter column to user_feed_preferences"
```

---

### Task 2: Update `get_user_feed` RPC — Add `p_source_filter` Param

**Files:**

- Modify: `supabase/migrations/20260401000001_get_user_feed_function.sql`

- [ ] **Step 1: Add the new parameter and WHERE clause**

Add `p_source_filter text` as a new parameter after `p_hide_live boolean`. Add the DROP for the old 7-param signature. Add the WHERE clause `and (p_source_filter = 'all' or ua.source = p_source_filter)`.

The updated file should have these DROP lines at the top:

```sql
drop function if exists spot_radar.get_user_feed(uuid, text, integer, integer, integer, integer);
drop function if exists spot_radar.get_user_feed(uuid, text, integer, integer, boolean, integer, integer);
drop function if exists spot_radar.get_user_feed(uuid, text, integer, integer, boolean, text, integer, integer);
```

The function signature becomes:

```sql
create function spot_radar.get_user_feed(
  p_user_id uuid,
  p_release_type text,
  p_min_track_count integer,
  p_recency_days integer,
  p_hide_live boolean,
  p_source_filter text,
  p_offset integer,
  p_limit integer
)
```

Add the new WHERE clause after the `p_hide_live` line:

```sql
    and (p_source_filter = 'all' or ua.source = p_source_filter)
```

Update the GRANT to match the new 8-param signature:

```sql
grant execute on function spot_radar.get_user_feed(uuid, text, integer, integer, boolean, text, integer, integer) to authenticated;
```

- [ ] **Step 2: Commit**

```bash
git add supabase/migrations/20260401000001_get_user_feed_function.sql
git commit -m "feat: add p_source_filter param to get_user_feed RPC"
```

---

### Task 3: Update `FeedPreferences` Interface, Defaults, and RPC Call

**Files:**

- Modify: `src/app/features/releases/releases-service.ts`
- Modify: `src/app/features/releases/releases-store.ts`
- Modify: `src/app/features/releases/releases-service.spec.ts`
- Modify: `src/app/features/releases/releases-store.spec.ts`

- [ ] **Step 1: Update `FeedPreferences` interface in `releases-service.ts`**

Add `source_filter: string;` after `hide_live: boolean;` in the `FeedPreferences` interface (line 23).

Add `source_filter: 'all',` after `hide_live: false,` in `DEFAULT_PREFERENCES` (line 37).

- [ ] **Step 2: Pass `p_source_filter` to the RPC call in `getFeed()`**

In the `getFeed()` method, add `p_source_filter: filters.source_filter,` after the `p_hide_live` line in the RPC params object.

- [ ] **Step 3: Update store defaults in `releases-store.ts`**

Add `source_filter: 'all',` after `hide_live: false,` in the store's `DEFAULT_PREFERENCES`.

- [ ] **Step 4: Update test mocks in `releases-service.spec.ts`**

Add `source_filter: 'all',` to the `mockPreferences` object (after `hide_live: false`).

Add `source_filter: 'all',` to the expected defaults in the `getPreferences` PGRST116 test.

- [ ] **Step 5: Update test mocks in `releases-store.spec.ts`**

Add `source_filter: 'all',` to both `FeedPreferences` objects in the `setPreferences` test and the `clear()` preferences test.

- [ ] **Step 6: Run tests**

Run: `npm test -- --no-watch`
Expected: All tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/app/features/releases/releases-service.ts src/app/features/releases/releases-store.ts src/app/features/releases/releases-service.spec.ts src/app/features/releases/releases-store.spec.ts
git commit -m "feat: add source_filter to FeedPreferences and RPC call"
```

---

### Task 4: Add Source Toggle Group to `FeedFilterBar`

**Files:**

- Modify: `src/app/features/releases/feed-filter-bar.ts`
- Modify: `src/app/features/releases/feed-filter-bar.spec.ts`

- [ ] **Step 1: Add input and output to `FeedFilterBar`**

Add after `hideLive = input.required<boolean>();`:

```typescript
sourceFilter = input.required<string>();
```

Add after `hideLiveChange = output<boolean>();`:

```typescript
sourceFilterChange = output<string>();
```

- [ ] **Step 2: Add toggle group to template**

Add after the release type toggle group's closing `</mat-button-toggle-group>` and before the min tracks `<mat-form-field>`:

```html
<mat-button-toggle-group
  [value]="sourceFilter()"
  (change)="sourceFilterChange.emit($event.value)"
  aria-label="Artist source"
>
  <mat-button-toggle value="all">All</mat-button-toggle>
  <mat-button-toggle value="followed">Following</mat-button-toggle>
  <mat-button-toggle value="saved">In Library</mat-button-toggle>
</mat-button-toggle-group>
```

- [ ] **Step 3: Add input to spec setup**

In `feed-filter-bar.spec.ts`, add after the `hideLive` setInput line:

```typescript
fixture.componentRef.setInput('sourceFilter', 'all');
```

- [ ] **Step 4: Run tests**

Run: `npm test -- --no-watch`
Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/app/features/releases/feed-filter-bar.ts src/app/features/releases/feed-filter-bar.spec.ts
git commit -m "feat: add source filter toggle group to feed filter bar"
```

---

### Task 5: Wire Source Filter in `ReleasesFeed`

**Files:**

- Modify: `src/app/features/releases/releases-feed/releases-feed.ts`

- [ ] **Step 1: Add template binding**

In the `<app-feed-filter-bar>` template, add after `[hideLive]="store.feedPreferences().hide_live"`:

```html
[sourceFilter]="store.feedPreferences().source_filter"
```

Add after `(hideLiveChange)="onHideLiveChange($event)"`:

```html
(sourceFilterChange)="onSourceFilterChange($event)"
```

- [ ] **Step 2: Add handler method**

Add after `onHideLiveChange`:

```typescript
  protected onSourceFilterChange(value: string): Promise<void> {
    return this.updatePref('source_filter', value);
  }
```

- [ ] **Step 3: Run tests and build**

Run: `npm run build && npm test -- --no-watch`
Expected: Build succeeds, all tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/app/features/releases/releases-feed/releases-feed.ts
git commit -m "feat: wire source filter to releases feed"
```

---

### Task 6: Add `getSavedAlbumsByArtist()` to `SpotifyApiService`

**Files:**

- Modify: `src/app/core/spotify/spotify-api.ts`
- Modify: `src/app/core/spotify/spotify-api.spec.ts`

- [ ] **Step 1: Write the failing tests in `spotify-api.spec.ts`**

Add a new `describe('getSavedAlbumsByArtist')` block before the `describe('429 rate limiting')` block:

```typescript
describe('getSavedAlbumsByArtist', () => {
  it('should return only albums the user has saved', async () => {
    // First call: get artist albums
    fetchMock.mockResolvedValueOnce(
      makeOkResponse({
        items: [mockAlbum('alb1'), mockAlbum('alb2'), mockAlbum('alb3')],
      }),
    );
    // Second call: check library membership
    fetchMock.mockResolvedValueOnce(makeOkResponse([true, false, true]));

    const result = await service.getSavedAlbumsByArtist('artist-1');

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('alb1');
    expect(result[1].id).toBe('alb3');
  });

  it('should use cache on subsequent calls for the same artist', async () => {
    fetchMock.mockResolvedValueOnce(makeOkResponse({ items: [mockAlbum('alb1')] }));
    fetchMock.mockResolvedValueOnce(makeOkResponse([true]));

    await service.getSavedAlbumsByArtist('artist-1');
    const result = await service.getSavedAlbumsByArtist('artist-1');

    expect(result).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledTimes(2); // Only the first pair of calls
  });

  it('should return empty array when no albums are saved', async () => {
    fetchMock.mockResolvedValueOnce(
      makeOkResponse({ items: [mockAlbum('alb1'), mockAlbum('alb2')] }),
    );
    fetchMock.mockResolvedValueOnce(makeOkResponse([false, false]));

    const result = await service.getSavedAlbumsByArtist('artist-1');

    expect(result).toHaveLength(0);
  });

  it('should batch contains checks in groups of 20', async () => {
    const albums = Array.from({ length: 25 }, (_, i) => mockAlbum(`alb${i}`));
    fetchMock.mockResolvedValueOnce(makeOkResponse({ items: albums }));
    // First batch of 20
    fetchMock.mockResolvedValueOnce(makeOkResponse(Array(20).fill(false)));
    // Second batch of 5
    fetchMock.mockResolvedValueOnce(makeOkResponse(Array(5).fill(false)));

    await service.getSavedAlbumsByArtist('artist-1');

    // 1 artist albums call + 2 contains calls
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/me/albums/contains'),
      expect.any(Object),
    );
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- --no-watch src/app/core/spotify/spotify-api.spec.ts`
Expected: FAIL — `getSavedAlbumsByArtist` is not a function.

- [ ] **Step 3: Implement `getSavedAlbumsByArtist()` in `spotify-api.ts`**

Add a cache field after the `private spotifyAuth` line:

```typescript
  private savedAlbumCache = new Map<string, SpotifyAlbum[]>();
```

Add the method after `getArtistAlbums()`:

```typescript
  /**
   * Returns the user's saved albums by a specific artist.
   * Fetches the artist's catalog, then checks which are in the user's library.
   * Results are cached per artist for the session.
   */
  async getSavedAlbumsByArtist(artistId: string): Promise<SpotifyAlbum[]> {
    const cached = this.savedAlbumCache.get(artistId);
    if (cached) return cached;

    const allAlbums = await this.getArtistAlbums(artistId, 50);

    const saved: boolean[] = [];
    for (let i = 0; i < allAlbums.length; i += 20) {
      const batch = allAlbums.slice(i, i + 20);
      const ids = batch.map((a) => a.id).join(',');
      const url = `${SPOTIFY_API_BASE}/me/albums/contains?ids=${ids}`;
      const result = (await this.fetchWithAuth(url)) as boolean[];
      saved.push(...result);
    }

    const result = allAlbums.filter((_, i) => saved[i]);
    this.savedAlbumCache.set(artistId, result);
    return result;
  }
```

Note: `SPOTIFY_API_BASE` is already defined as a const at the top of the file.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- --no-watch src/app/core/spotify/spotify-api.spec.ts`
Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/app/core/spotify/spotify-api.ts src/app/core/spotify/spotify-api.spec.ts
git commit -m "feat: add getSavedAlbumsByArtist with targeted Spotify API lookup"
```

---

### Task 7: Create `SavedAlbumsPopover` Component

**Files:**

- Create: `src/app/features/releases/saved-albums-popover.ts`

- [ ] **Step 1: Create the popover component**

```typescript
import { ChangeDetectionStrategy, Component, input, signal, OnInit, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { SpotifyApiService, SpotifyAlbum } from '@core';
import { LoadingSpinner } from '@shared';

@Component({
  selector: 'app-saved-albums-popover',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, LoadingSpinner],
  template: `
    <div class="popover-content">
      @if (loading()) {
        <app-loading-spinner diameter="24" />
      } @else if (albums().length === 0) {
        <p class="empty">No saved albums found — run a full sync to update</p>
      } @else {
        <div class="header">Saved albums by this artist</div>
        @for (album of albums(); track album.id) {
          <div class="album-row">
            <img
              class="album-art"
              [src]="album.images[album.images.length - 1]?.url || 'assets/placeholder-album.png'"
              [alt]="album.name"
              width="32"
              height="32"
            />
            <div class="album-info">
              <span class="album-name">{{ album.name }}</span>
              <span class="album-year">{{ album.release_date | date: 'y' }}</span>
            </div>
            <a
              class="spotify-link"
              [href]="'https://open.spotify.com/album/' + album.id"
              target="_blank"
              rel="noopener"
              title="Open in Spotify"
            >
              ↗
            </a>
          </div>
        }
      }
    </div>
  `,
  styles: `
    .popover-content {
      min-width: 220px;
      max-width: 300px;
      padding: 12px;
      background: var(--mat-sys-surface-container-high);
      border: 1px solid var(--mat-sys-outline-variant);
      border-radius: 8px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
    }

    .header {
      font-size: 0.65rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--mat-sys-outline);
      margin-bottom: 8px;
    }

    .album-row {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 4px 0;
    }

    .album-art {
      width: 32px;
      height: 32px;
      border-radius: 4px;
      object-fit: cover;
      flex-shrink: 0;
    }

    .album-info {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 1px;
    }

    .album-name {
      font-size: 0.8125rem;
      color: var(--mat-sys-on-surface);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .album-year {
      font-size: 0.7rem;
      color: var(--mat-sys-outline);
    }

    .spotify-link {
      flex-shrink: 0;
      color: var(--mat-sys-primary);
      text-decoration: none;
      font-size: 0.875rem;
      padding: 4px;
    }

    .empty {
      font-size: 0.8125rem;
      color: var(--mat-sys-outline);
      margin: 0;
    }

    app-loading-spinner {
      display: flex;
      justify-content: center;
      padding: 8px 0;
    }
  `,
})
export class SavedAlbumsPopover implements OnInit {
  artistId = input.required<string>();

  protected loading = signal(true);
  protected albums = signal<SpotifyAlbum[]>([]);

  private spotifyApi = inject(SpotifyApiService);

  async ngOnInit(): Promise<void> {
    try {
      const result = await this.spotifyApi.getSavedAlbumsByArtist(this.artistId());
      this.albums.set(result);
    } catch {
      this.albums.set([]);
    } finally {
      this.loading.set(false);
    }
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/features/releases/saved-albums-popover.ts
git commit -m "feat: create SavedAlbumsPopover component"
```

---

### Task 8: Make "In Library" Chip Clickable in `ReleaseCard`

**Files:**

- Modify: `src/app/features/releases/release-card.ts`

- [ ] **Step 1: Add output signal**

Add after `dismiss = output<string>();`:

```typescript
showSavedAlbums = output<{ artistId: string; triggerElement: HTMLElement }>();
```

- [ ] **Step 2: Update template — replace the "In Library" span with a button**

Replace this block in the template:

```html
@if (release().artist_source === 'saved') {
<span class="source-chip saved" title="In your library">In library</span>
} @else {
<span class="source-chip followed" title="Artist you follow">Following</span>
}
```

With:

```html
@if (release().artist_source === 'saved') {
<button
  class="source-chip saved clickable"
  title="See saved albums by this artist"
  (click)="onShowSavedAlbums($event)"
>
  In library
</button>
} @else {
<span class="source-chip followed" title="Artist you follow">Following</span>
}
```

- [ ] **Step 3: Add the click handler**

Add after `onDismiss()`:

```typescript
  onShowSavedAlbums(event: MouseEvent): void {
    this.showSavedAlbums.emit({
      artistId: this.release().spotify_artist_id,
      triggerElement: event.target as HTMLElement,
    });
  }
```

- [ ] **Step 4: Add clickable styles**

Add after the `.source-chip.saved` block in styles:

```css
.source-chip.clickable {
  cursor: pointer;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.8;
  }
}
```

- [ ] **Step 5: Run tests**

Run: `npm test -- --no-watch`
Expected: All tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/app/features/releases/release-card.ts
git commit -m "feat: make In Library chip clickable on release card"
```

---

### Task 9: Wire Popover Overlay in `ReleasesFeed`

**Files:**

- Modify: `src/app/features/releases/releases-feed/releases-feed.ts`

- [ ] **Step 1: Add CDK Overlay import and popover imports**

Add to the Angular imports at the top of the file:

```typescript
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
```

Add to the feature imports:

```typescript
import { SavedAlbumsPopover } from '../saved-albums-popover';
```

Add `Overlay` to the injected services:

```typescript
  private overlay = inject(Overlay);
```

Add a field to track the open overlay:

```typescript
  private popoverRef: OverlayRef | null = null;
```

- [ ] **Step 2: Add `(showSavedAlbums)` binding to both release card instances in the template**

Update both `<app-release-card>` instances (one in `newReleases`, one in `seenReleases`) to add the output binding:

```html
<app-release-card
  [release]="release"
  (dismiss)="onDismiss($event)"
  (showSavedAlbums)="onShowSavedAlbums($event)"
/>
```

- [ ] **Step 3: Add the `onShowSavedAlbums` handler**

Add after `onUndismiss`:

```typescript
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
    });

    this.popoverRef.backdropClick().subscribe(() => this.popoverRef?.dispose());
    this.popoverRef.keydownEvents().subscribe((e) => {
      if (e.key === 'Escape') this.popoverRef?.dispose();
    });

    const portal = new ComponentPortal(SavedAlbumsPopover);
    const ref = this.popoverRef.attach(portal);
    ref.setInput('artistId', event.artistId);
  }
```

- [ ] **Step 4: Clean up overlay in `ngOnDestroy`**

Add to the existing `ngOnDestroy` method:

```typescript
this.popoverRef?.dispose();
```

- [ ] **Step 5: Run build and tests**

Run: `npm run build && npm test -- --no-watch`
Expected: Build succeeds, all tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/app/features/releases/releases-feed/releases-feed.ts
git commit -m "feat: wire saved albums popover overlay in releases feed"
```

---

### Task 10: Final Integration Test

- [ ] **Step 1: Run full test suite**

Run: `npm test -- --no-watch`
Expected: All tests pass.

- [ ] **Step 2: Run build**

Run: `npm run build`
Expected: Build succeeds with no errors.

- [ ] **Step 3: Run lint and format**

Run: `npm run lint && npm run format:check`
Expected: No lint errors, no formatting issues.

- [ ] **Step 4: Final commit if any format changes**

```bash
git add -u
git commit -m "chore: format and lint fixes"
```
