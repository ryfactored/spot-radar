# Real-Time Sync Progress Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show artist-level real-time sync progress via Supabase Realtime broadcast with a client-server handshake.

**Architecture:** The edge function broadcasts `artist-progress` messages on a `sync-progress:{userId}` channel as it checks each artist. The client subscribes before triggering sync, sends a `ready` signal, and updates a determinate progress bar inline. On completion, the indicator collapses and a summary toast appears.

**Tech Stack:** Angular 21 (zoneless/signals), Supabase Realtime broadcast, Deno edge functions

---

### Task 1: Add `currentArtist` to SyncProgress in the store

**Files:**

- Modify: `src/app/features/releases/releases-store.ts:4-9` (SyncProgress interface)
- Modify: `src/app/features/releases/releases-store.ts:20` (DEFAULT_SYNC)

- [ ] **Step 1: Update SyncProgress interface**

In `src/app/features/releases/releases-store.ts`, change the interface:

```typescript
export interface SyncProgress {
  total: number;
  checked: number;
  syncing: boolean;
  releasesFound: number;
  currentArtist: string;
}
```

- [ ] **Step 2: Update DEFAULT_SYNC**

In the same file, update the default:

```typescript
const DEFAULT_SYNC: SyncProgress = {
  total: 0,
  checked: 0,
  syncing: false,
  releasesFound: 0,
  currentArtist: '',
};
```

- [ ] **Step 3: Verify the build compiles**

Run: `npx ng build 2>&1 | head -30`

This will likely show errors in `releases-feed.ts` where `setSyncProgress` is called without `currentArtist`. That's expected — we fix those in Task 4. For now just confirm the store file itself is valid.

- [ ] **Step 4: Commit**

```bash
git add src/app/features/releases/releases-store.ts
git commit -m "feat: add currentArtist to SyncProgress interface"
```

---

### Task 2: Update sync indicator to show determinate progress with artist name

**Files:**

- Modify: `src/app/features/releases/sync-indicator.ts`

- [ ] **Step 1: Replace the sync indicator template and styles**

Replace the full component in `src/app/features/releases/sync-indicator.ts`:

```typescript
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { SyncProgress } from './releases-store';

@Component({
  selector: 'app-sync-indicator',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecimalPipe, MatProgressBarModule],
  template: `
    @if (progress().syncing) {
      <div class="sync-indicator">
        <p class="sync-text">
          @if (progress().total === 0) {
            Fetching your artists from Spotify...
          } @else if (progress().currentArtist) {
            Checking {{ progress().currentArtist }}...
            <span class="sync-count">{{ progress().checked }}/{{ progress().total | number }}</span>
          } @else {
            Scanning {{ progress().total | number }} artists for new releases...
          }
        </p>
        <mat-progress-bar [mode]="progressMode()" [value]="progressPercent()" />
      </div>
    }
  `,
  styles: `
    .sync-indicator {
      display: flex;
      flex-direction: column;
      gap: 10px;
      padding: 16px 20px;
      border-radius: 16px;
      background: rgba(25, 25, 29, 0.6);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      box-shadow: 0 0 24px rgba(186, 158, 255, 0.08);

      --mdc-linear-progress-active-indicator-color: #ba9eff;
      --mdc-linear-progress-track-color: rgba(186, 158, 255, 0.1);
    }

    .sync-text {
      margin: 0;
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 0.875rem;
      color: #acaaae;
    }

    .sync-count {
      color: #ba9eff;
      font-weight: 600;
    }
  `,
})
export class SyncIndicator {
  progress = input.required<SyncProgress>();

  protected progressPercent = computed(() => {
    const p = this.progress();
    if (p.total === 0) return 0;
    return (p.checked / p.total) * 100;
  });

  protected progressMode = computed(() => {
    const p = this.progress();
    return p.total > 0 && p.checked > 0 ? 'determinate' : 'indeterminate';
  });
}
```

- [ ] **Step 2: Verify the component builds in isolation**

Run: `npx ng build 2>&1 | head -30`

Expect build errors from `releases-feed.ts` (missing `currentArtist` in `setSyncProgress` calls). That's fixed in Task 4.

