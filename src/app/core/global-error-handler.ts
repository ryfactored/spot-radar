import { ErrorHandler, Injectable, inject, NgZone } from '@angular/core';
import { ToastService } from '../shared/toast';

/**
 * Global error handler that catches unhandled exceptions.
 *
 * Provides centralized error handling for the entire application:
 * - Logs errors for debugging
 * - Displays user-friendly toast notifications
 *
 * Note: NgZone.run() is required because errors may occur outside
 * Angular's zone, and UI updates need to be in-zone to trigger
 * change detection.
 */
@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private toast = inject(ToastService);
  private zone = inject(NgZone);

  handleError(error: unknown): void {
    // Log error for debugging
    console.error('Global error:', error);

    // Extract message
    let message = 'An unexpected error occurred';
    if (error instanceof Error) {
      message = error.message;
    }

    // Show toast (must run in Angular zone)
    this.zone.run(() => {
      this.toast.error(message);
    });
  }
}