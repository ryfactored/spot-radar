import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '@core';

@Component({
  selector: 'app-verify-email',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    @if (isLoading()) {
      <div class="status-container">
        <mat-spinner diameter="48"></mat-spinner>
        <h2>Verifying your email...</h2>
        <p>Please wait while we confirm your email address.</p>
      </div>
    } @else if (isVerified()) {
      <div class="status-container">
        <mat-icon class="status-icon success">check_circle</mat-icon>
        <h2>Your email has been verified!</h2>
        <p>Your account is now active and ready to use.</p>
        <a mat-raised-button color="primary" routerLink="/dashboard">Go to Dashboard</a>
      </div>
    } @else if (hasError()) {
      <div class="status-container">
        <mat-icon class="status-icon error">error</mat-icon>
        <h2>Email Verification Failed</h2>
        <p>This verification link is invalid or has expired.</p>
        <p class="footer">
          <a routerLink="/register">Back to Register</a> to request a new verification email.
        </p>
      </div>
    } @else {
      <div class="status-container">
        <mat-icon class="status-icon info">mail</mat-icon>
        <h2>Email Verification</h2>
        <p>Check your email for a verification link.</p>
        <p class="hint">If you don't see it, check your spam folder.</p>
        <p class="footer">
          <a routerLink="/login">Back to Sign in</a>
        </p>
      </div>
    }
  `,
  styles: `
    h2 {
      text-align: center;
      margin-bottom: 8px;
    }
    .status-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 24px 0;
    }
    .status-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 16px;
    }
    .status-icon.success {
      color: #4caf50;
    }
    .status-icon.error {
      color: #f44336;
    }
    .status-icon.info {
      color: var(--mat-sys-primary);
    }
    .hint {
      color: var(--mat-sys-on-surface-variant);
      font-size: 14px;
    }
    .footer {
      margin-top: 16px;
    }
    .footer a {
      color: var(--mat-sys-primary);
    }
    a[mat-raised-button] {
      margin-top: 16px;
    }
  `,
})
export class VerifyEmail {
  private auth = inject(AuthService);

  private hadToken =
    typeof location !== 'undefined' &&
    (location.hash.includes('access_token') || location.search.includes('token'));

  isLoading = computed(() => this.auth.loading());
  isVerified = computed(() => !this.auth.loading() && !!this.auth.currentUser());
  hasError = computed(() => !this.auth.loading() && !this.auth.currentUser() && this.hadToken);
}
