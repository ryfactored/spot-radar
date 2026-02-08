import { Environment } from './environment.interface';

/**
 * Shared environment values. Each environment file spreads this
 * and overrides only the properties that differ.
 */
export const environmentBase: Environment = {
  appName: 'angular-starter',
  production: false,
  supabaseUrl: 'https://YOUR_PROJECT.supabase.co',
  supabaseAnonKey: 'YOUR_SUPABASE_ANON_KEY',
  socialProviders: ['google', 'github', 'spotify', 'apple'], // 'google' | 'github' | 'spotify' | 'discord' | 'apple'
  siteUrl: 'http://localhost:4200',
  siteTitle: 'Angular Starter Template',
  siteDescription:
    'A production-ready Angular starter with authentication, theming, and reusable components.',
  toastDuration: { success: 2000, info: 3000, error: 4000 },
  upload: {
    avatarMaxSizeMB: 5,
    avatarTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
    attachmentMaxSizeMB: 10,
    attachmentTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'text/csv',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
    ],
  },
  passwordMinLength: 8,
  defaults: { colorTheme: 'default', darkMode: true, sidenavOpened: true }, // colorTheme: 'default' | 'teal' | 'slate'
  cacheTtlMinutes: 5,
  pagination: { defaultPageSize: 10, pageSizeOptions: [5, 10, 25, 50] },
  signedUrlExpirationSecs: 3600,
  storageBuckets: { avatars: 'avatars', files: 'user-files' },
  searchDebounceMs: 300,
  loadingBarDelayMs: 300,
  featureFlags: {
    notes: true,
    chat: true,
    files: true,
    admin: true,
    breadcrumb: true,
    components: true,
    themePicker: true,
    centerContent: true,
    defaultChildNavMode: 'none', // 'none' | 'tabs' | 'sidenav'
  },
};
