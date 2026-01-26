import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService, SocialProvider } from '@core';
import { SocialLoginButton } from '@shared';

@Component({
  selector: 'app-login',
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
  ],
  template: `
    <h2>Sign In</h2>

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
      </mat-form-field>

      @if (error) {
        <p class="error">{{ error }}</p>
      }

      <button mat-raised-button color="primary" class="full-width" type="submit" [disabled]="loading">
        {{ loading ? 'Signing in...' : 'Sign In' }}
      </button>
    </form>

    <mat-divider class="divider"></mat-divider>

    <div class="social-buttons">
      <app-social-login-button provider="google" [loading]="loadingProvider() === 'google'" (clicked)="loginWithProvider('google')" />
      <app-social-login-button provider="github" [loading]="loadingProvider() === 'github'" (clicked)="loginWithProvider('github')" />
      <app-social-login-button provider="discord" [loading]="loadingProvider() === 'discord'" (clicked)="loginWithProvider('discord')" />
      <app-social-login-button provider="spotify" [loading]="loadingProvider() === 'spotify'" (clicked)="loginWithProvider('spotify')" />
      <app-social-login-button provider="apple" [loading]="loadingProvider() === 'apple'" (clicked)="loginWithProvider('apple')" />
    </div>

    <p class="footer">
      Don't have an account? <a routerLink="/register">Sign up</a>
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
  `
})
export class Login {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  showPassword = signal(false);
  loading = false;
  loadingProvider = signal<SocialProvider | null>(null);
  error = '';

  async onSubmit() {
    if (this.form.invalid) return;

    this.loading = true;
    this.error = '';

    try {
      await this.auth.signIn(this.form.value.email!, this.form.value.password!);
      this.router.navigate(['/dashboard']);
    } catch (err: any) {
      this.error = err.message || 'Login failed';
    } finally {
      this.loading = false;
    }
  }

  async loginWithProvider(provider: SocialProvider) {
    this.loadingProvider.set(provider);
    this.error = '';
    try {
      await this.auth.signInWithProvider(provider);
      // Note: OAuth redirects away, so we won't reach here on success
    } catch (err: any) {
      this.error = err.message || 'Social login failed';
      this.loadingProvider.set(null);
    }
  }
}