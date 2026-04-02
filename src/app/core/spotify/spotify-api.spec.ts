import { TestBed } from '@angular/core/testing';
import { SpotifyApiService, SpotifyArtist, SpotifyAlbum } from './spotify-api';
import { AuthService } from '../auth/auth';
import { SpotifyAuthService } from './spotify-auth';

const MOCK_USER_ID = 'user-123';

const mockArtist = (id: string): SpotifyArtist => ({
  id,
  name: `Artist ${id}`,
  images: [{ url: `https://img/${id}`, height: 300, width: 300 }],
});

const mockAlbum = (id: string, artistId = 'artist-1'): SpotifyAlbum => ({
  id,
  name: `Album ${id}`,
  album_type: 'album',
  release_date: '2024-01-01',
  total_tracks: 10,
  images: [{ url: `https://img/${id}`, height: 300, width: 300 }],
  external_urls: { spotify: `https://open.spotify.com/album/${id}` },
  artists: [{ id: artistId, name: `Artist ${artistId}` }],
});

describe('SpotifyApiService', () => {
  let service: SpotifyApiService;
  let fetchMock: ReturnType<typeof vi.fn>;
  let mockAuth: { currentUser: ReturnType<typeof vi.fn> };
  let mockSpotifyAuth: {
    getAccessToken: ReturnType<typeof vi.fn>;
    refreshToken: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    mockAuth = {
      currentUser: vi.fn().mockReturnValue({ id: MOCK_USER_ID }),
    };

    mockSpotifyAuth = {
      getAccessToken: vi.fn().mockResolvedValue('mock-access-token'),
      refreshToken: vi.fn().mockResolvedValue('fresh-access-token'),
    };

    TestBed.configureTestingModule({
      providers: [
        SpotifyApiService,
        { provide: AuthService, useValue: mockAuth },
        { provide: SpotifyAuthService, useValue: mockSpotifyAuth },
      ],
    });

    service = TestBed.inject(SpotifyApiService);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  function makeOkResponse(body: unknown) {
    return {
      ok: true,
      status: 200,
      statusText: 'OK',
      json: () => Promise.resolve(body),
      headers: { get: () => null },
    };
  }

  // ---------------------------------------------------------------------------
  // getFollowedArtists
  // ---------------------------------------------------------------------------

  describe('getFollowedArtists', () => {
    it('should return artists from a single page', async () => {
      fetchMock.mockResolvedValueOnce(
        makeOkResponse({
          artists: { items: [mockArtist('a1'), mockArtist('a2')], next: null },
        }),
      );

      const result = await service.getFollowedArtists();

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('a1');
      expect(result[1].id).toBe('a2');
    });

    it('should paginate through multiple pages', async () => {
      fetchMock
        .mockResolvedValueOnce(
          makeOkResponse({
            artists: {
              items: [mockArtist('a1')],
              next: 'https://api.spotify.com/v1/me/following?type=artist&limit=50&after=a1',
            },
          }),
        )
        .mockResolvedValueOnce(
          makeOkResponse({
            artists: { items: [mockArtist('a2')], next: null },
          }),
        );

      const result = await service.getFollowedArtists();

      expect(result).toHaveLength(2);
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('should include Authorization header', async () => {
      fetchMock.mockResolvedValueOnce(makeOkResponse({ artists: { items: [], next: null } }));

      await service.getFollowedArtists();

      expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/me/following'), {
        headers: { Authorization: 'Bearer mock-access-token' },
      });
    });

    it('should throw when user is not authenticated', async () => {
      mockAuth.currentUser.mockReturnValue(null);

      await expect(service.getFollowedArtists()).rejects.toThrow('No authenticated user');
    });

    it('should throw on non-200, non-401, non-429 response', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        headers: { get: () => null },
      });

      await expect(service.getFollowedArtists()).rejects.toThrow('Spotify API error: 403');
    });
  });

  // ---------------------------------------------------------------------------
  // getSavedAlbumArtists
  // ---------------------------------------------------------------------------

  describe('getSavedAlbumArtists', () => {
    it('should return unique artists from saved albums', async () => {
      fetchMock.mockResolvedValueOnce(
        makeOkResponse({
          items: [
            { album: mockAlbum('alb1', 'artist-1') },
            { album: mockAlbum('alb2', 'artist-1') }, // duplicate artist
            { album: mockAlbum('alb3', 'artist-2') },
          ],
          next: null,
        }),
      );

      const result = await service.getSavedAlbumArtists();

      expect(result).toHaveLength(2);
      expect(result.map((a) => a.id).sort()).toEqual(['artist-1', 'artist-2']);
    });

    it('should paginate through multiple pages', async () => {
      fetchMock
        .mockResolvedValueOnce(
          makeOkResponse({
            items: [{ album: mockAlbum('alb1', 'artist-1') }],
            next: 'https://api.spotify.com/v1/me/albums?limit=50&offset=50',
          }),
        )
        .mockResolvedValueOnce(
          makeOkResponse({
            items: [{ album: mockAlbum('alb2', 'artist-2') }],
            next: null,
          }),
        );

      const result = await service.getSavedAlbumArtists();

      expect(result).toHaveLength(2);
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });
  });

  // ---------------------------------------------------------------------------
  // getArtistAlbums
  // ---------------------------------------------------------------------------

  describe('getArtistAlbums', () => {
    it('should return albums for a given artist', async () => {
      fetchMock.mockResolvedValueOnce(
        makeOkResponse({ items: [mockAlbum('alb1'), mockAlbum('alb2')] }),
      );

      const result = await service.getArtistAlbums('artist-1');

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('alb1');
    });

    it('should use default limit of 5', async () => {
      fetchMock.mockResolvedValueOnce(makeOkResponse({ items: [] }));

      await service.getArtistAlbums('artist-1');

      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('limit=5'),
        expect.any(Object),
      );
    });

    it('should use custom limit when provided', async () => {
      fetchMock.mockResolvedValueOnce(makeOkResponse({ items: [] }));

      await service.getArtistAlbums('artist-1', 10);

      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('limit=10'),
        expect.any(Object),
      );
    });

    it('should include include_groups=album,single in request', async () => {
      fetchMock.mockResolvedValueOnce(makeOkResponse({ items: [] }));

      await service.getArtistAlbums('artist-99');

      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('include_groups=album,single'),
        expect.any(Object),
      );
    });
  });

  // ---------------------------------------------------------------------------
  // Rate limiting (429 retry)
  // ---------------------------------------------------------------------------

  describe('401 token expiry', () => {
    it('should refresh token and retry once on 401', async () => {
      fetchMock
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          statusText: 'Unauthorized',
          headers: { get: () => null },
        })
        .mockResolvedValueOnce(
          makeOkResponse({ artists: { items: [mockArtist('a1')], next: null } }),
        );

      const result = await service.getFollowedArtists();

      expect(result).toHaveLength(1);
      expect(mockSpotifyAuth.refreshToken).toHaveBeenCalledWith(MOCK_USER_ID);
      expect(fetchMock).toHaveBeenCalledTimes(2);
      // Second call should use the fresh token
      expect(fetchMock).toHaveBeenLastCalledWith(expect.any(String), {
        headers: { Authorization: 'Bearer fresh-access-token' },
      });
    });

    it('should throw if retry after 401 also fails', async () => {
      fetchMock
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          statusText: 'Unauthorized',
          headers: { get: () => null },
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 403,
          statusText: 'Forbidden',
          headers: { get: () => null },
        });

      await expect(service.getFollowedArtists()).rejects.toThrow('Spotify API error: 403');
    });
  });

  describe('429 rate limiting', () => {
    it('should retry once after Retry-After delay on 429 and return result', async () => {
      // Use 0-second delay so we don't need fake timers
      fetchMock
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          statusText: 'Too Many Requests',
          headers: { get: (h: string) => (h === 'Retry-After' ? '0' : null) },
        })
        .mockResolvedValueOnce(
          makeOkResponse({ artists: { items: [mockArtist('a1')], next: null } }),
        );

      const result = await service.getFollowedArtists();

      expect(result).toHaveLength(1);
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('should throw if retry after 429 also fails', async () => {
      fetchMock
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          statusText: 'Too Many Requests',
          headers: { get: (h: string) => (h === 'Retry-After' ? '0' : null) },
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          headers: { get: () => null },
        });

      await expect(service.getFollowedArtists()).rejects.toThrow('Spotify API error: 500');
    });
  });
});
