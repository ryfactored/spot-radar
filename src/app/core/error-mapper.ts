/**
 * Maps Supabase errors to user-friendly messages.
 *
 * IMPORTANT: Default is always a generic message.
 * Only explicitly mapped errors get custom messages.
 */

const GENERIC_MESSAGE = 'Something went wrong. Please try again.';

// Auth errors (login, registration, session)
const AUTH_ERRORS: Record<string, string> = {
  'invalid_credentials': 'Invalid email or password',
  'invalid_grant': 'Invalid email or password',
  'user_already_exists': 'An account with this email already exists',
  'email_not_confirmed': 'Please check your email to confirm your account',
};

// Rate limiting
const RATE_LIMIT_ERRORS: Record<string, string> = {
  'over_request_rate_limit': 'Too many attempts. Please wait and try again.',
};

// Data/query errors
const DATA_ERRORS: Record<string, string> = {
  'PGRST116': 'The requested item was not found',
};

// Combined map - only these get custom messages
const ERROR_MAP: Record<string, string> = {
  ...AUTH_ERRORS,
  ...RATE_LIMIT_ERRORS,
  ...DATA_ERRORS,
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
