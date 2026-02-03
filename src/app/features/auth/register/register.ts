import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService, SocialProvider, extractErrorMessage } from '@core';
import { SocialLoginButton, PasswordStrength, matchValidator } from '@shared';
import { environment } from '@env';
import { AUTH_FORM_STYLES } from '../auth-form-styles';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    SocialLoginButton,
    PasswordStrength,
  ],
  template: `
    <h2>Create Account</h2>

    <form [formGroup]="form" (ngSubmit)="onSubmit()">
      <mat-form-field appearance="outline" class="full-width" subscriptSizing="fixed">
        <mat-label>Email</mat-label>
        <input matInput formControlName="email" type="email" />
        @if (form.controls.email.hasError('required')) {
          <mat-error>Email is required</mat-error>
        }
        @if (form.controls.email.hasError('email')) {
          <mat-error>Invalid email format</mat-error>
        }
      </mat-form-field>

      <mat-form-field appearance="outline" class="full-width" subscriptSizing="fixed">
        <mat-label>Password</mat-label>
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

      @if (success()) {
        <p class="success" role="status">{{ success() }}</p>
      }

      <button
        mat-raised-button
        color="primary"
        class="full-width"
        type="submit"
        [disabled]="loading()"
      >
        {{ loading() ? 'Creating account...' : 'Sign Up' }}
      </button>
    </form>

    @if (socialProviders.length > 0) {
      <mat-divider class="divider"></mat-divider>
      <div class="social-buttons">
        @for (provider of socialProviders; track provider) {
          <app-social-login-button
            [provider]="provider"
            [loading]="loadingProvider() === provider"
            (clicked)="loginWithProvider(provider)"
          />
        }
      </div>
    }

    <p class="footer">Already have an account? <a routerLink="/login">Sign in</a></p>
  `,
  styles: AUTH_FORM_STYLES,
})
export class Register {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);

  form = this.fb.nonNullable.group(
    {
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(environment.passwordMinLength)]],
      confirmPassword: ['', Validators.required],
    },
    { validators: matchValidator('password', 'confirmPassword') },
  );

  showPassword = signal(false);
  showConfirmPassword = signal(false);
  passwordValue = signal('');
  loading = signal(false);
  loadingProvider = signal<SocialProvider | null>(null);
  error = signal('');
  success = signal('');
  passwordMinLength = environment.passwordMinLength;
  socialProviders = environment.socialProviders;

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
      await this.auth.signUp(this.form.value.email!, this.form.value.password!);
      this.success.set('Account created! Check your email to confirm.');
    } catch (err) {
      this.error.set(extractErrorMessage(err, 'Registration failed'));
    } finally {
      this.loading.set(false);
    }
  }

  async loginWithProvider(provider: SocialProvider) {
    this.loadingProvider.set(provider);
    this.error.set('');
    try {
      await this.auth.signInWithProvider(provider);
      // Note: OAuth redirects away, so we won't reach here on success
    } catch (err) {
      this.error.set(extractErrorMessage(err, 'Social login failed'));
      this.loadingProvider.set(null);
    }
  }
}
