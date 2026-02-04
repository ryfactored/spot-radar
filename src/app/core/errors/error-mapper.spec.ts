import { mapError, mapToError, unwrap, unwrapWithCount } from './error-mapper';
import { environment } from '@env';

describe('ErrorMapper', () => {
  describe('mapError', () => {
    it('should map explicitly defined error codes', () => {
      expect(mapError({ code: 'invalid_credentials' }).message).toBe('Invalid email or password');
      expect(mapError({ code: 'user_already_exists' }).message).toBe(
        'An account with this email already exists',
      );
      expect(mapError({ code: 'PGRST116' }).message).toBe('The requested item was not found');
      expect(mapError({ code: 'weak_password' }).message).toBe(
        `Password is too weak. Use at least ${environment.passwordMinLength} characters.`,
      );
    });

    it('should return generic message for unmapped errors', () => {
      expect(mapError({ code: 'unknown_code' }).message).toBe(
        'Something went wrong. Please try again.',
      );
      expect(mapError({ code: '23503', message: 'foreign key violation' }).message).toBe(
        'Something went wrong. Please try again.',
      );
      expect(mapError({ message: 'any random error' }).message).toBe(
        'Something went wrong. Please try again.',
      );
      expect(mapError(null).message).toBe('Something went wrong. Please try again.');
    });

    it('should never expose raw database errors', () => {
      const rawError = {
        code: '23503',
        message: 'insert or update on table "profiles" violates foreign key constraint',
      };
      expect(mapError(rawError).message).not.toContain('profiles');
      expect(mapError(rawError).message).not.toContain('constraint');
    });
  });

  describe('mapToError', () => {
    it('should return an Error instance with mapped message', () => {
      const result = mapToError({ code: 'invalid_credentials' });
      expect(result).toBeInstanceOf(Error);
      expect(result.message).toBe('Invalid email or password');
    });
  });

  describe('unwrap', () => {
    it('should return data when no error', () => {
      const result = unwrap({ data: { id: 1, name: 'test' }, error: null });
      expect(result).toEqual({ id: 1, name: 'test' });
    });

    it('should throw mapped error when error exists', () => {
      expect(() => unwrap({ data: null, error: { code: 'invalid_credentials' } })).toThrow(
        'Invalid email or password',
      );
    });

    it('should throw generic error for unknown error codes', () => {
      expect(() => unwrap({ data: null, error: { code: 'unknown' } })).toThrow(
        'Something went wrong. Please try again.',
      );
    });
  });

  describe('unwrapWithCount', () => {
    it('should return data and count when no error', () => {
      const result = unwrapWithCount({
        data: [{ id: 1 }, { id: 2 }],
        error: null,
        count: 10,
      });
      expect(result).toEqual({ data: [{ id: 1 }, { id: 2 }], count: 10 });
    });

    it('should default count to 0 when null', () => {
      const result = unwrapWithCount({ data: [], error: null, count: null });
      expect(result.count).toBe(0);
    });

    it('should throw mapped error when error exists', () => {
      expect(() =>
        unwrapWithCount({
          data: null,
          error: { code: 'PGRST116' },
          count: null,
        }),
      ).toThrow('The requested item was not found');
    });
  });
});
