import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ChatStore } from './chat-store';
import { Message } from './chat';
import { RealtimeService } from '@core';

describe('ChatStore', () => {
  let store: ChatStore;
  let realtimeMock: {
    connectionStatus: ReturnType<typeof signal>;
    subscribeToTable: ReturnType<typeof vi.fn>;
    disconnectAll: ReturnType<typeof vi.fn>;
  };
  let mockUnsubscribe: ReturnType<typeof vi.fn>;

  const mockMessage: Message = {
    id: '1',
    user_id: 'user-1',
    username: 'alice',
    content: 'Hello!',
    created_at: '2024-01-01T10:00:00Z',
  };

  const mockMessage2: Message = {
    id: '2',
    user_id: 'user-2',
    username: 'bob',
    content: 'Hi there!',
    created_at: '2024-01-01T10:01:00Z',
  };

  beforeEach(() => {
    mockUnsubscribe = vi.fn();

    realtimeMock = {
      connectionStatus: signal('disconnected' as const),
      subscribeToTable: vi.fn().mockReturnValue(mockUnsubscribe),
      disconnectAll: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [ChatStore, { provide: RealtimeService, useValue: realtimeMock }],
    });
    store = TestBed.inject(ChatStore);
  });

  it('should be created', () => {
    expect(store).toBeTruthy();
  });

  describe('initial state', () => {
    it('should start with empty messages', () => {
      expect(store.allMessages()).toEqual([]);
    });

    it('should start with loading false', () => {
      expect(store.isLoading()).toBe(false);
    });
  });

  describe('setMessages', () => {
    it('should set messages array', () => {
      store.setMessages([mockMessage, mockMessage2]);
      expect(store.allMessages()).toEqual([mockMessage, mockMessage2]);
    });
  });

  describe('addMessage', () => {
    it('should append message to array', () => {
      store.setMessages([mockMessage]);
      store.addMessage(mockMessage2);

      expect(store.allMessages()[0]).toEqual(mockMessage);
      expect(store.allMessages()[1]).toEqual(mockMessage2);
    });
  });

  describe('setLoading', () => {
    it('should set loading to true', () => {
      store.setLoading(true);
      expect(store.isLoading()).toBe(true);
    });

    it('should set loading to false', () => {
      store.setLoading(true);
      store.setLoading(false);
      expect(store.isLoading()).toBe(false);
    });
  });

  describe('clear', () => {
    it('should clear all messages', () => {
      store.setMessages([mockMessage, mockMessage2]);
      store.clear();
      expect(store.allMessages()).toEqual([]);
    });

    it('should unsubscribe from realtime', () => {
      store.subscribeToRealtime();
      store.clear();
      expect(mockUnsubscribe).toHaveBeenCalled();
    });
  });

  describe('realtime', () => {
    describe('subscribeToRealtime', () => {
      it('should call realtime.subscribeToTable with messages table', () => {
        store.subscribeToRealtime();

        expect(realtimeMock.subscribeToTable).toHaveBeenCalledWith(
          'messages',
          expect.any(Function),
        );
      });

      it('should not subscribe when already subscribed', () => {
        store.subscribeToRealtime();
        store.subscribeToRealtime();

        expect(realtimeMock.subscribeToTable).toHaveBeenCalledTimes(1);
      });
    });

    describe('unsubscribeFromRealtime', () => {
      it('should call unsubscribe function', () => {
        store.subscribeToRealtime();
        store.unsubscribeFromRealtime();

        expect(mockUnsubscribe).toHaveBeenCalled();
      });

      it('should be safe to call when not subscribed', () => {
        expect(() => store.unsubscribeFromRealtime()).not.toThrow();
      });
    });

    describe('realtime event handling', () => {
      beforeEach(() => {
        store.subscribeToRealtime();
      });

      it('should add message on INSERT event', () => {
        const callback = realtimeMock.subscribeToTable.mock.calls[0][1];

        callback({
          eventType: 'INSERT',
          new: mockMessage,
          old: {},
        });

        expect(store.allMessages()).toContainEqual(mockMessage);
      });

      it('should not add duplicate message on INSERT event', () => {
        store.setMessages([mockMessage]);
        const callback = realtimeMock.subscribeToTable.mock.calls[0][1];

        callback({
          eventType: 'INSERT',
          new: mockMessage, // Same message ID
          old: {},
        });

        expect(store.allMessages().length).toBe(1);
      });

      it('should ignore UPDATE events', () => {
        store.setMessages([mockMessage]);
        const callback = realtimeMock.subscribeToTable.mock.calls[0][1];

        callback({
          eventType: 'UPDATE',
          new: { ...mockMessage, content: 'Updated content' },
          old: { id: mockMessage.id },
        });

        expect(store.allMessages()[0].content).toBe('Hello!');
      });

      it('should ignore DELETE events', () => {
        store.setMessages([mockMessage]);
        const callback = realtimeMock.subscribeToTable.mock.calls[0][1];

        callback({
          eventType: 'DELETE',
          new: {},
          old: { id: mockMessage.id },
        });

        expect(store.allMessages()).toContainEqual(mockMessage);
      });
    });

    describe('connectionStatus', () => {
      it('should expose realtime connection status', () => {
        expect(store.connectionStatus()).toBe('disconnected');

        realtimeMock.connectionStatus.set('connected');
        expect(store.connectionStatus()).toBe('connected');
      });
    });
  });
});
