import { Injectable, inject } from '@angular/core';
import { SupabaseService, AuthService, unwrap, unwrapWithCount } from '@core';

export interface Note {
  id: string;
  user_id: string;
  title: string;
  content: string | null;
  created_at: string;
  updated_at: string;
}

export interface NotesResponse {
  data: Note[];
  count: number;
}

/**
 * Notes CRUD service using Supabase.
 *
 * Demonstrates the Supabase client pattern for database operations:
 * - Row Level Security (RLS) ensures users only access their own notes
 * - The user_id is set on insert; RLS policies handle authorization
 * - Pagination via range() for efficient data loading
 * - Search via ilike() for case-insensitive matching
 */
@Injectable({
  providedIn: 'root'
})
export class NotesService {
  private supabase = inject(SupabaseService);
  private auth = inject(AuthService);

  async list(page = 1, pageSize = 10, search = ''): Promise<NotesResponse> {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = this.supabase.client
      .from('notes')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (search) {
      query = query.ilike('title', `%${search}%`);
    }

    return unwrapWithCount<Note[]>(await query);
  }

  async get(id: string): Promise<Note | null> {
    return unwrap(await this.supabase.client
      .from('notes')
      .select('*')
      .eq('id', id)
      .single());
  }

  async create(note: { title: string; content?: string }): Promise<Note> {
    const user = this.auth.currentUser();
    if (!user) throw new Error('Please sign in to continue');

    return unwrap(await this.supabase.client
      .from('notes')
      .insert({
        user_id: user.id,
        title: note.title,
        content: note.content || null,
      })
      .select()
      .single());
  }

  async update(id: string, updates: { title?: string; content?: string }): Promise<Note> {
    return unwrap(await this.supabase.client
      .from('notes')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single());
  }

  async delete(id: string): Promise<void> {
    unwrap(await this.supabase.client
      .from('notes')
      .delete()
      .eq('id', id));
  }
}