- [ ] **Step 3: Commit**

```bash
git add src/app/features/releases/sync-indicator.ts
git commit -m "feat: sync indicator with determinate progress and artist name"
```

---

### Task 3: Add Realtime broadcast to the edge function

**Files:**

- Modify: `supabase/functions/sync-releases/index.ts`

- [ ] **Step 1: Add broadcast channel setup after Supabase client creation**

After the existing `const supabase = createClient(...)` block (line 29-32), add the broadcast channel setup. Insert this after the `artistsToCheck` filtering block (after line 114) and before the `let checked = 0` line (line 116):

```typescript
// Set up Realtime broadcast channel for progress
const channelName = `sync-progress:${userId}`;
const channel = supabase.channel(channelName);

// Wait for client 'ready' signal (2s timeout)
let channelReady = false;
const readyPromise = new Promise<void>((resolve) => {
  channel.on('broadcast', { event: 'ready' }, () => {
    channelReady = true;
    resolve();
  });
  channel.subscribe();
  setTimeout(resolve, 2000);
});
await readyPromise;
```

- [ ] **Step 2: Add per-artist broadcast inside the batch loop**

After the existing `checked += batch.length;` line (line 184), add artist-level broadcasts. Replace that line with:

```typescript
// Broadcast progress for each artist in this batch
for (const row of batch) {
  checked++;
  // Look up artist name from the releases we just fetched, or use the ID
  const artistName =
    releases.find(
      (r: { spotify_artist_id: string; artist_name: string }) =>
        r.spotify_artist_id === row.spotify_artist_id,
    )?.artist_name ?? row.spotify_artist_id;

  if (channelReady) {
    channel.send({
      type: 'broadcast',
      event: 'artist-progress',
      payload: { artistName, checked, total },
    });
  }
}
```

Note: Remove the old `checked += batch.length;` line since `checked` is now incremented per-artist in the loop above.

- [ ] **Step 3: Add sync-complete broadcast and channel cleanup before the response**

Replace the existing return statement (line 187-188) with:

```typescript
// Broadcast completion and clean up channel
if (channelReady) {
  channel.send({
    type: 'broadcast',
    event: 'sync-complete',
    payload: { checked, releasesFound: 0 },
  });
}
// Small delay to let the final broadcast flush before unsubscribing
await new Promise((r) => setTimeout(r, 200));
supabase.removeChannel(channel);

return new Response(JSON.stringify({ total, checked, releases: 'synced' }), {
  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
});
```

- [ ] **Step 4: Commit**

```bash
git add supabase/functions/sync-releases/index.ts
git commit -m "feat: edge function broadcasts artist-level sync progress"
```

---

### Task 4: Wire up broadcast subscription in releases-feed

**Files:**

- Modify: `src/app/features/releases/releases-feed/releases-feed.ts`

- [ ] **Step 1: Add a `subscribeToSyncProgress` method**

Add this private method to the `ReleasesFeed` class, after the `subscribeToRealtime` method (after line 738):

```typescript
  private subscribeSyncProgress(userId: string): {
    ready: Promise<void>;
    unsubscribe: () => void;
  } {
    const supabase = inject(SupabaseService).client;
    const channelName = `sync-progress:${userId}`;
    const channel = supabase.channel(channelName);

    const ready = new Promise<void>((resolve) => {
      channel
        .on('broadcast', { event: 'artist-progress' }, ({ payload }) => {
          this.store.setSyncProgress({
            total: payload['total'],
            checked: payload['checked'],
            syncing: true,
            releasesFound: this.store.syncProgress().releasesFound,
            currentArtist: payload['artistName'],
          });
        })
        .on('broadcast', { event: 'sync-complete' }, () => {
          // Handled by the caller after triggerSync resolves
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            channel.send({
              type: 'broadcast',
              event: 'ready',
              payload: {},
            });
            resolve();
          }
        });
    });

    return {
      ready,
      unsubscribe: () => supabase.removeChannel(channel),
    };
  }
```

- [ ] **Step 2: Add `SupabaseService` import and injection**

