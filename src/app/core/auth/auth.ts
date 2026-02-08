import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { SupabaseService } from '../supabase/supabase';
import { RealtimeService } from '../supabase/realtime';
import { User, Provider } from '@supabase/supabase-js';
import { mapToError } from '../errors/error-mapper';
import { environment } from '@env';
import { ToastService } from '@shared';

import type { SocialProvider } from '../../../environments/social-provider';
export type { SocialProvider };

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
  private toast = inject(ToastService);
  private isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  currentUser = signal<User | null>(null);
  loading = signal(true);

  /** Tracks whether sign out was initiated by user action */
  private isUserInitiatedSignOut = false;

  constructor() {
    // onAuthStateChange fires immediately with INITIAL_SESSION,
    // so no separate loadUser() / getSession() call is needed.
    this.supabase.client.auth.onAuthStateChange((event, session) => {
      const hadUser = this.currentUser() !== null;
      this.currentUser.set(session?.user ?? null);
      this.loading.set(false);

      // Handle sign out (user-initiated or session expired)
      if (event === 'SIGNED_OUT') {
        if (!this.isUserInitiatedSignOut && hadUser) {
          this.toast.info('Your session has expired. Please sign in again.');
        }
        this.isUserInitiatedSignOut = false;
        this.router.navigate(['/login']);
      }
    });
  }

  async signUp(email: string, password: string) {
    const { data, error } = await this.supabase.client.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${this.getRedirectOrigin()}/verify-email`,
      },
    });
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
      options: { redirectTo: `${this.getRedirectOrigin()}/dashboard` },
    });
    if (error) throw mapToError(error);
  }

  async resetPassword(email: string): Promise<void> {
    const { error } = await this.supabase.client.auth.resetPasswordForEmail(email, {
      redirectTo: `${this.getRedirectOrigin()}/reset-password`,
    });
    if (error) throw mapToError(error);
  }

  async updatePassword(password: string): Promise<void> {
    const { error } = await this.supabase.client.auth.updateUser({ password });
    if (error) throw mapToError(error);
  }

  async signOut() {
    // Mark as user-initiated to skip "session expired" notification
    this.isUserInitiatedSignOut = true;

    // Disconnect all realtime subscriptions
    this.realtime.disconnectAll();

    const { error } = await this.supabase.client.auth.signOut();
    if (error) {
      // Server-side session may already be invalid (e.g. expired).
      // Fall back to local-only sign out which clears the local session
      // and fires SIGNED_OUT without contacting the server.
      await this.supabase.client.auth.signOut({ scope: 'local' });
    }
  }

  /**
   * Returns the origin for auth redirect URLs.
   * Browser: uses window.location.origin (works from any hostname)
   * SSR: uses configured siteUrl
   */
  private getRedirectOrigin(): string {
    if (this.isBrowser) {
      return window.location.origin;
    }
    return environment.siteUrl;
  }
}
