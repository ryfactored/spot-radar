import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from '@env';

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private snackBar = inject(MatSnackBar);
  private durations = environment.toastDuration;

  success(message: string) {
    this.snackBar.open(message, 'Close', {
      duration: this.durations.success,
      panelClass: ['toast-success'],
      horizontalPosition: 'end',
      verticalPosition: 'top',
      politeness: 'polite',
    });
  }

  error(message: string) {
    this.snackBar.open(message, 'Close', {
      duration: this.durations.error,
      panelClass: ['toast-error'],
      horizontalPosition: 'end',
      verticalPosition: 'top',
      politeness: 'assertive',
    });
  }

  info(message: string) {
    this.snackBar.open(message, 'Close', {
      duration: this.durations.info,
      panelClass: ['toast-info'],
      horizontalPosition: 'end',
      verticalPosition: 'top',
      politeness: 'polite',
    });
  }
}
