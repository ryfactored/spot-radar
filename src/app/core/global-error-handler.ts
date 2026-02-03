import { ErrorHandler, Injectable, inject, NgZone, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ToastService } from '../shared/toast';
import { mapError } from './error-mapper';

/**
 * Global error handler that catches unhandled exceptions.
 *
 * Provides centralized error handling for the entire application:
 * - Logs errors for debugging (full details in console)
 * - Displays user-friendly toast notifications (mapped messages)
 *
 * Note: NgZone.run() is required because errors may occur outside
 * Angular's zone, and UI updates need to be in-zone to trigger
 * change detection.
 */
@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private toast = inject(ToastService);
  private zone = inject(NgZone);
  private platformId = inject(PLATFORM_ID);

  handleError(error: unknown): void {
    // Log full error for debugging (only visible in console)
    console.error('Global error:', error);

    // Skip toast if already handled by httpErrorInterceptor
    if (error instanceof Error && '__handled' in error) return;

    // Only show toast in browser (not during SSR)
    if (isPlatformBrowser(this.platformId)) {
      // Map to user-friendly message (hides internal details)
      const { message } = mapError(error);
      // Show toast (must run in Angular zone)
      this.zone.run(() => {
        this.toast.error(message);
      });
    }
  }
}
