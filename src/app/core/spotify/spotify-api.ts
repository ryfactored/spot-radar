import { Injectable, inject } from '@angular/core';
import { AuthService } from '../auth/auth';
import { SpotifyAuthService } from './spotify-auth';

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

const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';

/**
 * Wraps Spotify Web API calls.
 *
 * All requests are authenticated via SpotifyAuthService tokens.
 * 429 rate-limit responses are retried once after the Retry-After delay.
 */
@Injectable({
  providedIn: 'root',
})
export class SpotifyApiService {
  private auth = inject(AuthService);
  private spotifyAuth = inject(SpotifyAuthService);
  private savedAlbumCache = new Map<string, SpotifyAlbum[]>();

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private getUserId(): string {
    const id = this.auth.currentUser()?.id;
    if (!id) throw new Error('No authenticated user');
    return id;
  }

  /**
   * Fetches a Spotify API URL with Bearer auth.
   * - Retries once on 429 (Too Many Requests) using the Retry-After header.
   * - Retries once on 401 (Unauthorized) after refreshing the access token,
   *   covering the race where the token expires between DB read and API call.
   */
  private async fetchWithAuth(url: string): Promise<unknown> {
    const userId = this.getUserId();
    const accessToken = await this.spotifyAuth.getAccessToken(userId);

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (response.status === 429) {
      const retryAfter = Number(response.headers.get('Retry-After') ?? '1');
      await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));

      const retryResponse = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!retryResponse.ok) {
        throw new Error(`Spotify API error: ${retryResponse.status} ${retryResponse.statusText}`);
      }
      return retryResponse.json();
    }

    if (response.status === 401) {
      // Token expired between our DB read and Spotify receiving the request — refresh and retry once
      const freshToken = await this.spotifyAuth.refreshToken(userId);
      const retryResponse = await fetch(url, {
        headers: { Authorization: `Bearer ${freshToken}` },
      });
      if (!retryResponse.ok) {
        throw new Error(`Spotify API error: ${retryResponse.status} ${retryResponse.statusText}`);
      }
      return retryResponse.json();
    }

    if (!response.ok) {
      throw new Error(`Spotify API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // ---------------------------------------------------------------------------
  // Public methods
  // ---------------------------------------------------------------------------

  /**
   * Returns all artists the current user follows via cursor-based pagination.
   */
  async getFollowedArtists(): Promise<SpotifyArtist[]> {
    const artists: SpotifyArtist[] = [];
    let url: string | null = `${SPOTIFY_API_BASE}/me/following?type=artist&limit=50`;

    while (url) {
      const data = (await this.fetchWithAuth(url)) as {
        artists: { items: SpotifyArtist[]; next: string | null };
      };
      artists.push(...data.artists.items);
      url = data.artists.next;
    }

    return artists;
  }

  /**
   * Returns unique artists from the current user's saved albums.
   */
  async getSavedAlbumArtists(): Promise<SpotifyArtist[]> {
    const artistMap = new Map<string, SpotifyArtist>();
    let url: string | null = `${SPOTIFY_API_BASE}/me/albums?limit=50`;

    while (url) {
      const data = (await this.fetchWithAuth(url)) as {
        items: { album: SpotifyAlbum }[];
        next: string | null;
      };

      for (const { album } of data.items) {
        for (const artist of album.artists) {
          if (!artistMap.has(artist.id)) {
            // Saved album artist stubs lack images; store with empty images array.
            artistMap.set(artist.id, { id: artist.id, name: artist.name, images: [] });
          }
        }
      }

      url = data.next;
    }

    return Array.from(artistMap.values());
  }

  /**
   * Returns recent albums/singles for the given artist.
   * @param artistId Spotify artist ID
   * @param limit    Maximum number of releases to return (default 5)
   */
  async getArtistAlbums(artistId: string, limit = 5): Promise<SpotifyAlbum[]> {
    const url =
      `${SPOTIFY_API_BASE}/artists/${artistId}/albums` +
      `?include_groups=album,single&limit=${limit}`;

    const data = (await this.fetchWithAuth(url)) as { items: SpotifyAlbum[] };
    return data.items;
  }

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
}
