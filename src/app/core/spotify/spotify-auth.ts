import { Injectable, inject } from '@angular/core';
import { SupabaseService } from '../supabase/supabase';
import { unwrap } from '../errors/error-mapper';

export interface SpotifyTokenRow {
  user_id: string;
  access_token: string;
  refresh_token: string;
  expires_at: string;
}

/**
 * Manages Spotify OAuth tokens stored in Supabase.
 *
 * Token refresh is handled server-side by Edge Functions.
 * This service only reads/writes tokens and validates expiry client-side.
 */
@Injectable({
  providedIn: 'root',
})
export class SpotifyAuthService {
  private supabase = inject(SupabaseService);

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
      await this.supabase.client.schema('public').from('user_spotify_tokens').upsert(
        {
          user_id: userId,
          access_token: accessToken,
          refresh_token: refreshToken,
          expires_at: expiresAt,
        },
        { onConflict: 'user_id' },
      ),
    );
  }

  /**
   * Reads the stored access token for the given user.
   * Throws if no token exists or if the token has expired.
   * Token refresh must be handled by an Edge Function.
   */
  async getAccessToken(userId: string): Promise<string> {
    const row = unwrap(
      await this.supabase.client
        .schema('public')
        .from('user_spotify_tokens')
        .select('access_token, expires_at')
        .eq('user_id', userId)
        .single(),
    ) as Pick<SpotifyTokenRow, 'access_token' | 'expires_at'>;

    if (new Date(row.expires_at) <= new Date()) {
      throw new Error('Spotify access token has expired');
    }

    return row.access_token;
  }

  /**
   * Extracts `provider_token` and `provider_refresh_token` from the current
   * Supabase auth session (populated after OAuth sign-in) and stores them.
   */
  async captureTokensFromSession(userId: string): Promise<void> {
    const {
      data: { session },
    } = await this.supabase.client.auth.getSession();

    if (!session?.provider_token) {
      throw new Error('No Spotify provider token found in current session');
    }

    // Spotify tokens expire in 3600 s by default; use expires_at from session
    // when available, otherwise fall back to 1 hour.
    const expiresInSeconds = session.expires_at
      ? Math.max(0, session.expires_at - Math.floor(Date.now() / 1000))
      : 3600;

    await this.storeTokens(
      userId,
      session.provider_token,
      session.provider_refresh_token ?? '',
      expiresInSeconds,
    );
  }
}
