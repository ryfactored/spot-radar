import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ChatService, Message } from './chat';
import { SupabaseService, AuthService } from '@core';

describe('ChatService', () => {
  let service: ChatService;
  let supabaseMock: any;
  let authMock: any;

  const mockMessages: Message[] = [
    {
      id: '1',
      user_id: 'user-1',
      username: 'alice',
      content: 'Hello!',
      created_at: '2024-01-01T10:00:00Z',
    },
    {
      id: '2',
      user_id: 'user-2',
      username: 'bob',
      content: 'Hi there!',
      created_at: '2024-01-01T10:01:00Z',
    },
  ];

  beforeEach(() => {
    supabaseMock = {
      client: {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: mockMessages, error: null }),
        single: vi.fn().mockResolvedValue({ data: mockMessages[0], error: null }),
      },
    };

    authMock = {
      currentUser: signal({ id: 'user-1', email: 'alice@example.com' }),
    };

    TestBed.configureTestingModule({
      providers: [
        ChatService,
        { provide: SupabaseService, useValue: supabaseMock },
        { provide: AuthService, useValue: authMock },
      ],
    });

    service = TestBed.inject(ChatService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('list', () => {
    it('should fetch messages ordered by created_at ascending', async () => {
      const messages = await service.list();

      expect(supabaseMock.client.from).toHaveBeenCalledWith('messages');
      expect(supabaseMock.client.select).toHaveBeenCalledWith('*');
      expect(supabaseMock.client.order).toHaveBeenCalledWith('created_at', { ascending: true });
      expect(supabaseMock.client.limit).toHaveBeenCalledWith(50);
      expect(messages).toEqual(mockMessages);
    });

    it('should throw error when query fails', async () => {
      supabaseMock.client.limit.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      await expect(service.list()).rejects.toThrow('Something went wrong. Please try again.');
    });
  });

  describe('send', () => {
    beforeEach(() => {
      supabaseMock.client.insert.mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockMessages[0], error: null }),
        }),
      });
    });

    it('should send a message with user info', async () => {
      await service.send('Hello!');

      expect(supabaseMock.client.from).toHaveBeenCalledWith('messages');
      expect(supabaseMock.client.insert).toHaveBeenCalledWith({
        user_id: 'user-1',
        username: 'alice',
        content: 'Hello!',
      });
    });

    it('should use email prefix as username', async () => {
      await service.send('Test message');

      expect(supabaseMock.client.insert).toHaveBeenCalledWith(
        expect.objectContaining({ username: 'alice' }),
      );
    });

    it('should throw error when user is not authenticated', async () => {
      authMock.currentUser = signal(null);
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          ChatService,
          { provide: SupabaseService, useValue: supabaseMock },
          { provide: AuthService, useValue: authMock },
        ],
      });
      const noAuthService = TestBed.inject(ChatService);

      await expect(noAuthService.send('Hello')).rejects.toThrow('Please sign in to continue');
    });

    it('should throw error when insert fails', async () => {
      supabaseMock.client.insert.mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Insert failed' } }),
        }),
      });

      await expect(service.send('Hello')).rejects.toThrow(
        'Something went wrong. Please try again.',
      );
    });
  });
});
