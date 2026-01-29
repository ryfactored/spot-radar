import { Injectable, inject } from '@angular/core';
import { SupabaseService, AuthService, unwrap } from '@core';

export interface Message {
  id: string;
  user_id: string;
  username: string;
  content: string;
  created_at: string;
}

/**
 * Chat service for message CRUD operations.
 *
 * Uses Supabase as the backend with RLS policies ensuring:
 * - All authenticated users can read all messages
 * - Users can only insert their own messages
 */
@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private supabase = inject(SupabaseService);
  private auth = inject(AuthService);

  /**
   * Fetch recent messages (last 50), ordered oldest to newest for display.
   */
  async list(): Promise<Message[]> {
    return unwrap(
      await this.supabase.client
        .from('messages')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(50),
    );
  }

  /**
   * Send a new message to the chat.
   */
  async send(content: string): Promise<Message> {
    const user = this.auth.currentUser();
    if (!user) throw new Error('Please sign in to continue');

    // Use email prefix as username, or 'Anonymous' if not available
    const username = user.email?.split('@')[0] || 'Anonymous';

    return unwrap(
      await this.supabase.client
        .from('messages')
        .insert({
          user_id: user.id,
          username,
          content,
        })
        .select()
        .single(),
    );
  }
}
