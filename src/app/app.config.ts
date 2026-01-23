import { ApplicationConfig, ErrorHandler, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { GlobalErrorHandler, httpErrorInterceptor } from '@core';

/**
 * Application configuration using the standalone bootstrapping pattern.
 *
 * This replaces the traditional NgModule-based app.module.ts with a
 * functional configuration object. Providers are registered here
 * and available application-wide.
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(withInterceptors([httpErrorInterceptor])),
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
  ],
};
