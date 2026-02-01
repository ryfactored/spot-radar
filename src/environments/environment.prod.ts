export const environment = {
  appName: 'angular-starter',
  production: true,
  supabaseUrl: 'https://gksnkorbarmijdhpbpgc.supabase.co',
  supabaseAnonKey: 'sb_publishable_hyoKI14ohHz8Qx5LJXYo4A_9YVLnNCV',
  // Valid options: 'google' | 'github' | 'spotify' | 'discord' | 'apple'
  socialProviders: ['google'] as const,
  // SEO - update these when cloning the template
  siteUrl: 'https://your-domain.vercel.app',
  siteTitle: 'Angular Starter Template',
  siteDescription:
    'A production-ready Angular starter with authentication, theming, and reusable components.',
  // Toast durations in milliseconds
  toastDuration: { success: 3000, info: 4000, error: 5000 },
  // File upload limits in MB
  upload: { avatarMaxSizeMB: 5, attachmentMaxSizeMB: 10 },
  // Minimum password length (synced with Supabase auth settings)
  passwordMinLength: 8,
  // Default preferences for new/guest users
  defaults: { colorTheme: 'default' as const, darkMode: true, sidenavOpened: true },
  // Cache TTL in minutes (used by signal stores)
  cacheTtlMinutes: 5,
  // Pagination
  pagination: { defaultPageSize: 10, pageSizeOptions: [5, 10, 25, 50] },
  // Chat
  chatMessageLimit: 50,
  // Signed URL expiration in seconds
  signedUrlExpirationSecs: 3600,
  // Storage bucket names (must match Supabase bucket config)
  storageBuckets: { avatars: 'avatars', files: 'user-files' },
  // Search debounce in milliseconds
  searchDebounceMs: 300,
  // Loading bar minimum visible duration in milliseconds
  loadingBarDelayMs: 300,
};
