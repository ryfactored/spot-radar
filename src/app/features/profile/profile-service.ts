import { Injectable, inject } from '@angular/core';
import { SupabaseService, AuthService, SUPABASE_ERRORS, mapToError, unwrap, UserRole } from '@core';

export interface Profile {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

@Injectable({
  providedIn: 'root',
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

    if (error) throw mapToError(error);
    return data;
  }

  private async createProfile(userId: string): Promise<Profile> {
    const user = this.auth.currentUser();
    const email = user?.email || '';
    const displayName = user?.user_metadata?.['full_name'] || email;

    const result = unwrap(
      await this.supabase.client
        .from('profiles')
        .insert({
          id: userId,
          email: email,
          display_name: displayName,
        })
        .select()
        .single(),
    )!;
    return result;
  }

  async updateProfile(userId: string, updates: Partial<Profile>): Promise<Profile> {
    const result = unwrap(
      await this.supabase.client
        .from('profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', userId)
        .select()
        .single(),
    )!;
    return result;
  }

  async deleteAccount(): Promise<void> {
    const { error } = await this.supabase.client.rpc('delete_my_account');
    if (error) throw mapToError(error);
  }
}
