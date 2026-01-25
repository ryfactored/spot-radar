import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService, SocialProvider } from '@core';
import { SocialLoginButton, PasswordStrength, matchValidator } from '@shared';

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
        <input matInput formControlName="email" type="email">
        @if (form.controls.email.hasError('required')) {
          <mat-error>Email is required</mat-error>
        }
        @if (form.controls.email.hasError('email')) {
          <mat-error>Invalid email format</mat-error>
        }
      </mat-form-field>

      <mat-form-field appearance="outline" class="full-width" subscriptSizing="fixed">
        <mat-label>Password</mat-label>
        <input matInput formControlName="password" [type]="showPassword() ? 'text' : 'password'">
        <button mat-icon-button matSuffix type="button" (click)="showPassword.set(!showPassword())">
          <mat-icon>{{ showPassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
        </button>
        @if (form.controls.password.hasError('required')) {
          <mat-error>Password is required</mat-error>
        }
        @if (form.controls.password.hasError('minlength')) {
          <mat-error>Password must be at least 8 characters</mat-error>
        }
      </mat-form-field>
      <app-password-strength [password]="passwordValue()" />

      <mat-form-field appearance="outline" class="full-width" subscriptSizing="fixed">
        <mat-label>Confirm Password</mat-label>
        <input matInput formControlName="confirmPassword" [type]="showConfirmPassword() ? 'text' : 'password'">
        <button mat-icon-button matSuffix type="button" (click)="showConfirmPassword.set(!showConfirmPassword())">
          <mat-icon>{{ showConfirmPassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
        </button>
        @if (form.controls.confirmPassword.hasError('required')) {
          <mat-error>Please confirm your password</mat-error>
        }
        @if (form.controls.confirmPassword.hasError('mismatch')) {
          <mat-error>Passwords do not match</mat-error>
        }
      </mat-form-field>

      @if (error) {
        <p class="error">{{ error }}</p>
      }

      @if (success) {
        <p class="success">{{ success }}</p>
      }

      <button mat-raised-button color="primary" class="full-width" type="submit" [disabled]="loading">
        {{ loading ? 'Creating account...' : 'Sign Up' }}
      </button>
    </form>

    <mat-divider class="divider"></mat-divider>

    <div class="social-buttons">
      <app-social-login-button provider="google" (clicked)="signUpWithProvider('google')" />
      <app-social-login-button provider="github" (clicked)="signUpWithProvider('github')" />
      <app-social-login-button provider="discord" (clicked)="signUpWithProvider('discord')" />
      <app-social-login-button provider="spotify" (clicked)="signUpWithProvider('spotify')" />
      <app-social-login-button provider="apple" (clicked)="signUpWithProvider('apple')" />
    </div>

    <p class="footer">
      Already have an account? <a routerLink="/login">Sign in</a>
    </p>
  `,
  styles: `
    h2 { text-align: center; margin-bottom: 24px; }
    .full-width { width: 100%; }
    mat-form-field { margin-bottom: 16px; }
    .divider { margin: 24px 0; }
    .social-buttons { margin-bottom: 16px; }
    .footer { text-align: center; margin-top: 16px; }
    .error { color: #f44336; text-align: center; }
    .success { color: #4caf50; text-align: center; }
  `
})
export class Register {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private destroyRef = inject(DestroyRef);

  form = this.fb.nonNullable.group(
    {
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
    },
    { validators: matchValidator('password', 'confirmPassword') }
  );

  showPassword = signal(false);
  showConfirmPassword = signal(false);
  passwordValue = signal('');
  loading = false;
  error = '';
  success = '';

  constructor() {
    this.form.controls.password.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => this.passwordValue.set(value));
  }

  async onSubmit() {
    if (this.form.invalid) return;

    this.loading = true;
    this.error = '';

    try {
      await this.auth.signUp(this.form.value.email!, this.form.value.password!);
      this.success = 'Account created! Check your email to confirm.';
    } catch (err: any) {
      this.error = err.message || 'Registration failed';
    } finally {
      this.loading = false;
    }
  }

  async signUpWithProvider(provider: SocialProvider) {
    try {
      await this.auth.signInWithProvider(provider);
    } catch (err: any) {
      this.error = err.message || 'Social login failed';
    }
  }
}