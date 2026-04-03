import { TestBed } from '@angular/core/testing';
import { ReleasesService, Release, FeedPreferences } from './releases-service';
import { SupabaseService, RealtimeService } from '@core';

describe('ReleasesService', () => {
  let service: ReleasesService;
  let mockSupabaseClient: any;
  let mockRealtimeService: any;

  const userId = 'user-123';

  const mockRelease: Release = {
    spotify_album_id: 'album-1',
    spotify_artist_id: 'artist-1',
    artist_name: 'Test Artist',
    title: 'Test Album',
    release_type: 'album',
    release_date: '2024-01-15',
    image_url: 'https://example.com/image.jpg',
    track_count: 12,
    artist_source: 'followed',
  };

  const mockPreferences: FeedPreferences = {
    release_type_filter: 'everything',
    min_track_count: 0,
    recency_days: 90,
    hide_live: false,
    source_filter: 'all',
    last_checked_at: null,
  };

  function buildChainableMock(resolvedValue: any) {
    const chainable: any = {};
    const methods = [
      'select',
      'insert',
      'upsert',
      'update',
      'delete',
      'eq',
      'neq',
      'in',
      'gte',
      'lte',
      'order',
      'range',
      'single',
    ];
    methods.forEach((m) => {
      chainable[m] = vi.fn().mockReturnValue(chainable);
    });
    // Make it awaitable as the final call
    chainable.then = (resolve: any) => Promise.resolve(resolvedValue).then(resolve);
    // Also make select().eq().single() resolve correctly
    chainable.single = vi.fn().mockResolvedValue(resolvedValue);
    return chainable;
  }

  beforeEach(() => {
    mockSupabaseClient = {
      from: vi.fn(),
      rpc: vi.fn(),
      functions: {
        invoke: vi.fn().mockResolvedValue({
          data: { total: 0, checked: 0, remaining: 0, done: true },
          error: null,
        }),
      },
    };

    mockRealtimeService = {
      subscribeToTable: vi.fn().mockReturnValue(() => {}),
    };

    TestBed.configureTestingModule({
      providers: [
        ReleasesService,
        { provide: SupabaseService, useValue: { client: mockSupabaseClient } },
        { provide: RealtimeService, useValue: mockRealtimeService },
      ],
    });

    service = TestBed.inject(ReleasesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getFeed', () => {
    it('should call get_user_feed RPC with correct params', async () => {
      const row = { ...mockRelease, total_count: 1 };
      mockSupabaseClient.rpc.mockResolvedValue({ data: [row], error: null });

      const result = await service.getFeed(userId, mockPreferences, 1, 10);

      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith(
        'get_user_feed',
        expect.objectContaining({ p_user_id: userId, p_offset: 0, p_limit: 10 }),
      );
      expect(result.data).toEqual([mockRelease]);
      expect(result.count).toBe(1);
    });

    it('should pass release type filter to RPC', async () => {
      mockSupabaseClient.rpc.mockResolvedValue({ data: [], error: null });

      await service.getFeed(userId, { ...mockPreferences, release_type_filter: 'album' }, 1, 10);

      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith(
        'get_user_feed',
        expect.objectContaining({ p_release_type: 'album' }),
      );
    });

    it('should pass "everything" filter to RPC unchanged', async () => {
      mockSupabaseClient.rpc.mockResolvedValue({ data: [], error: null });

      await service.getFeed(userId, mockPreferences, 1, 10);

      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith(
        'get_user_feed',
        expect.objectContaining({ p_release_type: 'everything' }),
      );
    });
  });

  describe('getPreferences', () => {
    it('should return user preferences when row exists', async () => {
      const chainable: any = {};
      chainable.select = vi.fn().mockReturnValue(chainable);
      chainable.eq = vi.fn().mockReturnValue(chainable);
      chainable.single = vi.fn().mockResolvedValue({ data: mockPreferences, error: null });
      mockSupabaseClient.from.mockReturnValue(chainable);

      const result = await service.getPreferences(userId);

      expect(result).toEqual(mockPreferences);
    });

    it('should return defaults when PGRST116 error occurs', async () => {
      const chainable: any = {};
      chainable.select = vi.fn().mockReturnValue(chainable);
      chainable.eq = vi.fn().mockReturnValue(chainable);
      chainable.single = vi.fn().mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'No rows found' },
      });
      mockSupabaseClient.from.mockReturnValue(chainable);

      const result = await service.getPreferences(userId);

      expect(result).toEqual({
        release_type_filter: 'everything',
        min_track_count: 0,
        recency_days: 90,
        hide_live: false,
        source_filter: 'all',
        last_checked_at: null,
      });
    });

    it('should throw on non-PGRST116 errors', async () => {
      const chainable: any = {};
      chainable.select = vi.fn().mockReturnValue(chainable);
      chainable.eq = vi.fn().mockReturnValue(chainable);
      chainable.single = vi.fn().mockResolvedValue({
        data: null,
        error: { code: 'OTHER_ERROR', message: 'Database error' },
      });
      mockSupabaseClient.from.mockReturnValue(chainable);

      await expect(service.getPreferences(userId)).rejects.toThrow('Something went wrong');
    });
  });

  describe('savePreferences', () => {
    it('should upsert preferences with user_id', async () => {
      const upsertMock = vi.fn().mockResolvedValue({ data: null, error: null });
      mockSupabaseClient.from.mockReturnValue({ upsert: upsertMock });

      await service.savePreferences(userId, mockPreferences);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('user_feed_preferences');
      expect(upsertMock).toHaveBeenCalledWith(
        expect.objectContaining({ user_id: userId, ...mockPreferences }),
      );
    });
  });

  describe('getDismissedIds', () => {
    it('should return a Set of dismissed album IDs', async () => {
      const chainable: any = {};
      chainable.select = vi.fn().mockReturnValue(chainable);
      chainable.eq = vi.fn().mockReturnValue(chainable);
      chainable.then = (resolve: any) =>
        Promise.resolve({ data: [{ spotify_album_id: 'album-1' }], error: null }).then(resolve);
      mockSupabaseClient.from.mockReturnValue(chainable);

      const result = await service.getDismissedIds(userId);

      expect(result).toBeInstanceOf(Set);
      expect(result.has('album-1')).toBe(true);
    });

    it('should return an empty Set when no dismissed releases', async () => {
      const chainable: any = {};
      chainable.select = vi.fn().mockReturnValue(chainable);
      chainable.eq = vi.fn().mockReturnValue(chainable);
      chainable.then = (resolve: any) => Promise.resolve({ data: [], error: null }).then(resolve);
      mockSupabaseClient.from.mockReturnValue(chainable);

      const result = await service.getDismissedIds(userId);

      expect(result).toBeInstanceOf(Set);
      expect(result.size).toBe(0);
    });
  });

  describe('dismissRelease', () => {
    it('should upsert with dismissed: true', async () => {
      const upsertMock = vi.fn().mockResolvedValue({ data: null, error: null });
      mockSupabaseClient.from.mockReturnValue({ upsert: upsertMock });

      await service.dismissRelease(userId, 'album-1');

      expect(upsertMock).toHaveBeenCalledWith(
        expect.objectContaining({ dismissed: true, spotify_album_id: 'album-1' }),
        expect.objectContaining({ onConflict: 'user_id,spotify_album_id' }),
      );
    });
  });

  describe('undismissRelease', () => {
    it('should upsert with dismissed: false', async () => {
      const upsertMock = vi.fn().mockResolvedValue({ data: null, error: null });
      mockSupabaseClient.from.mockReturnValue({ upsert: upsertMock });

      await service.undismissRelease(userId, 'album-1');

      expect(upsertMock).toHaveBeenCalledWith(
        expect.objectContaining({ dismissed: false, dismissed_at: null }),
        expect.objectContaining({ onConflict: 'user_id,spotify_album_id' }),
      );
    });
  });

  describe('getUserArtistIds', () => {
    it('should return array of artist IDs', async () => {
      const chainable: any = {};
      chainable.select = vi.fn().mockReturnValue(chainable);
      chainable.eq = vi.fn().mockReturnValue(chainable);
      chainable.then = (resolve: any) =>
        Promise.resolve({
          data: [{ spotify_artist_id: 'artist-1' }, { spotify_artist_id: 'artist-2' }],
          error: null,
        }).then(resolve);
      mockSupabaseClient.from.mockReturnValue(chainable);

      const result = await service.getUserArtistIds(userId);

      expect(result).toEqual(['artist-1', 'artist-2']);
    });
  });

  describe('syncArtists', () => {
    it('should upsert into artists then user_artists', async () => {
      const upsertMock = vi.fn().mockResolvedValue({ data: null, error: null });
      mockSupabaseClient.from.mockReturnValue({ upsert: upsertMock });

      const artists = [{ spotify_artist_id: 'artist-1', artist_name: 'Artist 1' }];

      await service.syncArtists(userId, artists, 'spotify');

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('artists');
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('user_artists');
    });
  });

  describe('subscribeToNewReleases', () => {
    it('should call realtime.subscribeToTable with releases table', () => {
      const callback = vi.fn();
      service.subscribeToNewReleases(['artist-1'], callback);

      expect(mockRealtimeService.subscribeToTable).toHaveBeenCalledWith(
        'releases',
        expect.any(Function),
      );
    });

    it('should return an unsubscribe function', () => {
      const unsubscribe = service.subscribeToNewReleases(['artist-1'], vi.fn());
      expect(typeof unsubscribe).toBe('function');
    });
  });

  describe('triggerSync', () => {
    it('should invoke sync-releases function with userId', async () => {
      await service.triggerSync(userId);

      expect(mockSupabaseClient.functions.invoke).toHaveBeenCalledWith('sync-releases', {
        body: { userId, skipRecent: true },
      });
    });

    it('should throw on function invocation error', async () => {
      mockSupabaseClient.functions.invoke.mockResolvedValue({
        data: null,
        error: new Error('Function error'),
      });

      await expect(service.triggerSync(userId)).rejects.toThrow('Something went wrong');
    });
  });
});
