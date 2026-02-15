import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '@env';

@Injectable({
  providedIn: 'root',
})
export class SupabaseService {
  private supabase: SupabaseClient;
  readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseAnonKey, {
      auth: {
        persistSession: this.isBrowser,
        autoRefreshToken: this.isBrowser,
      },
      db: { schema: (environment.supabaseDbSchema ?? 'public') as 'public' },
    });
  }

  get client(): SupabaseClient {
    return this.supabase;
  }

  get dbSchema(): string {
    return environment.supabaseDbSchema ?? 'public';
  }
}
