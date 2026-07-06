import { Injectable, inject } from '@angular/core';
import { SupabaseService } from '../supabase/supabase';
import { unwrap } from '../errors/error-mapper';
import type { Session } from '@supabase/supabase-js';

export interface SpotifyTokenRow {
  user_id: string;
  access_token: string;
  refresh_token: string;
  expires_at: string;
}

/**
 * Manages Spotify OAuth tokens stored in Supabase.
 *
 * getAccessToken() transparently refreshes expired tokens via the
 * refresh-spotify-token Edge Function. Concurrent refresh calls for the
 * same user are coalesced into one in-flight request.
 */
@Injectable({
  providedIn: 'root',
})
export class SpotifyAuthService {
  private supabase = inject(SupabaseService);

  // Deduplicates concurrent refresh calls for the same user
  private readonly refreshInFlight = new Map<string, Promise<string>>();

  // In-memory access-token cache (token + expiry epoch ms). getAccessToken is
  // called once per Spotify API request; during a full sync that's hundreds of
  // calls, each of which otherwise did a DB round-trip for the token.
  private readonly tokenCache = new Map<string, { token: string; expiresAt: number }>();

  /**
   * Upserts Spotify tokens for the given user into `user_spotify_tokens`.
   */
  async storeTokens(
    userId: string,
    accessToken: string,
    refreshToken: string,
    expiresInSeconds: number,
  ): Promise<void> {
    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000).toISOString();

    unwrap(
      await this.supabase.client.from('user_spotify_tokens').upsert(
        {
          user_id: userId,
          access_token: accessToken,
          refresh_token: refreshToken,
          expires_at: expiresAt,
        },
        { onConflict: 'user_id' },
      ),
    );

    // Freshly stored token supersedes anything cached for this user.
    this.tokenCache.set(userId, {
      token: accessToken,
      expiresAt: new Date(expiresAt).getTime(),
    });
  }

  /**
   * Returns the stored access token for the given user, refreshing it
   * automatically if it has expired.
   */
  async getAccessToken(userId: string): Promise<string> {
    const cached = this.tokenCache.get(userId);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.token;
    }

    const row = unwrap(
      await this.supabase.client
        .from('user_spotify_tokens')
        .select('access_token, expires_at')
        .eq('user_id', userId)
        .single(),
    ) as Pick<SpotifyTokenRow, 'access_token' | 'expires_at'>;

    const expiresAt = new Date(row.expires_at).getTime();
    if (expiresAt <= Date.now()) {
      return this.refreshToken(userId);
    }

    this.tokenCache.set(userId, { token: row.access_token, expiresAt });
    return row.access_token;
  }

  /**
   * Calls the refresh-spotify-token Edge Function to obtain a fresh access
   * token. Concurrent calls for the same user are coalesced.
   */
  async refreshToken(userId: string): Promise<string> {
    const inflight = this.refreshInFlight.get(userId);
    if (inflight) return inflight;

    const promise = this.supabase.client.functions
      .invoke('refresh-spotify-token', { body: { userId } })
      .then(({ data, error }) => {
        if (error) throw error;
        if (!data?.access_token) throw new Error('Token refresh failed');
        const token = data.access_token as string;
        if (data.expires_at) {
          this.tokenCache.set(userId, {
            token,
            expiresAt: new Date(data.expires_at).getTime(),
          });
        }
        return token;
      })
      .finally(() => this.refreshInFlight.delete(userId));

    this.refreshInFlight.set(userId, promise);
    return promise;
  }

  /**
   * Extracts `provider_token` and `provider_refresh_token` from the current
   * Supabase auth session (populated after OAuth sign-in) and stores them.
   */
  async captureTokensFromSession(userId: string, session: Session): Promise<void> {
    if (!session.provider_token) {
      throw new Error('No Spotify provider token found in current session');
    }

    // Supabase only returns `provider_refresh_token` on the initial OAuth
    // sign-in. Later SIGNED_IN events (session restore, multi-tab) can carry a
    // stale `provider_token` with no refresh token — storing that would clobber
    // the good refresh token we already have and brick refreshes an hour later.
    // Without a refresh token there is nothing durable worth persisting, so skip.
    if (!session.provider_refresh_token) {
      return;
    }

    // Spotify access tokens always expire in 3600s regardless of the Supabase
    // session lifetime, so don't derive expiry from the session expiry.
    await this.storeTokens(userId, session.provider_token, session.provider_refresh_token, 3600);
  }
}
