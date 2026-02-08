import type { SocialProvider } from './social-provider';

export interface Environment {
  appName: string;
  production: boolean;
  supabaseUrl: string;
  supabaseAnonKey: string;
  socialProviders: readonly SocialProvider[];
  siteUrl: string;
  siteTitle: string;
  siteDescription: string;
  toastDuration: { success: number; info: number; error: number };
  upload: {
    avatarMaxSizeMB: number;
    avatarTypes: readonly string[];
    attachmentMaxSizeMB: number;
    attachmentTypes: readonly string[];
  };
  passwordMinLength: number;
  defaults: { colorTheme: 'default'; darkMode: boolean; sidenavOpened: boolean };
  cacheTtlMinutes: number;
  pagination: { defaultPageSize: number; pageSizeOptions: number[] };
  signedUrlExpirationSecs: number;
  storageBuckets: { avatars: string; files: string };
  searchDebounceMs: number;
  loadingBarDelayMs: number;
  featureFlags: Record<string, boolean | string>;
}
