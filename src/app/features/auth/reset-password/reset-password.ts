import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService, extractErrorMessage } from '@core';
import { PasswordStrength, matchValidator, ToastService } from '@shared';
import { environment } from '@env';
import { AUTH_FORM_STYLES } from '../auth-form-styles';

@Component({
  selector: 'app-reset-password',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    PasswordStrength,
  ],
  template: `
    <h2>Set New Password</h2>

    @if (!hasSession()) {
      <p class="no-session" role="alert">
        No active session. Please request a new password reset link.
      </p>
      <p class="footer"><a routerLink="/forgot-password">Request reset link</a></p>
    } @else {
      <form [formGroup]="form" (ngSubmit)="onSubmit()">
        <mat-form-field appearance="outline" class="full-width" subscriptSizing="fixed">
          <mat-label>New Password</mat-label>
          <input
            matInput
            formControlName="password"
            [type]="showPassword() ? 'text' : 'password'"
            aria-describedby="password-requirements"
          />
          <button
            mat-icon-button
            matSuffix
            type="button"
            (click)="showPassword.set(!showPassword())"
            [attr.aria-label]="showPassword() ? 'Hide password' : 'Show password'"
          >
            <mat-icon>{{ showPassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
          </button>
          @if (form.controls.password.hasError('required')) {
            <mat-error>Password is required</mat-error>
          }
          @if (form.controls.password.hasError('minlength')) {
            <mat-error>Password must be at least {{ passwordMinLength }} characters</mat-error>
          }
        </mat-form-field>
        <app-password-strength [password]="passwordValue()" id="password-requirements" />

        <mat-form-field appearance="outline" class="full-width" subscriptSizing="fixed">
          <mat-label>Confirm Password</mat-label>
          <input
            matInput
            formControlName="confirmPassword"
            [type]="showConfirmPassword() ? 'text' : 'password'"
          />
          <button
            mat-icon-button
            matSuffix
            type="button"
            (click)="showConfirmPassword.set(!showConfirmPassword())"
            [attr.aria-label]="showConfirmPassword() ? 'Hide password' : 'Show password'"
          >
            <mat-icon>{{ showConfirmPassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
          </button>
          @if (form.controls.confirmPassword.hasError('required')) {
            <mat-error>Please confirm your password</mat-error>
          }
          @if (form.controls.confirmPassword.hasError('mismatch')) {
            <mat-error>Passwords do not match</mat-error>
          }
        </mat-form-field>

        @if (error()) {
          <p class="error" role="alert">{{ error() }}</p>
        }

        <button
          mat-raised-button
          color="primary"
          class="full-width"
          type="submit"
          [disabled]="loading()"
        >
          {{ loading() ? 'Updating...' : 'Update Password' }}
        </button>
      </form>
    }

    <p class="footer">Back to <a routerLink="/login">Sign in</a></p>
  `,
  styles: [
    AUTH_FORM_STYLES,
    `
      .no-session a {
        color: var(--mat-sys-primary);
      }
      .no-session {
        color: #f44336;
        text-align: center;
      }
    `,
  ],
})
export class ResetPassword {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private toast = inject(ToastService);

  form = this.fb.nonNullable.group(
    {
      password: ['', [Validators.required, Validators.minLength(environment.passwordMinLength)]],
      confirmPassword: ['', Validators.required],
    },
    { validators: matchValidator('password', 'confirmPassword') },
  );

  passwordMinLength = environment.passwordMinLength;
  showPassword = signal(false);
  showConfirmPassword = signal(false);
  passwordValue = signal('');
  hasSession = computed(() => this.auth.loading() || !!this.auth.currentUser());
  loading = signal(false);
  error = signal('');

  constructor() {
    this.form.controls.password.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((value) => this.passwordValue.set(value));
  }

  async onSubmit() {
    if (this.form.invalid) return;

    this.loading.set(true);
    this.error.set('');

    try {
      await this.auth.updatePassword(this.form.value.password!);
      this.toast.success('Password updated successfully');
      this.router.navigate(['/dashboard']);
    } catch (err) {
      this.error.set(extractErrorMessage(err, 'Failed to update password'));
    } finally {
      this.loading.set(false);
    }
  }
}
