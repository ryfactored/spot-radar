# Real-Time Sync Progress via Supabase Realtime Broadcast

## Overview

Replace the current indeterminate sync indicator with artist-level real-time progress using Supabase Realtime broadcast channels. Users see which artist is being checked and a determinate progress bar as the sync runs.

## Decisions

- **Progress granularity:** Artist-level (name + count)
- **Transport:** Supabase Realtime broadcast with client-server handshake
- **UI:** Inline in existing sync indicator (compact, top of feed)
- **Completion:** Indicator collapses + summary toast
- **Fallback strategy:** None upfront. Reassess if broadcast proves unreliable.

## Data Model

### Broadcast Messages (edge function -> client)

```typescript
// Per artist
{ type: 'artist-progress', artistName: string, checked: number, total: number }

// End of sync
{ type: 'sync-complete', checked: number, releasesFound: number }
```

### Client Ready Signal (client -> edge function)

```typescript
{
  type: 'ready';
}
```

### SyncProgress Signal (store)

```typescript
interface SyncProgress {
  syncing: boolean;
  total: number;
  checked: number;
  currentArtist: string;
  releasesFound: number;
}
```

## Channel Protocol

**Channel name:** `sync-progress:{userId}`

### Sequence

1. Client subscribes to `sync-progress:{userId}`, waits for `SUBSCRIBED` status
2. Client broadcasts `{ type: 'ready' }` on the channel
3. Client calls the edge function via `supabase.functions.invoke('sync-releases', ...)`
4. Edge function subscribes to the same channel, listens for `ready` (2s timeout)
5. If `ready` received or timeout expires, edge function begins artist processing
6. After each artist, edge function broadcasts `{ type: 'artist-progress', ... }` (fire-and-forget)
7. On completion, edge function broadcasts `{ type: 'sync-complete', ... }` and unsubscribes
8. Client receives `sync-complete`, unsubscribes, collapses indicator, shows summary toast

### Edge Cases

- **Handshake timeout:** Edge function proceeds anyway. Client misses early messages, progress bar jumps on next received message.
- **Client navigates away:** Edge function continues (serverless). Orphaned channel cleans up. Feed reload on return catches results.
- **Missed broadcast messages:** Progress bar jumps ahead. Cosmetic only, not a stall.

## Component Changes

### Edge function (`supabase/functions/sync-releases/index.ts`)

- Create a Supabase client for Realtime (using service role key)
- Subscribe to `sync-progress:{userId}` channel
- Listen for `ready` signal with 2s timeout
- After processing each artist, fire-and-forget broadcast `artist-progress` with artist name, checked count, and total
- On completion, broadcast `sync-complete` with final counts
- Unsubscribe from channel

### Releases feed (`src/app/features/releases/releases-feed/releases-feed.ts`)

- Before calling `triggerSync`, subscribe to `sync-progress:{userId}` channel
- On `SUBSCRIBED` status, broadcast `{ type: 'ready' }`
- On `artist-progress` messages, call `store.setSyncProgress()` with updated `checked` and `currentArtist`
- On `sync-complete`, unsubscribe, reload feed, show summary toast ("Synced N artists, found N new releases")
- Keep existing Realtime INSERT subscription on `releases` table for `releasesFound` count

### Sync indicator (`src/app/features/releases/sync-indicator.ts`)

- Determinate progress bar: `checked / total * 100`
- Status text: `"Checking {currentArtist}... {checked}/{total}"`
- When `total === 0` and syncing: `"Fetching your artists from Spotify..."`
- On complete: briefly show "Sync complete" then collapse

### Releases store (`src/app/features/releases/releases-store.ts`)

- Add `currentArtist: string` to `SyncProgress` interface (default `''`)
- No other store changes needed

## Files Modified

| File                                                       | Change                                         |
| ---------------------------------------------------------- | ---------------------------------------------- |
| `supabase/functions/sync-releases/index.ts`                | Add Realtime broadcast with handshake          |
| `src/app/features/releases/releases-feed/releases-feed.ts` | Subscribe to progress channel, handle messages |
| `src/app/features/releases/sync-indicator.ts`              | Determinate bar, artist name display           |
| `src/app/features/releases/releases-store.ts`              | Add `currentArtist` to SyncProgress            |

No new files created.
