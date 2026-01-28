import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatIconModule, MatCardModule],
  template: `
    <!-- Hero Section -->
    <section class="hero">
      <div class="hero-content">
        <h1>Build Modern Web Apps Faster</h1>
        <p class="subtitle">
          A production-ready Angular template with authentication, theming, and reusable components.
          Start building your next project in minutes.
        </p>
        <div class="hero-actions">
          <a mat-raised-button color="primary" routerLink="/register"> Get Started Free </a>
          <a mat-stroked-button routerLink="/login"> Sign In </a>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section class="features">
      <h2>Everything You Need</h2>
      <div class="features-grid">
        <mat-card class="feature-card">
          <mat-card-header>
            <mat-icon mat-card-avatar class="feature-icon">security</mat-icon>
            <mat-card-title>Authentication</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <p>
              Built-in authentication with Supabase. Email/password and social logins ready to go.
            </p>
          </mat-card-content>
        </mat-card>

        <mat-card class="feature-card">
          <mat-card-header>
            <mat-icon mat-card-avatar class="feature-icon">palette</mat-icon>
            <mat-card-title>Theming</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <p>
              Multiple color themes with light and dark modes. User preferences persist
              automatically.
            </p>
          </mat-card-content>
        </mat-card>

        <mat-card class="feature-card">
          <mat-card-header>
            <mat-icon mat-card-avatar class="feature-icon">widgets</mat-icon>
            <mat-card-title>Components</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <p>Pre-built UI components like data tables, search inputs, toasts, and dialogs.</p>
          </mat-card-content>
        </mat-card>

        <mat-card class="feature-card">
          <mat-card-header>
            <mat-icon mat-card-avatar class="feature-icon">speed</mat-icon>
            <mat-card-title>Performance</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <p>Lazy-loaded routes, standalone components, and signals for optimal performance.</p>
          </mat-card-content>
        </mat-card>
      </div>
    </section>

    <!-- Footer -->
    <footer class="footer">
      <p>Built with Angular &amp; Angular Material</p>
    </footer>
  `,
  styles: `
    :host {
      display: block;
    }

    .hero {
      min-height: calc(100vh - 64px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 100px 24px 64px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      text-align: center;
    }

    .hero-content {
      max-width: 700px;
    }

    .hero h1 {
      font-size: 3rem;
      font-weight: 700;
      margin: 0 0 24px;
      line-height: 1.2;
    }

    .subtitle {
      font-size: 1.25rem;
      margin: 0 0 40px;
      opacity: 0.9;
      line-height: 1.6;
    }

    .hero-actions {
      display: flex;
      gap: 16px;
      justify-content: center;
      align-items: center;
      flex-wrap: wrap;
    }

    .hero-actions a {
      height: 48px;
      padding: 0 32px;
      font-size: 16px;
      line-height: 48px;
    }

    .hero-actions a[mat-stroked-button] {
      border-color: white;
      color: white;
    }

    .features {
      padding: 80px 24px;
      background: #fafafa;
    }

    .features h2 {
      text-align: center;
      font-size: 2rem;
      margin: 0 0 48px;
      color: #333;
    }

    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 24px;
      max-width: 1100px;
      margin: 0 auto;
    }

    .feature-card {
      text-align: center;
    }

    .feature-card mat-card-header {
      justify-content: center;
    }

    .feature-icon {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      width: 48px;
      height: 48px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
    }

    .feature-card p {
      color: #666;
      line-height: 1.6;
    }

    .footer {
      padding: 32px 24px;
      text-align: center;
      background: #333;
      color: #999;
    }

    .footer p {
      margin: 0;
    }

    /* Dark theme support */
    :host-context(.dark-theme) .features {
      background: #1e1e1e;
    }

    :host-context(.dark-theme) .features h2 {
      color: #fff;
    }

    :host-context(.dark-theme) .feature-card p {
      color: #aaa;
    }

    @media (max-width: 600px) {
      .hero {
        padding: 80px 16px 48px;
      }

      .hero h1 {
        font-size: 2rem;
      }

      .subtitle {
        font-size: 1rem;
      }

      .features {
        padding: 48px 16px;
      }

      .features h2 {
        font-size: 1.5rem;
      }
    }
  `,
})
export class Landing {}
