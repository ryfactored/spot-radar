import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '@env';

@Injectable({
  providedIn: 'root',
})
export class SupabaseService {
  private supabase: SupabaseClient;
  private platformId = inject(PLATFORM_ID);

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseAnonKey, {
      auth: {
        persistSession: isPlatformBrowser(this.platformId),
        autoRefreshToken: isPlatformBrowser(this.platformId),
      },
    });
  }

  get client(): SupabaseClient {
    return this.supabase;
  }

  get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }
}
