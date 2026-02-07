import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService, SocialProvider, extractErrorMessage } from '@core';
import { SocialLoginButton } from '@shared';
import { environment } from '@env';
import { AUTH_FORM_STYLES } from '../auth-form-styles';

@Component({
  selector: 'app-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
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
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Email</mat-label>
        <input matInput formControlName="email" type="email" />
        @if (form.controls.email.hasError('required')) {
          <mat-error>Email is required</mat-error>
        }
        @if (form.controls.email.hasError('email')) {
          <mat-error>Invalid email format</mat-error>
        }
      </mat-form-field>

      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Password</mat-label>
        <input matInput formControlName="password" [type]="showPassword() ? 'text' : 'password'" />
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
      </mat-form-field>

      <div class="forgot-link">
        <a routerLink="/forgot-password">Forgot password?</a>
      </div>

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
        {{ loading() ? 'Signing in...' : 'Sign In' }}
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

    <p class="footer">Don't have an account? <a routerLink="/register">Sign up</a></p>
  `,
  styles: [
    AUTH_FORM_STYLES,
    `
      .forgot-link {
        text-align: right;
        margin-bottom: 16px;
        font-size: 14px;
      }
      .forgot-link a {
        color: var(--mat-sys-primary);
      }
    `,
  ],
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
  loading = signal(false);
  loadingProvider = signal<SocialProvider | null>(null);
  error = signal('');
  socialProviders = environment.socialProviders;

  async onSubmit() {
    if (this.form.invalid) return;

    this.loading.set(true);
    this.error.set('');

    try {
      await this.auth.signIn(this.form.value.email!, this.form.value.password!);
      this.router.navigate(['/dashboard']);
    } catch (err) {
      this.error.set(extractErrorMessage(err, 'Login failed'));
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
