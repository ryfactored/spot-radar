import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LoadingBar } from '@shared';
import { environment } from '@env';
import { routeAnimation } from '@shared';

@Component({
  selector: 'app-auth-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, LoadingBar],
  animations: [routeAnimation],
  template: `
    <a class="skip-link" href="#main-content">Skip to main content</a>
    <app-loading-bar />
    <main id="main-content" class="auth-container">
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
        radial-gradient(ellipse at 20% 20%, rgba(164, 201, 255, 0.12) 0%, transparent 50%),
        radial-gradient(ellipse at 80% 80%, rgba(164, 201, 255, 0.08) 0%, transparent 50%), #0e0e11;
    }
    .auth-card {
      background: rgba(25, 25, 29, 0.8);
      backdrop-filter: blur(24px);
      -webkit-backdrop-filter: blur(24px);
      color: #f0edf1;
      padding: 40px;
      border-radius: 0.75rem;
      border: 1px solid rgba(72, 72, 71, 0.15);
      box-shadow: 0 40px 40px rgba(164, 201, 255, 0.06);
      width: 100%;
      max-width: 400px;
      box-sizing: border-box;
    }
    .app-title {
      text-align: center;
      margin-bottom: 24px;
      color: #a4c9ff;
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-weight: 700;
      letter-spacing: -0.02em;
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
