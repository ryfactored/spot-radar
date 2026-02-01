import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService } from './supabase';
import { RealtimeService } from './realtime';
import { User, Provider } from '@supabase/supabase-js';
import { mapToError } from './error-mapper';
import { environment } from '@env';

export type SocialProvider = 'google' | 'github' | 'spotify' | 'discord' | 'apple';

/**
 * Authentication service using Supabase Auth.
 *
 * State is managed with Angular Signals for reactive updates:
 * - currentUser: The authenticated user (null if signed out)
 * - loading: True while restoring session on app init
 *
 * The onAuthStateChange listener automatically updates state and
 * handles redirects when the user signs out.
 */
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private supabase = inject(SupabaseService);
  private realtime = inject(RealtimeService);
  private router = inject(Router);

  currentUser = signal<User | null>(null);
  loading = signal(true);

  constructor() {
    this.loadUser();
    this.supabase.client.auth.onAuthStateChange((event, session) => {
      this.currentUser.set(session?.user ?? null);
      this.loading.set(false);

      // Auto-redirect on sign out
      if (event === 'SIGNED_OUT') {
        this.router.navigate(['/login']);
      }
    });
  }

  private async loadUser() {
    const { data } = await this.supabase.client.auth.getSession();
    this.currentUser.set(data.session?.user ?? null);
    this.loading.set(false);
  }

  async signUp(email: string, password: string) {
    const { data, error } = await this.supabase.client.auth.signUp({ email, password });
    if (error) throw mapToError(error);
    return data;
  }

  async signIn(email: string, password: string) {
    const { data, error } = await this.supabase.client.auth.signInWithPassword({ email, password });
    if (error) throw mapToError(error);
    return data;
  }

  async signInWithProvider(provider: SocialProvider) {
    const { error } = await this.supabase.client.auth.signInWithOAuth({
      provider: provider as Provider,
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
    if (error) throw mapToError(error);
  }

  async resetPassword(email: string): Promise<void> {
    const { error } = await this.supabase.client.auth.resetPasswordForEmail(email, {
      redirectTo: `${environment.siteUrl}/reset-password`,
    });
    if (error) throw mapToError(error);
  }

  async updatePassword(password: string): Promise<void> {
    const { error } = await this.supabase.client.auth.updateUser({ password });
    if (error) throw mapToError(error);
  }

  async signOut() {
    // Disconnect all realtime subscriptions
    this.realtime.disconnectAll();

    try {
      await this.supabase.client.auth.signOut();
    } catch {
      // Ignore - session may already be invalid server-side
    }
    // Clear local state regardless of server response
    // (guestGuard checks currentUser before allowing /login)
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }
}
