import { Injectable, inject } from '@angular/core';
import { SupabaseService, AuthService, mapToError } from '@core';

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

    const { data, error, count } = await query;
    if (error) throw mapToError(error);
    return { data: data || [], count: count || 0 };
  }

  async get(id: string): Promise<Note | null> {
    const { data, error } = await this.supabase.client
      .from('notes')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw mapToError(error);
    return data;
  }

  async create(note: { title: string; content?: string }): Promise<Note> {
    const user = this.auth.currentUser();
    if (!user) throw new Error('Please sign in to continue');

    const { data, error } = await this.supabase.client
      .from('notes')
      .insert({
        user_id: user.id,
        title: note.title,
        content: note.content || null,
      })
      .select()
      .single();

    if (error) throw mapToError(error);
    return data;
  }

  async update(id: string, updates: { title?: string; content?: string }): Promise<Note> {
    const { data, error } = await this.supabase.client
      .from('notes')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw mapToError(error);
    return data;
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase.client
      .from('notes')
      .delete()
      .eq('id', id);

    if (error) throw mapToError(error);
  }
}
