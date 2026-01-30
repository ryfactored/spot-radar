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
      background: var(--mat-app-background-color, #f5f5f5);
    }
    .auth-card {
      background: var(--mdc-elevated-card-container-color, white);
      color: var(--mat-app-text-color, inherit);
      padding: 40px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      width: 100%;
      max-width: 400px;
    }
    .app-title {
      text-align: center;
      margin-bottom: 24px;
      color: var(--mat-sys-primary, #6366f1);
    }
  `,
})
export class AuthLayout {
  siteTitle = environment.siteTitle;
}
