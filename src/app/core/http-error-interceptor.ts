import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '@shared';

export const httpErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(ToastService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let message = 'An error occurred';

      switch (error.status) {
        case 0:
          message = 'Unable to connect to server';
          break;
        case 401:
          message = 'Session expired. Please log in again.';
          router.navigate(['/login']);
          break;
        case 403:
          message = 'You do not have permission to perform this action';
          break;
        case 404:
          message = 'The requested resource was not found';
          break;
        case 422:
          message = error.error?.message || 'Validation error';
          break;
        case 500:
          message = 'Server error. Please try again later.';
          break;
        default:
          // Never expose raw error messages - keep generic
          break;
      }

      toast.error(message);
      const handledError: Error & { __handled?: boolean } = new Error(message);
      handledError.__handled = true;
      return throwError(() => handledError);
    }),
  );
};