At the top of the file, add `SupabaseService` to the `@core` import:

```typescript
import { AuthService, SpotifyApiService, SupabaseService, extractErrorMessage } from '@core';
```

Add to the class injections (after `private spotifyApi = inject(SpotifyApiService);`):

```typescript
  private supabaseService = inject(SupabaseService);
```

Then update `subscribeSyncProgress` to use `this.supabaseService.client` instead of `inject(SupabaseService).client`.

- [ ] **Step 3: Update `onSyncNow` to use broadcast channel**

Replace the `onSyncNow` method (lines 846-875) with:

```typescript
  protected async onSyncNow(mode: 'quick' | 'full'): Promise<void> {
    if (this.store.isSyncing()) return;
    this.store.setSyncProgress({
      total: 0, checked: 0, syncing: true, releasesFound: 0, currentArtist: '',
    });

    let unsubProgress: (() => void) | null = null;

    try {
      let artistIds = this.store.followedArtistIds();

      if (mode === 'full') {
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
        currentArtist: '',
      });

      // Subscribe to progress channel before triggering sync
      const { ready, unsubscribe } = this.subscribeSyncProgress(this.userId);
      unsubProgress = unsubscribe;
      await ready;

      await this.service.triggerSync(this.userId, false);

      unsubProgress();
      unsubProgress = null;

      const syncState = this.store.syncProgress();
      this.store.setSyncProgress({
        total: 0, checked: 0, syncing: false, releasesFound: 0, currentArtist: '',
      });
      await this.loadFeed(1);

      this.toast.success(
        `Synced ${syncState.checked} artists, found ${syncState.releasesFound} new releases.`,
      );
    } catch (err) {
      unsubProgress?.();
      this.store.setSyncProgress({
        total: 0, checked: 0, syncing: false, releasesFound: 0, currentArtist: '',
      });
      this.toast.error(extractErrorMessage(err, 'Sync failed.'));
    }
  }
```

- [ ] **Step 4: Update first-visit sync in `loadInitialData` to include `currentArtist`**

In the `loadInitialData` method, update all `setSyncProgress` calls to include `currentArtist: ''`:

Line 681:

```typescript
this.store.setSyncProgress({
  total: 0,
  checked: 0,
  syncing: true,
  releasesFound: 0,
  currentArtist: '',
});
```

Line 692:

```typescript
this.store.setSyncProgress({
  total: 0,
  checked: 0,
  syncing: false,
  releasesFound: 0,
  currentArtist: '',
});
```

Line 697:

```typescript
this.store.setSyncProgress({
  total: 0,
  checked: 0,
  syncing: false,
  releasesFound: 0,
  currentArtist: '',
});
```

- [ ] **Step 5: Verify the build compiles**

Run: `npx ng build 2>&1 | tail -20`
Expected: Build succeeds with no errors.

- [ ] **Step 6: Commit**

```bash
git add src/app/features/releases/releases-feed/releases-feed.ts
git commit -m "feat: subscribe to broadcast channel for real-time sync progress"
```

---

### Task 5: Manual end-to-end test

**Files:** None (testing only)

- [ ] **Step 1: Deploy the edge function**

Run: `npx supabase functions deploy sync-releases`

- [ ] **Step 2: Start the dev server**

Run: `npm start`

- [ ] **Step 3: Test quick sync**

1. Navigate to the releases feed
2. Click "Quick Sync" in the filter bar
3. Verify: progress bar appears with artist names and a count (e.g., "Checking Radiohead... 5/150")
4. Verify: progress bar is determinate and fills up
5. Verify: on completion, indicator collapses and toast appears (e.g., "Synced 150 artists, found 3 new releases.")

- [ ] **Step 4: Test full sync**

1. Click "Full Sync"
2. Verify: starts with "Fetching your artists from Spotify..." (indeterminate)
3. Verify: switches to artist-level progress once edge function starts
4. Verify: completion toast with counts

- [ ] **Step 5: Test edge cases**

1. Navigate away during sync, return — feed should show results
2. Trigger sync on slow network — verify no hanging, progress may jump but doesn't stall
