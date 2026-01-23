import { Routes } from '@angular/router';
import { Shell, AuthLayout } from '@layouts';
import { authGuard, guestGuard } from '@core';

/**
 * Application routes with lazy-loaded feature components.
 *
 * Route structure:
 * - Shell layout (authenticated): Dashboard, Profile, Notes
 * - AuthLayout (guests only): Login, Register
 *
 * Guards prevent unauthorized access:
 * - authGuard: Redirects to /login if not authenticated
 * - guestGuard: Redirects to /dashboard if already authenticated
 *
 * Components are lazy-loaded using loadComponent() for optimal
 * bundle splitting and faster initial load times.
 */
export const routes: Routes = [
  {
    path: '',
    component: Shell,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.Dashboard),
      },
      {
        path: 'profile',
        loadComponent: () => import('./features/profile/profile').then((m) => m.Profile),
      },
      {
        path: 'components',
        loadComponent: () =>
          import('./features/component-test/component-test').then((m) => m.ComponentTest),
      },
      {
        path: 'notes',
        loadComponent: () =>
          import('./features/notes/notes-list/notes-list').then((m) => m.NotesList),
      },
      {
        path: 'notes/new',
        loadComponent: () => import('./features/notes/note-form/note-form').then((m) => m.NoteForm),
      },
      {
        path: 'notes/:id/edit',
        loadComponent: () => import('./features/notes/note-form/note-form').then((m) => m.NoteForm),
      },
    ],
  },
  {
    path: '',
    component: AuthLayout,
    canActivate: [guestGuard],
    children: [
      {
        path: 'login',
        loadComponent: () => import('./features/auth/login/login').then((m) => m.Login),
      },
      {
        path: 'register',
        loadComponent: () => import('./features/auth/register/register').then((m) => m.Register),
      },
    ],
  },
];
