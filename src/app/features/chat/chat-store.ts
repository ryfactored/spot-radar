import { Injectable, inject, signal } from '@angular/core';
import { Message } from './chat';
import { RealtimeService, RealtimePayload } from '@core';

/**
 * Signal-based store for chat messages with realtime updates.
 *
 * Subscribes to Supabase Realtime to receive new messages instantly
 * as they are inserted by any user in the chat.
 */
@Injectable({
  providedIn: 'root',
})
export class ChatStore {
  private realtime = inject(RealtimeService);

  private messages = signal<Message[]>([]);
  private loading = signal(false);

  /** Cleanup function for realtime subscription */
  private unsubscribeFn: (() => void) | null = null;

  // Public readonly access
  readonly allMessages = this.messages.asReadonly();
  readonly isLoading = this.loading.asReadonly();

  /** Connection status for UI indicator */
  readonly connectionStatus = this.realtime.connectionStatus;

  setMessages(messages: Message[]) {
    this.messages.set(messages);
  }

  addMessage(message: Message) {
    this.messages.update((msgs) => [...msgs, message]);
  }

  setLoading(loading: boolean) {
    this.loading.set(loading);
  }

  clear() {
    this.messages.set([]);
    this.unsubscribeFromRealtime();
  }

  /**
   * Subscribe to realtime changes for all messages.
   * Chat messages are visible to all authenticated users.
   */
  subscribeToRealtime(): void {
    if (this.unsubscribeFn) return; // Already subscribed

    this.unsubscribeFn = this.realtime.subscribeToTable<Message>(
      'messages',
      (payload) => this.handleRealtimeEvent(payload),
    );
  }

  /**
   * Unsubscribe from realtime changes.
   * Call this when leaving the chat or on logout.
   */
  unsubscribeFromRealtime(): void {
    if (this.unsubscribeFn) {
      this.unsubscribeFn();
      this.unsubscribeFn = null;
    }
  }

  /**
   * Handle incoming realtime events from Supabase.
   * Chat only handles INSERT events (append-only).
   */
  private handleRealtimeEvent(payload: RealtimePayload<Message>): void {
    const { eventType, new: newRecord } = payload;

    if (eventType === 'INSERT') {
      const message = newRecord as Message;
      // Check if message already exists (from optimistic update)
      const exists = this.messages().some((m) => m.id === message.id);
      if (!exists) {
        this.addMessage(message);
      }
    }
  }
}
