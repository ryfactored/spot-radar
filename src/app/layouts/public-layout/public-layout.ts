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
    <header>
      <mat-toolbar class="toolbar" role="navigation" aria-label="Main navigation">
        <a routerLink="/" class="logo">{{ siteTitle }}</a>
        <span class="spacer"></span>
        <a mat-button routerLink="/login">Sign In</a>
        <a mat-flat-button class="toolbar-cta" routerLink="/register">Get Started</a>
      </mat-toolbar>
    </header>
    <main>
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
      color: inherit;
      text-decoration: none;
      font-weight: 500;
      font-size: 20px;
    }

    .spacer {
      flex: 1 1 auto;
    }

    a[mat-button] {
      margin-right: 8px;
      color: rgba(255, 255, 255, 0.9);
    }

    .toolbar-cta {
      background: rgba(255, 255, 255, 0.15) !important;
      color: white !important;
      backdrop-filter: blur(4px);
      border-radius: 24px;
    }

    .toolbar-cta:hover {
      background: rgba(255, 255, 255, 0.25) !important;
    }
  `,
})
export class PublicLayout {
  siteTitle = environment.siteTitle;
}
