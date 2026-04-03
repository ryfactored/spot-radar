import { Injectable, inject } from '@angular/core';
import { SupabaseService, RealtimeService } from '@core';
import { unwrap } from '@core';
import { SUPABASE_ERRORS } from '@core';
import type { RealtimePayload } from '@core';

export interface Release {
  spotify_album_id: string;
  spotify_artist_id: string;
  artist_name: string;
  title: string;
  release_type: string;
  release_date: string;
  image_url: string | null;
  track_count: number;
  artist_source: 'followed' | 'saved';
  created_at?: string;
}

export interface FeedPreferences {
  release_type_filter: string;
  min_track_count: number;
  recency_days: number;
  hide_live: boolean;
  source_filter: string;
  last_checked_at: string | null;
}

export interface ArtistRow {
  spotify_artist_id: string;
  artist_name: string;
  artist_image_url?: string | null;
}

const DEFAULT_PREFERENCES: FeedPreferences = {
  release_type_filter: 'everything',
  min_track_count: 0,
  recency_days: 90,
  hide_live: false,
  source_filter: 'all',
  last_checked_at: null,
};

const CHUNK_SIZE = 500;

@Injectable({
  providedIn: 'root',
})
export class ReleasesService {
  private supabase = inject(SupabaseService);
  private realtime = inject(RealtimeService);

  /**
   * Fetch paginated releases for the given artists matching the user's filters.
   */
  async getFeed(
    userId: string,
    filters: FeedPreferences,
    page: number,
    pageSize: number,
  ): Promise<{ data: Release[]; count: number }> {
    const offset = (page - 1) * pageSize;

    const result = unwrap(
      await this.supabase.client.rpc('get_user_feed', {
        p_user_id: userId,
        p_release_type: filters.release_type_filter,
        p_min_track_count: filters.min_track_count,
        p_recency_days: filters.recency_days,
        p_hide_live: filters.hide_live,
        p_source_filter: filters.source_filter,
        p_offset: offset,
        p_limit: pageSize,
      }),
    ) as (Release & { total_count: number })[];

    const count = result[0]?.total_count ?? 0;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const data = result.map(({ total_count, ...release }) => release as Release);
    return { data, count };
  }

  /**
   * Get preferences for a user; returns defaults if none exist yet.
   */
  async getPreferences(userId: string): Promise<FeedPreferences> {
    const result = await this.supabase.client
      .from('user_feed_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (result.error) {
      const code = (result.error as unknown as Record<string, unknown>)?.['code'] as string;
      if (code === SUPABASE_ERRORS.NO_ROWS_FOUND) {
        return { ...DEFAULT_PREFERENCES };
      }
      throw new Error('Something went wrong. Please try again.');
    }

    return result.data as FeedPreferences;
  }

  /**
   * Upsert feed preferences for a user.
   */
  async savePreferences(userId: string, prefs: FeedPreferences): Promise<void> {
    unwrap(
      await this.supabase.client
        .from('user_feed_preferences')
        .upsert({ user_id: userId, ...prefs }),
    );
  }

  /**
   * Update last_checked_at to now, marking all current releases as seen.
   */
  async markAllSeen(userId: string): Promise<void> {
    const current = await this.getPreferences(userId);
    await this.savePreferences(userId, {
      ...current,
      last_checked_at: new Date().toISOString(),
    });
  }

  /**
   * Dismiss a release so it no longer appears in the feed.
   */
  async dismissRelease(userId: string, albumId: string): Promise<void> {
    unwrap(
      await this.supabase.client.from('user_release_state').upsert(
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

  /**
   * Un-dismiss a previously dismissed release.
   */
  async undismissRelease(userId: string, albumId: string): Promise<void> {
    unwrap(
      await this.supabase.client.from('user_release_state').upsert(
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

  /**
   * Return the set of album IDs dismissed by the user.
   */
  async getDismissedIds(userId: string): Promise<Set<string>> {
    const result = unwrap(
      await this.supabase.client
        .from('user_release_state')
        .select('spotify_album_id')
        .eq('user_id', userId)
        .eq('dismissed', true),
    ) as { spotify_album_id: string }[];

    return new Set(result.map((r) => r.spotify_album_id));
  }

  /**
   * Return all artist IDs the user follows.
   */
  async getUserArtistIds(userId: string): Promise<string[]> {
    const result = unwrap(
      await this.supabase.client
        .from('user_artists')
        .select('spotify_artist_id')
        .eq('user_id', userId),
    ) as { spotify_artist_id: string }[];

    return result.map((r) => r.spotify_artist_id);
  }

  /**
   * Batch upsert artists into the shared artists table, then into user_artists.
   * Processes in chunks of 500 to avoid request size limits.
   */
  async syncArtists(userId: string, artists: ArtistRow[], source: string): Promise<void> {
    for (let i = 0; i < artists.length; i += CHUNK_SIZE) {
      const chunk = artists.slice(i, i + CHUNK_SIZE);

      unwrap(
        await this.supabase.client.from('artists').upsert(
          chunk.map((a) => {
            const row: Record<string, unknown> = {
              spotify_artist_id: a.spotify_artist_id,
              artist_name: a.artist_name,
            };
            if (a.artist_image_url) {
              row['artist_image_url'] = a.artist_image_url;
            }
            return row;
          }),
        ),
      );

      // Then upsert user-artist associations (no artist metadata — join artists table for that)
      unwrap(
        await this.supabase.client.from('user_artists').upsert(
          chunk.map((a) => ({
            user_id: userId,
            spotify_artist_id: a.spotify_artist_id,
            source,
          })),
          { onConflict: 'user_id,spotify_artist_id' },
        ),
      );
    }
  }

  /**
   * Remove user_artists rows no longer present in the given active artist ID set.
   * Called after a full sync to clean up artists the user has unfollowed/removed.
   */
  async removeStaleArtists(userId: string, activeArtistIds: string[]): Promise<void> {
    const current = unwrap(
      await this.supabase.client
        .from('user_artists')
        .select('spotify_artist_id')
        .eq('user_id', userId),
    ) as { spotify_artist_id: string }[];

    const activeSet = new Set(activeArtistIds);
    const staleIds = current.map((r) => r.spotify_artist_id).filter((id) => !activeSet.has(id));

    for (let i = 0; i < staleIds.length; i += CHUNK_SIZE) {
      const chunk = staleIds.slice(i, i + CHUNK_SIZE);
      unwrap(
        await this.supabase.client
          .from('user_artists')
          .delete()
          .eq('user_id', userId)
          .in('spotify_artist_id', chunk),
      );
    }
  }

  /**
   * Subscribe to new release INSERT events filtered to the given artist IDs.
   * Returns an unsubscribe function.
   */
  subscribeToNewReleases(artistIds: string[], callback: (release: Release) => void): () => void {
    return this.realtime.subscribeToTable<Release>(
      'releases',
      (payload: RealtimePayload<Release>) => {
        if (payload.eventType === 'INSERT') {
          const release = payload.new as Release;
          if (artistIds.includes(release.spotify_artist_id)) {
            callback(release);
          }
        }
      },
    );
  }

  /**
   * Invoke the sync-releases Edge Function.
   * @param skipRecent If false, re-checks all artists regardless of last check time.
   */
  async triggerSync(userId: string, skipRecent = true): Promise<void> {
    const { error } = await this.supabase.client.functions.invoke('sync-releases', {
      body: { userId, skipRecent },
    });
    if (error) throw new Error('Something went wrong. Please try again.');
  }
}
