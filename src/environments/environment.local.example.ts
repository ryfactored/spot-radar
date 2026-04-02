import { Environment } from './environment.interface';

/**
 * Local credentials — copy this file to environment.local.ts and fill in your values.
 * environment.local.ts is gitignored and will not be committed.
 */
export const localOverrides: Partial<Environment> = {
  supabaseUrl: 'https://YOUR_PROJECT.supabase.co',
  supabaseAnonKey: 'YOUR_SUPABASE_ANON_KEY',
  // supabaseDbSchema: 'spot_radar',
};
