import { Environment } from './environment.interface';

/**
 * Docker deployment credentials — copy to environment.docker.local.ts and fill in.
 * environment.docker.local.ts is gitignored and will not be committed.
 */
export const dockerLocalOverrides: Partial<Environment> = {
  supabaseUrl: 'http://YOUR_NAS_IP:8001',
  supabaseAnonKey: 'YOUR_ANON_KEY',
  siteUrl: 'http://YOUR_NAS_IP:4200',
  // supabaseDbSchema: 'angular_starter',
};
