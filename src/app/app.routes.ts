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
        path: 'artists',
        data: { title: 'My Artists' },
        loadComponent: () => import('./features/artists/artists').then((m) => m.Artists),
        canActivate: [featureFlagGuard('releases')],
      },
      {
        path: 'profile',
        data: { title: 'Profile' },
        loadComponent: () => import('./features/profile/profile').then((m) => m.Profile),
        canDeactivate: [unsavedChangesGuard],
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
        path: 'auth/callback',
        data: { title: 'Signing In' },
        loadComponent: () =>
          import('./features/auth/auth-callback/auth-callback').then((m) => m.AuthCallback),
      },
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
