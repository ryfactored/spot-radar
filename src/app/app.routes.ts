import { Routes } from '@angular/router';
import { Shell, AuthLayout, PublicLayout } from '@layouts';
import { authGuard, guestGuard, roleGuard, unsavedChangesGuard, featureFlagGuard } from '@core';

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
        data: { title: 'Dashboard' },
        loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.Dashboard),
      },
      {
        path: 'profile',
        data: { title: 'Profile' },
        loadComponent: () => import('./features/profile/profile').then((m) => m.Profile),
        canDeactivate: [unsavedChangesGuard],
      },
      {
        path: 'components',
        data: { title: 'Components' },
        loadComponent: () =>
          import('./features/component-test/component-test').then((m) => m.ComponentTest),
      },
      {
        path: 'notes',
        data: { title: 'Notes' },
        loadComponent: () =>
          import('./features/notes/notes-list/notes-list').then((m) => m.NotesList),
        canActivate: [featureFlagGuard('notes')],
      },
      {
        path: 'notes/new',
        data: { title: 'New Note' },
        loadComponent: () => import('./features/notes/note-form/note-form').then((m) => m.NoteForm),
        canActivate: [featureFlagGuard('notes')],
        canDeactivate: [unsavedChangesGuard],
      },
      {
        path: 'notes/:id/edit',
        data: { title: 'Edit Note' },
        loadComponent: () => import('./features/notes/note-form/note-form').then((m) => m.NoteForm),
        canActivate: [featureFlagGuard('notes')],
        canDeactivate: [unsavedChangesGuard],
      },
      {
        path: 'chat',
        data: { title: 'Chat' },
        loadComponent: () => import('./features/chat/chat-room/chat-room').then((m) => m.ChatRoom),
        canActivate: [featureFlagGuard('chat')],
      },
      {
        path: 'files',
        data: { title: 'Files' },
        loadComponent: () =>
          import('./features/files/files-page/files-page').then((m) => m.FilesPage),
        canActivate: [featureFlagGuard('files')],
      },
      {
        path: 'admin',
        data: { title: 'Admin' },
        loadComponent: () => import('./features/admin/admin').then((m) => m.Admin),
        canActivate: [roleGuard('admin'), featureFlagGuard('admin')],
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
        data: { title: 'Sign In' },
        loadComponent: () => import('./features/auth/login/login').then((m) => m.Login),
      },
      {
        path: 'register',
        data: { title: 'Sign Up' },
        loadComponent: () => import('./features/auth/register/register').then((m) => m.Register),
      },
      {
        path: 'forgot-password',
        data: { title: 'Reset Password' },
        loadComponent: () =>
          import('./features/auth/forgot-password/forgot-password').then((m) => m.ForgotPassword),
      },
    ],
  },
  // No guard — users arrive via email links with tokens
  {
    path: '',
    component: AuthLayout,
    children: [
      {
        path: 'reset-password',
        data: { title: 'Set New Password' },
        loadComponent: () =>
          import('./features/auth/reset-password/reset-password').then((m) => m.ResetPassword),
      },
      {
        path: 'verify-email',
        data: { title: 'Email Verification' },
        loadComponent: () =>
          import('./features/auth/verify-email/verify-email').then((m) => m.VerifyEmail),
      },
      {
        path: '**',
        data: { title: 'Page Not Found' },
        loadComponent: () => import('./features/not-found/not-found').then((m) => m.NotFound),
      },
    ],
  },
];
