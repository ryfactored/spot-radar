import { TestBed } from '@angular/core/testing';
import { SpotifyAuthService } from './spotify-auth';
import { SupabaseService } from '../supabase/supabase';

describe('SpotifyAuthService', () => {
  let service: SpotifyAuthService;
  let mockSupabase: any;

  // Helpers to build a fresh Supabase query-chain mock
  function makeUpsertChain(resolvedValue: { data: unknown; error: unknown }) {
    const upsert = vi.fn().mockResolvedValue(resolvedValue);
    mockSupabase.client.from.mockReturnValueOnce({ upsert });
    return { upsert };
  }

  function makeSelectChain(resolvedValue: { data: unknown; error: unknown }) {
    const single = vi.fn().mockResolvedValue(resolvedValue);
    const eq = vi.fn().mockReturnValue({ single });
    const select = vi.fn().mockReturnValue({ eq });
    mockSupabase.client.from.mockReturnValueOnce({ select });
    return { select, eq, single };
  }

  beforeEach(() => {
    mockSupabase = {
      client: {
        from: vi.fn(),
        auth: {
          getSession: vi.fn().mockResolvedValue({
            data: {
              session: {
                provider_token: 'access-tok',
                provider_refresh_token: 'refresh-tok',
                expires_at: Math.floor(Date.now() / 1000) + 3600,
              },
            },
          }),
        },
      },
    };

    TestBed.configureTestingModule({
      providers: [SpotifyAuthService, { provide: SupabaseService, useValue: mockSupabase }],
    });

    service = TestBed.inject(SpotifyAuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ---------------------------------------------------------------------------
  // storeTokens
  // ---------------------------------------------------------------------------

  describe('storeTokens', () => {
    it('should upsert token row into user_spotify_tokens', async () => {
      const { upsert } = makeUpsertChain({ data: null, error: null });

      await service.storeTokens('user-1', 'tok-abc', 'ref-xyz', 3600);

      expect(mockSupabase.client.from).toHaveBeenCalledWith('user_spotify_tokens');
      expect(upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user-1',
          access_token: 'tok-abc',
          refresh_token: 'ref-xyz',
        }),
        { onConflict: 'user_id' },
      );
    });

    it('should set expires_at roughly expiresInSeconds from now', async () => {
      const { upsert } = makeUpsertChain({ data: null, error: null });
      const before = Date.now();

      await service.storeTokens('user-1', 'tok', 'ref', 7200);

      const after = Date.now();
      const [[upsertArg]] = upsert.mock.calls;
      const expiresAt = new Date(upsertArg.expires_at).getTime();

      expect(expiresAt).toBeGreaterThanOrEqual(before + 7200 * 1000);
      expect(expiresAt).toBeLessThanOrEqual(after + 7200 * 1000);
    });

    it('should throw when Supabase returns an error', async () => {
      makeUpsertChain({ data: null, error: { message: 'DB error' } });

      await expect(service.storeTokens('u', 'a', 'r', 3600)).rejects.toThrow();
    });
  });

  // ---------------------------------------------------------------------------
  // getAccessToken
  // ---------------------------------------------------------------------------

  describe('getAccessToken', () => {
    it('should return the access token when not expired', async () => {
      const futureExpiry = new Date(Date.now() + 60_000).toISOString();
      makeSelectChain({
        data: { access_token: 'valid-token', expires_at: futureExpiry },
        error: null,
      });

      const token = await service.getAccessToken('user-1');

      expect(token).toBe('valid-token');
    });

    it('should throw when token is expired', async () => {
      const pastExpiry = new Date(Date.now() - 1000).toISOString();
      makeSelectChain({ data: { access_token: 'old-token', expires_at: pastExpiry }, error: null });

      await expect(service.getAccessToken('user-1')).rejects.toThrow(
        'Spotify access token has expired',
      );
    });

    it('should throw when Supabase returns an error', async () => {
      makeSelectChain({ data: null, error: { message: 'not found' } });

      await expect(service.getAccessToken('user-1')).rejects.toThrow();
    });
  });

  // ---------------------------------------------------------------------------
  // captureTokensFromSession
  // ---------------------------------------------------------------------------

  describe('captureTokensFromSession', () => {
    const mockSession = {
      provider_token: 'access-tok',
      provider_refresh_token: 'refresh-tok',
      expires_at: Math.floor(Date.now() / 1000) + 3600,
    } as any;

    it('should store tokens extracted from the provided session', async () => {
      const { upsert } = makeUpsertChain({ data: null, error: null });

      await service.captureTokensFromSession('user-1', mockSession);

      expect(upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user-1',
          access_token: 'access-tok',
          refresh_token: 'refresh-tok',
        }),
        { onConflict: 'user_id' },
      );
    });

    it('should throw when no provider_token is present in session', async () => {
      await expect(
        service.captureTokensFromSession('user-1', { ...mockSession, provider_token: null }),
      ).rejects.toThrow('No Spotify provider token found in current session');
    });
  });
});
