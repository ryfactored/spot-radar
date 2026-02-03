import {
  Component,
  inject,
  signal,
  OnInit,
  DestroyRef,
  ViewChild,
  ElementRef,
  AfterViewChecked,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ChatService, Message } from '../chat';
import { ChatStore } from '../chat-store';
import { AuthService, extractErrorMessage } from '@core';
import { ToastService, ConnectionIndicator, LoadingSpinner, TimeAgoPipe } from '@shared';

@Component({
  selector: 'app-chat-room',
  imports: [
    TimeAgoPipe,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    ConnectionIndicator,
    LoadingSpinner,
  ],
  template: `
    <div class="chat-container">
      <div class="page-header">
        <h1>Chat</h1>
        <app-connection-indicator [status]="connectionStatus()" [showLabel]="true" />
      </div>

      @if (loading()) {
        <app-loading-spinner message="Loading messages..." />
      } @else {
        <mat-card class="messages-card">
          <mat-card-content>
            <div #messagesContainer class="messages-container">
              @if (messages().length === 0) {
                <div class="empty-chat">
                  <mat-icon>chat_bubble_outline</mat-icon>
                  <p>No messages yet. Start the conversation!</p>
                </div>
              } @else {
                @for (message of messages(); track message.id) {
                  <div class="message" [class.own-message]="isOwnMessage(message)">
                    <div class="message-header">
                      <span class="username">{{ message.username }}</span>
                      <span class="timestamp">{{ message.created_at | timeAgo }}</span>
                    </div>
                    <div class="message-content">{{ message.content }}</div>
                  </div>
                }
              }
            </div>
          </mat-card-content>
        </mat-card>

        <div class="input-area">
          <mat-form-field appearance="outline" class="message-input">
            <mat-label>Type a message</mat-label>
            <input
              matInput
              [ngModel]="newMessage()"
              (ngModelChange)="newMessage.set($event)"
              (keyup.enter)="sendMessage()"
              placeholder="Type your message..."
              [disabled]="sending()"
            />
          </mat-form-field>
          <button
            mat-fab
            color="primary"
            (click)="sendMessage()"
            [disabled]="!newMessage().trim() || sending()"
            aria-label="Send message"
          >
            <mat-icon>{{ sending() ? 'hourglass_empty' : 'send' }}</mat-icon>
          </button>
        </div>
      }
    </div>
  `,
  styles: `
    .chat-container {
      display: flex;
      flex-direction: column;
      height: calc(100dvh - 120px);
      max-height: 800px;
    }

    .messages-card {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .messages-card mat-card-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      padding: 0;
    }

    .messages-container {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .empty-chat {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: var(--mat-sys-on-surface-variant);
    }

    .empty-chat mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 8px;
    }

    .message {
      max-width: 70%;
      padding: 8px 12px;
      border-radius: 12px;
      background: var(--mat-sys-surface-variant);
    }

    .message.own-message {
      align-self: flex-end;
      background: var(--mat-sys-primary-container);
      color: var(--mat-sys-on-primary-container);
    }

    .message-header {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 4px;
      font-size: 0.75rem;
    }

    .username {
      font-weight: 500;
    }

    .timestamp {
      color: var(--mat-sys-on-surface-variant);
      opacity: 0.7;
    }

    .message.own-message .timestamp {
      color: var(--mat-sys-on-primary-container);
    }

    .message-content {
      word-wrap: break-word;
    }

    .input-area {
      display: flex;
      gap: 12px;
      align-items: center;
      margin-top: 16px;
    }

    .message-input {
      flex: 1;
    }
  `,
})
export class ChatRoom implements OnInit, AfterViewChecked {
  private chatService = inject(ChatService);
  private store = inject(ChatStore);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private destroyRef = inject(DestroyRef);

  @ViewChild('messagesContainer') private messagesContainer!: ElementRef<HTMLDivElement>;

  // Delegate to store
  messages = this.store.allMessages;
  loading = this.store.isLoading;
  connectionStatus = this.store.connectionStatus;

  newMessage = signal('');
  sending = signal(false);
  private shouldScrollToBottom = false;

  async ngOnInit() {
    await this.loadMessages();

    // Subscribe to realtime updates
    this.store.subscribeToRealtime();

    // Cleanup on destroy
    this.destroyRef.onDestroy(() => {
      this.store.unsubscribeFromRealtime();
    });
  }

  ngAfterViewChecked() {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  isOwnMessage(message: Message): boolean {
    const user = this.auth.currentUser();
    return user?.id === message.user_id;
  }

  async loadMessages() {
    this.store.setLoading(true);
    try {
      const messages = await this.chatService.list();
      this.store.setMessages(messages);
      this.shouldScrollToBottom = true;
    } catch (err) {
      this.toast.error(extractErrorMessage(err, 'Failed to load messages'));
    } finally {
      this.store.setLoading(false);
    }
  }

  async sendMessage() {
    const content = this.newMessage().trim();
    if (!content || this.sending()) return;

    this.sending.set(true);

    try {
      const message = await this.chatService.send(content);
      // Add message optimistically (realtime will skip if already exists)
      this.store.addMessage(message);
      this.newMessage.set('');
      this.shouldScrollToBottom = true;
    } catch (err) {
      this.toast.error(extractErrorMessage(err, 'Failed to send message'));
    } finally {
      this.sending.set(false);
    }
  }

  private scrollToBottom() {
    if (this.messagesContainer) {
      const el = this.messagesContainer.nativeElement;
      el.scrollTop = el.scrollHeight;
    }
  }
}
