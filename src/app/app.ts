import { Component, inject, effect, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Title } from '@angular/platform-browser';
import { Router, NavigationEnd, ActivatedRoute, RouterOutlet } from '@angular/router';
import { filter, map, take } from 'rxjs';
import { PreferencesService, COLOR_THEMES } from './core/preferences';
import { environment } from '@env';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <router-outlet />
    @if (!isProd && isBrowser) {
      <div class="dev-badge"><span class="material-icons">code</span></div>
    }
  `,
  styles: `
    .dev-badge {
      position: fixed;
      bottom: 8px;
      left: 8px;
      background: #03a9f4;
      color: white;
      padding: 6px;
      border-radius: 4px;
      z-index: 99999;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .dev-badge .material-icons {
      font-size: 18px;
    }
  `,
})
export class App {
  private preferences = inject(PreferencesService);
  private platformId = inject(PLATFORM_ID);

  isProd = environment.production;
  isBrowser = false;
  private colorThemeClasses = COLOR_THEMES.map((t) => t.value);

  constructor() {
    // Skip theme handling on server (no document)
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    // Restore visibility (hidden by inline script to prevent SSR flash)
    const router = inject(Router);
    const isOAuthCallback =
      location.search.includes('code=') || location.hash.includes('access_token');
    if (!isOAuthCallback) {
      document.documentElement.style.visibility = '';
    } else {
      // During OAuth callback, keep hidden until auth redirects away from landing page
      router.events
        .pipe(
          filter((e): e is NavigationEnd => e instanceof NavigationEnd),
          filter((e) => e.urlAfterRedirects !== '/'),
          take(1),
        )
        .subscribe(() => {
          document.documentElement.style.visibility = '';
        });
      // Safety fallback in case auth processing fails
      setTimeout(() => {
        document.documentElement.style.visibility = '';
      }, 5000);
    }

    // Enable dev badge (only in browser to avoid hydration mismatch)
    this.isBrowser = true;

    // Update page title on navigation
    const titleService = inject(Title);
    const route = inject(ActivatedRoute);
    router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        map(() => {
          let child = route;
          while (child.firstChild) child = child.firstChild;
          return child.snapshot.data['title'] as string | undefined;
        }),
      )
      .subscribe((pageTitle) => {
        titleService.setTitle(
          pageTitle ? `${pageTitle} | ${environment.siteTitle}` : environment.siteTitle,
        );
      });

    // Apply color theme class to body
    effect(() => {
      const colorTheme = this.preferences.colorTheme();
      // Remove all theme classes first
      this.colorThemeClasses.forEach((t) => {
        document.body.classList.remove(`theme-${t}`);
      });
      // Add current theme class
      document.body.classList.add(`theme-${colorTheme}`);
    });

    // Apply dark mode class to body
    effect(() => {
      const darkMode = this.preferences.darkMode();
      document.body.classList.toggle('dark-mode', darkMode);
    });
  }
}
