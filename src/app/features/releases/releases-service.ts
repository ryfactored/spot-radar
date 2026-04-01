import { Injectable, inject } from '@angular/core';
import { SupabaseService, RealtimeService } from '@core';
import { unwrap, unwrapWithCount } from '@core';
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
  spotify_url: string;
  track_count: number;
  fetched_at: string;
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

const DEFAULT_PREFERENCES: FeedPreferences = {
  release_type_filter: 'everything',
  min_track_count: 0,
  recency_days: 90,
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
    artistIds: string[],
    filters: FeedPreferences,
    page: number,
    pageSize: number,
  ): Promise<{ data: Release[]; count: number }> {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - filters.recency_days);
    const cutoffIso = cutoff.toISOString().split('T')[0];

    let query = this.supabase.client
      .from('releases')
      .select('*', { count: 'exact' })
      .in('spotify_artist_id', artistIds)
      .gte('release_date', cutoffIso)
      .gte('track_count', filters.min_track_count)
      .order('release_date', { ascending: false })
      .range(from, to);

    if (filters.release_type_filter !== 'everything') {
      query = query.eq('release_type', filters.release_type_filter);
    }

    return unwrapWithCount(await query);
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
      await this.supabase.client.from('user_release_state').upsert({
        user_id: userId,
        spotify_album_id: albumId,
        dismissed: true,
        dismissed_at: new Date().toISOString(),
      }),
    );
  }

  /**
   * Un-dismiss a previously dismissed release.
   */
  async undismissRelease(userId: string, albumId: string): Promise<void> {
    unwrap(
      await this.supabase.client.from('user_release_state').upsert({
        user_id: userId,
        spotify_album_id: albumId,
        dismissed: false,
        dismissed_at: null,
      }),
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

      // Upsert into the shared artists table first
      unwrap(
        await this.supabase.client.from('artists').upsert(
          chunk.map((a) => ({
            spotify_artist_id: a.spotify_artist_id,
            artist_name: a.artist_name,
            artist_image_url: a.artist_image_url,
          })),
        ),
      );

      // Then upsert user-artist associations
      unwrap(
        await this.supabase.client.from('user_artists').upsert(
          chunk.map((a) => ({
            user_id: userId,
            spotify_artist_id: a.spotify_artist_id,
            source,
          })),
        ),
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
   * Invoke the sync-releases Edge Function to trigger an onboarding sync.
   */
  async triggerOnboardingSync(userId: string): Promise<void> {
    const { error } = await this.supabase.client.functions.invoke('sync-releases', {
      body: { userId },
    });
    if (error) throw new Error('Something went wrong. Please try again.');
  }
}
