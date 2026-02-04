import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '@core';

@Component({
  selector: 'app-not-found',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, MatButtonModule, MatIconModule],
  template: `
    <div class="not-found">
      <mat-icon aria-hidden="true">search_off</mat-icon>
      <h2>Page Not Found</h2>
      <p>The page you're looking for doesn't exist or has been moved.</p>
      @if (isAuthenticated()) {
        <a mat-raised-button color="primary" routerLink="/dashboard">Go to Dashboard</a>
      } @else {
        <a mat-raised-button color="primary" routerLink="/">Go Home</a>
      }
      <p class="footer">
        @if (isAuthenticated()) {
          Back to <a routerLink="/dashboard">Dashboard</a>
        } @else {
          Back to <a routerLink="/login">Sign in</a>
        }
      </p>
    </div>
  `,
  styles: `
    .not-found {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 24px 0;
    }
    mat-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      margin-bottom: 16px;
      opacity: 0.4;
    }
    h2 {
      text-align: center;
      margin-bottom: 8px;
    }
    p {
      margin: 0 0 24px;
      color: var(--mat-sys-on-surface-variant);
    }
    .footer {
      text-align: center;
      margin-top: 16px;
    }
    .footer a {
      color: var(--mat-sys-primary);
    }
  `,
})
export class NotFound {
  private auth = inject(AuthService);
  isAuthenticated = computed(() => !!this.auth.currentUser());
}
