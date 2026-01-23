import { ErrorHandler, Injectable, inject, NgZone } from '@angular/core';
import { ToastService } from '../shared/toast';

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