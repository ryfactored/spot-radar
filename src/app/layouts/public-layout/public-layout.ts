import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { environment } from '@env';

@Component({
  selector: 'app-public-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, MatToolbarModule, MatButtonModule],
  template: `
    <a class="skip-link" href="#main-content">Skip to main content</a>
    <header>
      <mat-toolbar class="toolbar" role="navigation" aria-label="Main navigation">
        <a routerLink="/" class="logo">{{ siteTitle }}</a>
        <span class="spacer"></span>
        <a mat-button routerLink="/login">Sign In</a>
        <a mat-flat-button class="toolbar-cta" routerLink="/register">Get Started</a>
      </mat-toolbar>
    </header>
    <main id="main-content">
      <router-outlet />
    </main>
  `,
  styles: `
    .toolbar {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 100;
      background: transparent;
      color: white;
      box-shadow: none;
    }

    .logo {
      color: #a4c9ff;
      text-decoration: none;
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-weight: 800;
      font-size: 20px;
      letter-spacing: -0.02em;
    }

    .spacer {
      flex: 1 1 auto;
    }

    a[mat-button] {
      margin-right: 8px;
      color: rgba(240, 237, 241, 0.9);
    }

    .toolbar-cta {
      background: linear-gradient(135deg, #a4c9ff, #60a5fa) !important;
      color: #000 !important;
      border-radius: 0.5rem;
    }

    .toolbar-cta:hover {
      opacity: 0.9;
    }
  `,
})
export class PublicLayout {
  siteTitle = environment.siteTitle;
}
