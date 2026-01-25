import { mapError, mapToError } from './error-mapper';

describe('ErrorMapper', () => {
  describe('mapError', () => {
    it('should map explicitly defined error codes', () => {
      expect(mapError({ code: 'invalid_credentials' }).message)
        .toBe('Invalid email or password');
      expect(mapError({ code: 'user_already_exists' }).message)
        .toBe('An account with this email already exists');
      expect(mapError({ code: 'PGRST116' }).message)
        .toBe('The requested item was not found');
    });

    it('should return generic message for unmapped errors', () => {
      expect(mapError({ code: 'unknown_code' }).message)
        .toBe('Something went wrong. Please try again.');
      expect(mapError({ code: '23503', message: 'foreign key violation' }).message)
        .toBe('Something went wrong. Please try again.');
      expect(mapError({ message: 'any random error' }).message)
        .toBe('Something went wrong. Please try again.');
      expect(mapError(null).message)
        .toBe('Something went wrong. Please try again.');
    });

    it('should never expose raw database errors', () => {
      const rawError = {
        code: '23503',
        message: 'insert or update on table "profiles" violates foreign key constraint'
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
});
