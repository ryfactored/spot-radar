export interface Environment {
  appName: string;
  production: boolean;
  supabaseUrl: string;
  supabaseAnonKey: string;
  socialProviders: readonly ('google' | 'github' | 'spotify' | 'discord' | 'apple')[];
  siteUrl: string;
  siteTitle: string;
  siteDescription: string;
  toastDuration: { success: number; info: number; error: number };
  upload: { avatarMaxSizeMB: number; attachmentMaxSizeMB: number };
  passwordMinLength: number;
  defaults: { colorTheme: 'default'; darkMode: boolean; sidenavOpened: boolean };
  cacheTtlMinutes: number;
  pagination: { defaultPageSize: number; pageSizeOptions: number[] };
  chatMessageLimit: number;
  signedUrlExpirationSecs: number;
  storageBuckets: { avatars: string; files: string };
  searchDebounceMs: number;
  loadingBarDelayMs: number;
}
