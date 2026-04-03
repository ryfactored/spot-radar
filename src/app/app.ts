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
  template: `<router-outlet />`,
})
export class App {
  private preferences = inject(PreferencesService);

  readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private colorThemeClasses = COLOR_THEMES.map((t) => t.value);

  constructor() {
    // Skip theme handling on server (no document)
    if (!this.isBrowser) {
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
