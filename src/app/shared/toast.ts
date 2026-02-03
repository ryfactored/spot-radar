import { Injectable, inject } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { environment } from '@env';

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private snackBar = inject(MatSnackBar);
  private durations = environment.toastDuration;

  success(message: string) {
    this.show(message, this.durations.success, 'toast-success', 'polite');
  }

  error(message: string) {
    this.show(message, this.durations.error, 'toast-error', 'assertive');
  }

  info(message: string) {
    this.show(message, this.durations.info, 'toast-info', 'polite');
  }

  private show(
    message: string,
    duration: number,
    panelClass: string,
    politeness: MatSnackBarConfig['politeness'],
  ) {
    this.snackBar.open(message, 'Close', {
      duration,
      panelClass: [panelClass],
      horizontalPosition: 'end',
      verticalPosition: 'top',
      politeness,
    });
  }
}
