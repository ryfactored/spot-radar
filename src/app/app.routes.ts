import { Routes } from '@angular/router';
import { Shell, AuthLayout, PublicLayout } from '@layouts';
import { authGuard, guestGuard, roleGuard } from '@core';

/**
 * Application routes with lazy-loaded feature components.
 *
 * Route structure:
 * - PublicLayout: Landing page (guests only, redirects to dashboard if authenticated)
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
  // Public landing page (guests only - authenticated users go to dashboard)
  {
    path: '',
    component: PublicLayout,
    canActivate: [guestGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./features/landing/landing').then((m) => m.Landing),
      },
    ],
  },
  // Authenticated routes
  {
    path: '',
    component: Shell,
    canActivate: [authGuard],
    children: [
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
      {
        path: 'chat',
        loadComponent: () => import('./features/chat/chat-room/chat-room').then((m) => m.ChatRoom),
      },
      {
        path: 'admin',
        loadComponent: () => import('./features/admin/admin').then((m) => m.Admin),
        canActivate: [roleGuard('admin')],
      },
    ],
  },
  // Auth routes (guests only)
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
