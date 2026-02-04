// auth
export { AuthService } from './auth/auth';
export type { SocialProvider } from './auth/auth';
export { authGuard, guestGuard } from './auth/auth-guard';
export { roleGuard } from './auth/role-guard';
export type { UserRole } from './auth/role-guard';

// supabase
export { SupabaseService } from './supabase/supabase';
export { RealtimeService } from './supabase/realtime';
export type { ConnectionStatus, RealtimeEventType, RealtimePayload } from './supabase/realtime';
export { StorageService } from './supabase/storage';

// errors
export { SUPABASE_ERRORS } from './errors/supabase-errors';
export { GlobalErrorHandler } from './errors/global-error-handler';
export { httpErrorInterceptor } from './errors/http-error-interceptor';
export { mapError, mapToError, unwrap, unwrapWithCount } from './errors/error-mapper';
export { extractErrorMessage } from './errors/extract-error-message';

// root
export { PreferencesService, COLOR_THEMES } from './preferences';
export type { ColorTheme } from './preferences';
export { unsavedChangesGuard } from './unsaved-changes-guard';
export type { HasUnsavedChanges } from './unsaved-changes-guard';
export { FeatureFlags } from './feature-flags';
export { featureFlagGuard } from './feature-flag-guard';
