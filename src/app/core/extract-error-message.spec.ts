import { extractErrorMessage } from './extract-error-message';

describe('extractErrorMessage', () => {
  it('should extract message from Error instance', () => {
    expect(extractErrorMessage(new Error('something broke'))).toBe('something broke');
  });

  it('should return string errors as-is', () => {
    expect(extractErrorMessage('network timeout')).toBe('network timeout');
  });

  it('should return fallback for non-Error objects', () => {
    expect(extractErrorMessage({ code: 42 })).toBe('Something went wrong');
  });

  it('should return fallback for null', () => {
    expect(extractErrorMessage(null)).toBe('Something went wrong');
  });

  it('should return fallback for undefined', () => {
    expect(extractErrorMessage(undefined)).toBe('Something went wrong');
  });

  it('should use custom fallback when provided', () => {
    expect(extractErrorMessage(42, 'Custom fallback')).toBe('Custom fallback');
  });
});
