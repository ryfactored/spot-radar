import { FormBuilder } from '@angular/forms';
import { matchValidator } from './match.validator';

describe('matchValidator', () => {
  const fb = new FormBuilder();

  it('should return null when values match', () => {
    const form = fb.group(
      {
        password: ['test123'],
        confirmPassword: ['test123'],
      },
      { validators: matchValidator('password', 'confirmPassword') }
    );

    expect(form.errors).toBeNull();
    expect(form.get('confirmPassword')?.hasError('mismatch')).toBe(false);
  });

  it('should return mismatch error when values differ', () => {
    const form = fb.group(
      {
        password: ['test123'],
        confirmPassword: ['different'],
      },
      { validators: matchValidator('password', 'confirmPassword') }
    );

    expect(form.errors).toEqual({ mismatch: true });
    expect(form.get('confirmPassword')?.hasError('mismatch')).toBe(true);
  });

  it('should return null when either field is empty', () => {
    const form = fb.group(
      {
        password: ['test123'],
        confirmPassword: [''],
      },
      { validators: matchValidator('password', 'confirmPassword') }
    );

    expect(form.errors).toBeNull();
  });

  it('should clear mismatch error when values become equal', () => {
    const form = fb.group(
      {
        password: ['test123'],
        confirmPassword: ['different'],
      },
      { validators: matchValidator('password', 'confirmPassword') }
    );

    expect(form.get('confirmPassword')?.hasError('mismatch')).toBe(true);

    form.get('confirmPassword')?.setValue('test123');
    form.updateValueAndValidity();

    expect(form.get('confirmPassword')?.hasError('mismatch')).toBe(false);
  });

  it('should handle non-existent controls gracefully', () => {
    const form = fb.group(
      {
        password: ['test123'],
      },
      { validators: matchValidator('password', 'nonexistent') }
    );

    expect(form.errors).toBeNull();
  });
});
