/**
 * Maps Supabase errors to user-friendly messages.
 *
 * IMPORTANT: Default is always a generic message.
 * Only explicitly mapped errors get custom messages.
 */

import { environment } from '@env';
import { SUPABASE_ERRORS } from './supabase-errors';

const GENERIC_MESSAGE = 'Something went wrong. Please try again.';

// Only explicitly mapped error codes get custom user-facing messages.
const ERROR_MAP: Record<string, string> = {
  // Auth
  invalid_credentials: 'Invalid email or password',
  invalid_grant: 'Invalid email or password',
  user_already_exists: 'An account with this email already exists',
  email_not_confirmed: 'Please check your email to confirm your account',
  same_password: 'New password must be different from your current password',
  weak_password: `Password is too weak. Use at least ${environment.passwordMinLength} characters.`,
  // Rate limiting
  over_request_rate_limit: 'Too many attempts. Please wait and try again.',
  over_email_send_rate_limit: 'Too many emails sent. Please wait a few minutes and try again.',
  // Data/query
  [SUPABASE_ERRORS.NO_ROWS_FOUND]: 'The requested item was not found',
};

export function mapError(error: unknown): { message: string } {
  const code = (error as Record<string, unknown>)?.['code'] as string;

  // Only return custom message if explicitly mapped
  if (code && ERROR_MAP[code]) {
    return { message: ERROR_MAP[code] };
  }

  // Everything else gets generic message - never expose internals
  return { message: GENERIC_MESSAGE };
}

export function mapToError(error: unknown): Error {
  return new Error(mapError(error).message);
}

/**
 * Unwraps a Supabase result, throwing a mapped error if one exists.
 * Use this to ensure all Supabase errors are user-friendly.
 *
 * @example
 * // Before (3 lines)
 * const { data, error } = await client.from('notes').select('*');
 * if (error) throw mapToError(error);
 * return data;
 *
 * // After (1 line)
 * return unwrap(await client.from('notes').select('*'));
 */
export function unwrap<T>(result: { data: T | null; error: unknown }): T {
  if (result.error) throw mapToError(result.error);
  return result.data as T;
}

/**
 * Unwraps a Supabase result that includes count (for paginated queries).
 *
 * @example
 * return unwrapWithCount(await client.from('notes').select('*', { count: 'exact' }));
 */
export function unwrapWithCount<T>(result: {
  data: T | null;
  error: unknown;
  count: number | null;
}): { data: T; count: number } {
  if (result.error) throw mapToError(result.error);
  return { data: result.data as T, count: result.count ?? 0 };
}
