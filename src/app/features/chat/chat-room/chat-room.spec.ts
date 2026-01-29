import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { signal } from '@angular/core';

import { ChatRoom } from './chat-room';
import { ChatService, Message } from '../chat';
import { ChatStore } from '../chat-store';
import { AuthService } from '@core';
import { ToastService } from '@shared';

describe('ChatRoom', () => {
  let component: ChatRoom;
  let fixture: ComponentFixture<ChatRoom>;
  let chatServiceMock: any;
  let chatStoreMock: any;
  let authMock: any;
  let toastMock: any;

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

  beforeEach(async () => {
    chatServiceMock = {
      list: vi.fn().mockResolvedValue(mockMessages),
      send: vi.fn().mockResolvedValue(mockMessages[0]),
    };

    chatStoreMock = {
      allMessages: signal(mockMessages),
      isLoading: signal(false),
      connectionStatus: signal('connected'),
      setMessages: vi.fn(),
      addMessage: vi.fn(),
      setLoading: vi.fn(),
      subscribeToRealtime: vi.fn(),
      unsubscribeFromRealtime: vi.fn(),
    };

    authMock = {
      currentUser: signal({ id: 'user-1', email: 'alice@example.com' }),
    };

    toastMock = {
      success: vi.fn(),
      error: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [ChatRoom, NoopAnimationsModule],
      providers: [
        { provide: ChatService, useValue: chatServiceMock },
        { provide: ChatStore, useValue: chatStoreMock },
        { provide: AuthService, useValue: authMock },
        { provide: ToastService, useValue: toastMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ChatRoom);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  describe('initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should load messages on init', async () => {
      expect(chatServiceMock.list).toHaveBeenCalled();
    });

    it('should subscribe to realtime on init', async () => {
      expect(chatStoreMock.subscribeToRealtime).toHaveBeenCalled();
    });
  });

  describe('display', () => {
    it('should display messages when available', () => {
      fixture.detectChanges();
      const messages = fixture.nativeElement.querySelectorAll('.message');
      expect(messages.length).toBe(2);
    });

    it('should show usernames', () => {
      fixture.detectChanges();
      const usernames = fixture.nativeElement.querySelectorAll('.username');
      expect(usernames[0].textContent).toContain('alice');
      expect(usernames[1].textContent).toContain('bob');
    });

    it('should show empty state when no messages', async () => {
      chatStoreMock.allMessages = signal([]);

      const emptyFixture = TestBed.createComponent(ChatRoom);
      await emptyFixture.whenStable();
      emptyFixture.detectChanges();

      const emptyState = emptyFixture.nativeElement.querySelector('.empty-chat');
      expect(emptyState).toBeTruthy();
    });

    it('should show loading spinner when loading', async () => {
      chatStoreMock.isLoading = signal(true);

      const loadingFixture = TestBed.createComponent(ChatRoom);
      await loadingFixture.whenStable();
      loadingFixture.detectChanges();

      const spinner = loadingFixture.nativeElement.querySelector('app-loading-spinner');
      expect(spinner).toBeTruthy();
    });

    it('should highlight own messages', () => {
      fixture.detectChanges();
      const messages = fixture.nativeElement.querySelectorAll('.message');
      expect(messages[0].classList.contains('own-message')).toBe(true);
      expect(messages[1].classList.contains('own-message')).toBe(false);
    });
  });

  describe('isOwnMessage', () => {
    it('should return true for messages from current user', () => {
      expect(component.isOwnMessage(mockMessages[0])).toBe(true);
    });

    it('should return false for messages from other users', () => {
      expect(component.isOwnMessage(mockMessages[1])).toBe(false);
    });
  });

  describe('sendMessage', () => {
    it('should send message when content is provided', async () => {
      component.newMessage = 'Test message';
      await component.sendMessage();

      expect(chatServiceMock.send).toHaveBeenCalledWith('Test message');
    });

    it('should add message to store after sending', async () => {
      component.newMessage = 'Test message';
      await component.sendMessage();

      expect(chatStoreMock.addMessage).toHaveBeenCalled();
    });

    it('should clear input after sending', async () => {
      component.newMessage = 'Test message';
      await component.sendMessage();

      expect(component.newMessage).toBe('');
    });

    it('should not send empty messages', async () => {
      component.newMessage = '   ';
      await component.sendMessage();

      expect(chatServiceMock.send).not.toHaveBeenCalled();
    });

    it('should show error toast when send fails', async () => {
      chatServiceMock.send.mockRejectedValue(new Error('Send failed'));
      component.newMessage = 'Test message';

      await component.sendMessage();

      expect(toastMock.error).toHaveBeenCalledWith('Send failed');
    });
  });

  describe('error handling', () => {
    it('should show error toast when loading fails', async () => {
      chatServiceMock.list.mockRejectedValue(new Error('Load failed'));

      await component.loadMessages();

      expect(toastMock.error).toHaveBeenCalledWith('Load failed');
    });

    it('should set loading to false after error', async () => {
      chatServiceMock.list.mockRejectedValue(new Error('Load failed'));

      await component.loadMessages();

      expect(chatStoreMock.setLoading).toHaveBeenCalledWith(false);
    });
  });
});
