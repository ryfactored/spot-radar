import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase';
import { AuthService } from './auth';
import { SUPABASE_ERRORS } from './supabase-errors';

export interface Profile {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private supabase = inject(SupabaseService);
  private auth = inject(AuthService);

  async getProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await this.supabase.client
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    // If no profile exists, create one
    if (error?.code === SUPABASE_ERRORS.NO_ROWS_FOUND) {
      return this.createProfile(userId);
    }

    if (error) throw error;
    return data;
  }

  private async createProfile(userId: string): Promise<Profile> {
    const user = this.auth.currentUser();
    const email = user?.email || '';
    const displayName = user?.user_metadata?.['full_name'] || email;

    const { data, error } = await this.supabase.client
      .from('profiles')
      .insert({
        id: userId,
        email: email,
        display_name: displayName,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateProfile(userId: string, updates: Partial<Profile>): Promise<Profile> {
    const { data, error } = await this.supabase.client
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}