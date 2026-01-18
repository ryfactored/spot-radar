import { Routes } from '@angular/router';
import { Shell } from './layouts/shell/shell';
import { AuthLayout } from './layouts/auth-layout/auth-layout';
import { authGuard } from './core/auth-guard';
import { guestGuard } from './core/guest-guard';

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
        loadComponent: () => import('./features/profile/profile').then((m) => m.ProfileComponent),
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
