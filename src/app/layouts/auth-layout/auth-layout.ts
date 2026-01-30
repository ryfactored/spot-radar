import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { environment } from '@env';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <main class="auth-container">
      <div class="auth-card">
        <h1 class="app-title">{{ siteTitle }}</h1>
        <router-outlet />
      </div>
    </main>
  `,
  styles: `
    .auth-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background:
        radial-gradient(ellipse at top left, color-mix(in srgb, var(--mat-sys-primary, #3b82f6) 12%, transparent) 0%, transparent 50%),
        radial-gradient(ellipse at bottom right, color-mix(in srgb, var(--mat-sys-primary, #3b82f6) 8%, transparent) 0%, transparent 50%),
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
    }
    .app-title {
      text-align: center;
      margin-bottom: 24px;
      color: var(--mat-sys-primary, #3b82f6);
    }
  `,
})
export class AuthLayout {
  siteTitle = environment.siteTitle;
}
