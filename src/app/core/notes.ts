import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase';
import { AuthService } from './auth';

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
    if (error) throw error;
    return { data: data || [], count: count || 0 };
  }

  async get(id: string): Promise<Note | null> {
    const { data, error } = await this.supabase.client
      .from('notes')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async create(note: { title: string; content?: string }): Promise<Note> {
    const user = this.auth.currentUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await this.supabase.client
      .from('notes')
      .insert({
        user_id: user.id,
        title: note.title,
        content: note.content || null,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async update(id: string, updates: { title?: string; content?: string }): Promise<Note> {
    const { data, error } = await this.supabase.client
      .from('notes')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase.client
      .from('notes')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}