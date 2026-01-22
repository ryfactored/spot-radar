import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <div class="auth-container">
      <div class="auth-card">
        <h1 class="app-title">Angular Starter</h1>
        <router-outlet />
      </div>
    </div>
  `,
  styles: `
    .auth-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f5f5f5;
    }
    .auth-card {
      background: white;
      padding: 40px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      width: 100%;
      max-width: 400px;
    }
    .app-title {
      text-align: center;
      margin-bottom: 24px;
      color: #3f51b5;
    }

    :host-context(.dark-theme) .auth-container {
      background: var(--mat-app-background-color, #1e1e1e);
    }
    :host-context(.dark-theme) .auth-card {
      background: var(--mdc-elevated-card-container-color, #2d2d2d);
      color: var(--mat-app-text-color, #fff);
    }
    :host-context(.dark-theme) .app-title {
      color: #c5cae9;
    }
  `
})
export class AuthLayout {}