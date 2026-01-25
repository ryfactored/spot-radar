import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Validator that checks if two form controls have matching values.
 * Apply to the form group, not individual controls.
 *
 * Usage:
 * ```
 * form = this.fb.group({
 *   password: ['', Validators.required],
 *   confirmPassword: ['', Validators.required],
 * }, { validators: matchValidator('password', 'confirmPassword') });
 * ```
 */
export function matchValidator(controlName: string, matchingControlName: string): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const control = group.get(controlName);
    const matchingControl = group.get(matchingControlName);

    if (!control || !matchingControl) {
      return null;
    }

    // Don't validate if either field is empty (let required validator handle that)
    if (!control.value || !matchingControl.value) {
      return null;
    }

    if (control.value !== matchingControl.value) {
      // Set error on the matching control for display purposes
      matchingControl.setErrors({ mismatch: true });
      return { mismatch: true };
    }

    // Clear mismatch error if values match (preserve other errors)
    if (matchingControl.hasError('mismatch')) {
      const errors = { ...matchingControl.errors };
      delete errors['mismatch'];
      matchingControl.setErrors(Object.keys(errors).length ? errors : null);
    }

    return null;
  };
}
