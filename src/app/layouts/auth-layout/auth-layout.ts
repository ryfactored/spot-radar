import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LoadingBar } from '@shared';
import { environment } from '@env';
import { routeAnimation } from '../../shared/animations/route-animation';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [RouterOutlet, LoadingBar],
  animations: [routeAnimation],
  template: `
    <app-loading-bar />
    <main class="auth-container">
      <div class="auth-card" [@routeAnimation]="routeKey()">
        <h1 class="app-title">{{ siteTitle }}</h1>
        <router-outlet (activate)="onActivate()" />
      </div>
    </main>
  `,
  styles: `
    .auth-container {
      min-height: 100dvh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
      box-sizing: border-box;
      background:
        radial-gradient(
          ellipse at top left,
          color-mix(in srgb, var(--mat-sys-primary, #3b82f6) 12%, transparent) 0%,
          transparent 50%
        ),
        radial-gradient(
          ellipse at bottom right,
          color-mix(in srgb, var(--mat-sys-primary, #3b82f6) 8%, transparent) 0%,
          transparent 50%
        ),
        #121215;
    }
    .auth-card {
      background: rgba(30, 30, 34, 0.85);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      color: #fafafa;
      padding: 40px;
      border-radius: 12px;
      border: 1px solid #2a2a2e;
      box-shadow: 0 4px 24px rgba(0, 0, 0, 0.2);
      width: 100%;
      max-width: 400px;
      box-sizing: border-box;
    }
    .app-title {
      text-align: center;
      margin-bottom: 24px;
      color: var(--mat-sys-primary, #3b82f6);
    }
    @media (max-width: 480px) {
      .auth-card {
        padding: 24px;
      }
    }
  `,
})
export class AuthLayout {
  siteTitle = environment.siteTitle;
  routeKey = signal(0);

  onActivate() {
    this.routeKey.update((k) => k + 1);
  }
}
