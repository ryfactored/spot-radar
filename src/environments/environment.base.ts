import { Environment } from './environment.interface';

/**
 * Shared environment values. Each environment file spreads this
 * and overrides only the properties that differ.
 */
export const environmentBase: Environment = {
  appName: 'angular-starter',
  production: false,
  supabaseUrl: 'https://gksnkorbarmijdhpbpgc.supabase.co',
  supabaseAnonKey: 'sb_publishable_hyoKI14ohHz8Qx5LJXYo4A_9YVLnNCV',
  socialProviders: ['google', 'github', 'spotify', 'apple'],
  siteUrl: 'http://localhost:4200',
  siteTitle: 'Angular Starter Template',
  siteDescription:
    'A production-ready Angular starter with authentication, theming, and reusable components.',
  toastDuration: { success: 2000, info: 3000, error: 4000 },
  upload: { avatarMaxSizeMB: 5, attachmentMaxSizeMB: 10 },
  passwordMinLength: 8,
  defaults: { colorTheme: 'default', darkMode: true, sidenavOpened: true },
  cacheTtlMinutes: 5,
  pagination: { defaultPageSize: 10, pageSizeOptions: [5, 10, 25, 50] },
  chatMessageLimit: 50,
  signedUrlExpirationSecs: 3600,
  storageBuckets: { avatars: 'avatars', files: 'user-files' },
  searchDebounceMs: 300,
  loadingBarDelayMs: 300,
  featureFlags: { notes: true, chat: true, files: true, admin: true, breadcrumb: true },
};
