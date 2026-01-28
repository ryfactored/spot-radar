import { Component } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-public-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, MatToolbarModule, MatButtonModule],
  template: `
    <header>
      <mat-toolbar color="primary" class="toolbar" role="navigation" aria-label="Main navigation">
        <a routerLink="/" class="logo">Angular Starter</a>
        <span class="spacer"></span>
        <a mat-button routerLink="/login">Sign In</a>
        <a mat-raised-button color="accent" routerLink="/register">Get Started</a>
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
    }
  `,
})
export class PublicLayout {}
