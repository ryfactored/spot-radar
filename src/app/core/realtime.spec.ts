import { TestBed } from '@angular/core/testing';

import { RealtimeService } from './realtime';
import { SupabaseService } from './supabase';

describe('RealtimeService', () => {
  let service: RealtimeService;
  let mockChannel: {
    on: ReturnType<typeof vi.fn>;
    subscribe: ReturnType<typeof vi.fn>;
    unsubscribe: ReturnType<typeof vi.fn>;
  };
  let mockSupabase: {
    isBrowser: boolean;
    client: { channel: ReturnType<typeof vi.fn> };
  };
  let subscribeCallback: ((status: string) => void) | null = null;

  beforeEach(() => {
    subscribeCallback = null;

    mockChannel = {
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn((cb) => {
        subscribeCallback = cb;
        return mockChannel;
      }),
      unsubscribe: vi.fn(),
    };

    mockSupabase = {
      isBrowser: true,
      client: {
        channel: vi.fn().mockReturnValue(mockChannel),
      },
    };

    TestBed.configureTestingModule({
      providers: [RealtimeService, { provide: SupabaseService, useValue: mockSupabase }],
    });

    service = TestBed.inject(RealtimeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start with disconnected status', () => {
    expect(service.connectionStatus()).toBe('disconnected');
  });

  describe('subscribeToTable', () => {
    it('should create a channel with correct name', () => {
      service.subscribeToTable('notes', () => {});

      expect(mockSupabase.client.channel).toHaveBeenCalledWith(expect.stringContaining('notes-changes-'));
    });

    it('should subscribe to postgres_changes with correct config', () => {
      service.subscribeToTable('notes', () => {}, 'user_id=eq.123');

      expect(mockChannel.on).toHaveBeenCalledWith(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notes',
          filter: 'user_id=eq.123',
        },
        expect.any(Function),
      );
    });

    it('should set status to connecting when subscribing', () => {
      service.subscribeToTable('notes', () => {});

      expect(service.connectionStatus()).toBe('connecting');
    });

    it('should set status to connected on SUBSCRIBED', () => {
      service.subscribeToTable('notes', () => {});
      subscribeCallback?.('SUBSCRIBED');

      expect(service.connectionStatus()).toBe('connected');
    });

    it('should set status to reconnecting on CHANNEL_ERROR', () => {
      service.subscribeToTable('notes', () => {});
      subscribeCallback?.('CHANNEL_ERROR');

      expect(service.connectionStatus()).toBe('reconnecting');
    });

    it('should set status to disconnected on CLOSED', () => {
      service.subscribeToTable('notes', () => {});
      subscribeCallback?.('SUBSCRIBED');
      subscribeCallback?.('CLOSED');

      expect(service.connectionStatus()).toBe('disconnected');
    });

    it('should call callback with payload on postgres_changes', () => {
      const callback = vi.fn();
      service.subscribeToTable('notes', callback);

      // Get the handler passed to .on()
      const onHandler = mockChannel.on.mock.calls[0][2];
      onHandler({
        eventType: 'INSERT',
        new: { id: '1', title: 'Test' },
        old: {},
      });

      expect(callback).toHaveBeenCalledWith({
        eventType: 'INSERT',
        new: { id: '1', title: 'Test' },
        old: {},
      });
    });

    it('should return cleanup function that unsubscribes', () => {
      const cleanup = service.subscribeToTable('notes', () => {});
      subscribeCallback?.('SUBSCRIBED');

      cleanup();

      expect(mockChannel.unsubscribe).toHaveBeenCalled();
    });

    it('should set status to disconnected when last channel unsubscribes', () => {
      const cleanup = service.subscribeToTable('notes', () => {});
      subscribeCallback?.('SUBSCRIBED');

      cleanup();

      expect(service.connectionStatus()).toBe('disconnected');
    });

    it('should return no-op for SSR', () => {
      mockSupabase.isBrowser = false;
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [RealtimeService, { provide: SupabaseService, useValue: mockSupabase }],
      });
      const ssrService = TestBed.inject(RealtimeService);

      const cleanup = ssrService.subscribeToTable('notes', () => {});

      expect(mockSupabase.client.channel).not.toHaveBeenCalled();
      expect(() => cleanup()).not.toThrow();
    });
  });

  describe('disconnectAll', () => {
    it('should unsubscribe all channels', () => {
      service.subscribeToTable('notes', () => {});
      service.subscribeToTable('profiles', () => {});

      service.disconnectAll();

      expect(mockChannel.unsubscribe).toHaveBeenCalledTimes(2);
    });

    it('should set status to disconnected', () => {
      service.subscribeToTable('notes', () => {});
      subscribeCallback?.('SUBSCRIBED');

      service.disconnectAll();

      expect(service.connectionStatus()).toBe('disconnected');
    });

    it('should clear channels map', () => {
      const cleanup1 = service.subscribeToTable('notes', () => {});
      service.disconnectAll();

      // Calling cleanup after disconnectAll should not throw
      expect(() => cleanup1()).not.toThrow();
    });
  });
});
