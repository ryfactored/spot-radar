import { Injectable, inject, signal } from '@angular/core';
import { RealtimeChannel } from '@supabase/supabase-js';
import { SupabaseService } from './supabase';

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

export type RealtimeEventType = 'INSERT' | 'UPDATE' | 'DELETE';

export interface RealtimePayload<T> {
  eventType: RealtimeEventType;
  new: T | Record<string, never>;
  old: Partial<T>;
}

/**
 * Service for managing Supabase Realtime subscriptions.
 *
 * Provides a simplified API for subscribing to PostgreSQL table changes
 * with automatic connection status tracking and cleanup utilities.
 *
 * Usage:
 * ```typescript
 * const cleanup = this.realtime.subscribeToTable<Note>(
 *   'notes',
 *   (payload) => console.log(payload.eventType, payload.new),
 *   `user_id=eq.${userId}`
 * );
 *
 * // Later: cleanup();
 * ```
 */
@Injectable({
  providedIn: 'root',
})
export class RealtimeService {
  private supabase = inject(SupabaseService);

  /** Current connection status for UI indicators */
  connectionStatus = signal<ConnectionStatus>('disconnected');

  /** Track active channels for cleanup */
  private channels = new Map<string, RealtimeChannel>();

  /**
   * Subscribe to PostgreSQL changes on a table.
   *
   * @param table - Table name to subscribe to
   * @param callback - Function called when changes occur
   * @param filter - Optional RLS filter (e.g., "user_id=eq.abc123")
   * @returns Cleanup function to unsubscribe
   */
  subscribeToTable<T>(
    table: string,
    callback: (payload: RealtimePayload<T>) => void,
    filter?: string,
  ): () => void {
    // SSR safety: no-op on server
    if (!this.supabase.isBrowser) {
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      return () => {};
    }

    const channelName = `${table}-changes-${Date.now()}`;

    const channel = this.supabase.client
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table,
          filter,
        },
        (payload) => {
          callback({
            eventType: payload.eventType as RealtimeEventType,
            new: payload.new as T,
            old: payload.old as Partial<T>,
          });
        },
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          this.connectionStatus.set('connected');
        } else if (status === 'CHANNEL_ERROR') {
          this.connectionStatus.set('reconnecting');
        } else if (status === 'CLOSED') {
          this.connectionStatus.set('disconnected');
        }
      });

    this.channels.set(channelName, channel);
    this.connectionStatus.set('connecting');

    // Return cleanup function
    return () => {
      channel.unsubscribe();
      this.channels.delete(channelName);
      if (this.channels.size === 0) {
        this.connectionStatus.set('disconnected');
      }
    };
  }

  /**
   * Unsubscribe from all active channels.
   * Call this on logout to clean up all subscriptions.
   */
  disconnectAll(): void {
    this.channels.forEach((channel) => channel.unsubscribe());
    this.channels.clear();
    this.connectionStatus.set('disconnected');
  }
}
