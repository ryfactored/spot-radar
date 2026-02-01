import { Component, inject, signal, DestroyRef } from '@angular/core';
import {
  Router,
  NavigationStart,
  NavigationEnd,
  NavigationCancel,
  NavigationError,
} from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';

@Component({
  selector: 'app-loading-bar',
  standalone: true,
  template: `
    @if (loading()) {
      <div class="loading-bar" role="progressbar" aria-label="Page loading"></div>
    }
  `,
  styles: `
    :host {
      display: block;
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 9999;
      height: 3px;
      overflow: hidden;
      pointer-events: none;
    }
    .loading-bar {
      height: 100%;
      background: linear-gradient(
        90deg,
        transparent 0%,
        var(--mat-sys-primary, #3b82f6) 30%,
        var(--mat-sys-primary, #3b82f6) 70%,
        transparent 100%
      );
      box-shadow: 0 1px 6px 1px var(--mat-sys-primary, #3b82f6);
      animation: slide 1s ease-in-out infinite;
    }
    @keyframes slide {
      0% {
        transform: translateX(-100%);
      }
      100% {
        transform: translateX(100%);
      }
    }
  `,
})
export class LoadingBar {
  loading = signal(false);
  private hideTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    const router = inject(Router);
    const destroyRef = inject(DestroyRef);

    router.events
      .pipe(
        filter(
          (e) =>
            e instanceof NavigationStart ||
            e instanceof NavigationEnd ||
            e instanceof NavigationCancel ||
            e instanceof NavigationError,
        ),
        takeUntilDestroyed(destroyRef),
      )
      .subscribe((e) => {
        if (e instanceof NavigationStart) {
          if (this.hideTimer) {
            clearTimeout(this.hideTimer);
            this.hideTimer = null;
          }
          this.loading.set(true);
        } else {
          // Keep bar visible for at least 300ms so it's perceptible
          this.hideTimer = setTimeout(() => {
            this.loading.set(false);
            this.hideTimer = null;
          }, 300);
        }
      });
  }
}
