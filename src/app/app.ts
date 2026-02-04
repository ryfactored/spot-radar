import { ChangeDetectionStrategy, Component, inject, effect, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Title } from '@angular/platform-browser';
import { Router, NavigationEnd, ActivatedRoute, RouterOutlet } from '@angular/router';
import { filter, map, take } from 'rxjs';
import { PreferencesService, COLOR_THEMES } from '@core';
import { environment } from '@env';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
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

    // Restore visibility after first navigation (hidden by inline script in index.html)
    const router = inject(Router);
    if (document.documentElement.style.visibility === 'hidden') {
      router.events
        .pipe(
          filter((e): e is NavigationEnd => e instanceof NavigationEnd),
          take(1),
        )
        .subscribe(() => {
          document.documentElement.style.visibility = '';
        });
      // Safety fallback
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

    // Apply color theme class to <html> (matches inline script in index.html)
    effect(() => {
      const colorTheme = this.preferences.colorTheme();
      // Remove all theme classes first
      this.colorThemeClasses.forEach((t) => {
        document.documentElement.classList.remove(`theme-${t}`);
      });
      // Add current theme class
      document.documentElement.classList.add(`theme-${colorTheme}`);
    });

    // Apply dark mode class to <html> (matches inline script in index.html)
    effect(() => {
      const darkMode = this.preferences.darkMode();
      document.documentElement.classList.toggle('dark-mode', darkMode);
    });
  }
}
