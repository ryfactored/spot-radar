import { Routes } from '@angular/router';
import { Shell, AuthLayout, PublicLayout, CHILD_NAV_MODE } from '@layouts';
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
        path: 'releases',
        data: { title: 'New Releases' },
        loadComponent: () =>
          import('./features/releases/releases-feed/releases-feed').then((m) => m.ReleasesFeed),
        canActivate: [featureFlagGuard('releases')],
      },
      {
        path: 'profile',
        data: { title: 'Profile' },
        loadComponent: () => import('./features/profile/profile').then((m) => m.Profile),
        canDeactivate: [unsavedChangesGuard],
      },
      {
        path: 'components',
        loadComponent: () =>
          import('./features/component-test/component-test').then((m) => m.ComponentTest),
        canActivate: [featureFlagGuard('components')],
        data: {
          title: 'Components',
          childNavMode: CHILD_NAV_MODE.TABS,
          childNav: [
            { label: 'Feedback', route: '/components', icon: 'notifications' },
            { label: 'Display', route: '/components/display', icon: 'visibility' },
            { label: 'Data', route: '/components/data', icon: 'table_chart' },
          ],
        },
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./features/component-test/feedback/feedback').then((m) => m.Feedback),
          },
          {
            path: 'display',
            loadComponent: () =>
              import('./features/component-test/display/display').then((m) => m.Display),
          },
          {
            path: 'data',
            loadComponent: () => import('./features/component-test/data/data').then((m) => m.Data),
          },
        ],
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
        data: {
          title: 'Admin',
          childNavMode: CHILD_NAV_MODE.SIDENAV,
          showBreadcrumb: true,
          childNav: [
            { label: 'Overview', route: '/admin', icon: 'dashboard' },
            { label: 'Users', route: '/admin/users', icon: 'group' },
            { label: 'Feature Flags', route: '/admin/feature-flags', icon: 'toggle_on' },
          ],
        },
        canActivate: [roleGuard('admin'), featureFlagGuard('admin')],
        children: [
          {
            path: '',
            loadComponent: () => import('./features/admin/admin').then((m) => m.Admin),
          },
          {
            path: 'users',
            data: { title: 'Users' },
            loadComponent: () =>
              import('./features/admin/users-list/users-list').then((m) => m.UsersList),
          },
          {
            path: 'feature-flags',
            data: { title: 'Feature Flags' },
            loadComponent: () =>
              import('./features/admin/feature-flags/feature-flags').then(
                (m) => m.FeatureFlagsPage,
              ),
          },
        ],
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
