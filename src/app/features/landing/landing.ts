import { Component, OnInit, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { environment } from '@env';

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
          <a mat-flat-button class="hero-cta-btn" routerLink="/register"> Get Started Free </a>
          <a mat-flat-button class="hero-signin-btn" routerLink="/login"> Sign In </a>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section class="features">
      <h2>Everything You Need</h2>
      <div class="features-grid">
        <mat-card class="feature-card">
          <mat-card-content>
            <div class="feature-icon-wrap">
              <mat-icon class="feature-icon">security</mat-icon>
            </div>
            <h3>Authentication</h3>
            <p>
              Email/password and social login with Google, GitHub, and more. Password reset and
              email verification included.
            </p>
          </mat-card-content>
        </mat-card>

        <mat-card class="feature-card">
          <mat-card-content>
            <div class="feature-icon-wrap">
              <mat-icon class="feature-icon">note</mat-icon>
            </div>
            <h3>Notes &amp; CRUD</h3>
            <p>
              Full create, read, update, and delete with pagination, search, and realtime updates.
            </p>
          </mat-card-content>
        </mat-card>

        <mat-card class="feature-card">
          <mat-card-content>
            <div class="feature-icon-wrap">
              <mat-icon class="feature-icon">chat</mat-icon>
            </div>
            <h3>Realtime Chat</h3>
            <p>Live messaging with presence indicators powered by Supabase Realtime.</p>
          </mat-card-content>
        </mat-card>

        <mat-card class="feature-card">
          <mat-card-content>
            <div class="feature-icon-wrap">
              <mat-icon class="feature-icon">cloud_upload</mat-icon>
            </div>
            <h3>File Storage</h3>
            <p>Upload, download, and manage files with avatar support and signed URLs.</p>
          </mat-card-content>
        </mat-card>

        <mat-card class="feature-card">
          <mat-card-content>
            <div class="feature-icon-wrap">
              <mat-icon class="feature-icon">palette</mat-icon>
            </div>
            <h3>Theming</h3>
            <p>
              Three color themes with dark and light mode. User preferences persist automatically.
            </p>
          </mat-card-content>
        </mat-card>

        <mat-card class="feature-card">
          <mat-card-content>
            <div class="feature-icon-wrap">
              <mat-icon class="feature-icon">speed</mat-icon>
            </div>
            <h3>SSR &amp; Signals</h3>
            <p>
              Server-side rendered, zoneless, and signal-driven. Fast first paint with zero zone.js.
            </p>
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

    /* ── Hero ─────────────────────────────────────── */
    @keyframes heroGradient {
      0% {
        background-position: 0% 50%;
      }
      50% {
        background-position: 100% 50%;
      }
      100% {
        background-position: 0% 50%;
      }
    }

    .hero {
      position: relative;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 100px 24px 64px;
      background: linear-gradient(135deg, #121215 0%, #1e1e22 40%, #262336 70%, #121215 100%);
      background-size: 300% 300%;
      animation: heroGradient 8s ease infinite;
      color: white;
      text-align: center;
      overflow: hidden;
    }

    .hero::before {
      content: '';
      position: absolute;
      width: 700px;
      height: 700px;
      border-radius: 50%;
      background: radial-gradient(circle, var(--mat-sys-primary, #3b82f6) 0%, transparent 70%);
      opacity: 0.1;
      top: -200px;
      right: -200px;
      pointer-events: none;
    }

    .hero::after {
      content: '';
      position: absolute;
      width: 500px;
      height: 500px;
      border-radius: 50%;
      background: radial-gradient(circle, var(--mat-sys-primary, #3b82f6) 0%, transparent 70%);
      opacity: 0.06;
      bottom: -150px;
      left: -150px;
      pointer-events: none;
    }

    .hero-content {
      position: relative;
      max-width: 750px;
    }

    .hero h1 {
      font-size: 3rem;
      font-weight: 800;
      letter-spacing: -0.02em;
      margin: 0 0 24px;
      line-height: 1.2;
    }

    .subtitle {
      font-size: 1.25rem;
      margin: 0 auto 40px;
      max-width: 600px;
      opacity: 0.6;
      line-height: 1.6;
    }

    .hero-actions {
      display: flex;
      gap: 20px;
      justify-content: center;
      align-items: center;
      flex-wrap: wrap;
    }

    .hero-actions a {
      height: 48px;
      padding: 0 32px;
      font-size: 16px;
      line-height: 48px;
      border-radius: 24px;
    }

    .hero-cta-btn {
      background: white !important;
      color: #121215 !important;
      font-weight: 600;
    }

    .hero-cta-btn:hover {
      background: #e4e4e7 !important;
    }

    .hero-signin-btn {
      background: rgba(255, 255, 255, 0.1) !important;
      color: rgba(255, 255, 255, 0.8) !important;
      backdrop-filter: blur(4px);
    }

    .hero-signin-btn:hover {
      background: rgba(255, 255, 255, 0.18) !important;
      color: white !important;
    }

    /* ── Features ──────────────────────────────────── */
    .features {
      padding: 80px 24px;
      background: #121215;
    }

    .features h2 {
      text-align: center;
      font-size: 2rem;
      margin: 0 0 48px;
      color: #fafafa;
    }

    .features h2::after {
      content: '';
      display: block;
      width: 40px;
      height: 3px;
      background: var(--mat-sys-primary, #3b82f6);
      margin: 16px auto 0;
      border-radius: 2px;
    }

    .features-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 24px;
      max-width: 1100px;
      margin: 0 auto;
    }

    .feature-card {
      text-align: center;
      transition: transform 0.2s ease;
      background: #1e1e22 !important;
      border: 1px solid #2a2a2e !important;
    }

    .feature-card:hover {
      transform: scale(1.02);
      border-color: #3f3f44 !important;
    }

    .feature-icon-wrap {
      display: flex;
      justify-content: center;
      margin-bottom: 16px;
    }

    .feature-icon {
      background: var(--mat-sys-primary, #3b82f6);
      color: white;
      width: 56px;
      height: 56px;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 28px;
    }

    .feature-card h3 {
      font-size: 1.125rem;
      font-weight: 600;
      margin: 0 0 8px;
      color: #fafafa;
    }

    .feature-card p {
      color: #a1a1aa;
      line-height: 1.6;
    }

    /* ── Footer ────────────────────────────────────── */
    .footer {
      padding: 32px 24px;
      text-align: center;
      border-top: 1px solid #2a2a2e;
      background: #121215;
      color: #52525b;
    }

    .footer p {
      margin: 0;
    }

    /* ── Mobile ────────────────────────────────────── */
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

      .hero-actions {
        flex-direction: column;
      }

      .hero-actions a {
        width: 100%;
        text-align: center;
      }

      .features {
        padding: 48px 16px;
      }

      .features h2 {
        font-size: 1.5rem;
      }

      .features-grid {
        grid-template-columns: 1fr;
      }

      .feature-icon {
        width: 48px;
        height: 48px;
        font-size: 24px;
        border-radius: 12px;
      }
    }

    @media (min-width: 601px) and (max-width: 900px) {
      .features-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }
  `,
})
export class Landing implements OnInit {
  private meta = inject(Meta);
  private title = inject(Title);

  ngOnInit() {
    this.title.setTitle(environment.siteTitle);

    this.meta.updateTag({ property: 'og:title', content: environment.siteTitle });
    this.meta.updateTag({ property: 'og:description', content: environment.siteDescription });
    this.meta.updateTag({ property: 'og:url', content: environment.siteUrl });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({ name: 'description', content: environment.siteDescription });
  }
}
