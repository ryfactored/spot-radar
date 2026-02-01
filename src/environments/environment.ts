export const environment = {
  appName: 'angular-starter',
  production: false,
  supabaseUrl: 'https://gksnkorbarmijdhpbpgc.supabase.co',
  supabaseAnonKey: 'sb_publishable_hyoKI14ohHz8Qx5LJXYo4A_9YVLnNCV',
  // Valid options: 'google' | 'github' | 'spotify' | 'discord' | 'apple'
  socialProviders: ['google', 'github', 'spotify', 'apple'] as const,
  // SEO - update these when cloning the template
  siteUrl: 'http://localhost:4200',
  siteTitle: 'Angular Starter Template',
  siteDescription:
    'A production-ready Angular starter with authentication, theming, and reusable components.',
  // Toast durations in milliseconds
  toastDuration: { success: 2000, info: 3000, error: 4000 },
};
