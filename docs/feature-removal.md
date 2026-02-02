# Feature Removal Guide

How to cleanly remove each example feature when cloning the template.

## Quick: Disable via feature flags

To hide a feature without deleting code, set it to `false` in `src/environments/environment.ts` (and `environment.prod.ts`):

```ts
featureFlags: { notes: false, chat: true, files: true, admin: true },
```

This removes the sidenav link and blocks the route (redirects to `/dashboard`). The code stays in the bundle but is unreachable. Use this for quick toggling or gradual rollouts.

## Permanent: Delete the code

To fully remove a feature and reduce bundle size, follow the steps below. Work through one feature at a time. After each removal, run `npm run build` to confirm nothing is broken.

---

## Notes

CRUD feature with paginated list, create/edit forms, signal store, and 5-minute TTL cache.

### Delete

```
src/app/features/notes/          (9 files)
e2e/notes.spec.ts
```

### Routes

Remove these three route objects from the Shell `children` array in `src/app/app.routes.ts` (lines 56-70):

```ts
{
  path: 'notes',
  ...
},
{
  path: 'notes/new',
  ...
},
{
  path: 'notes/:id/edit',
  ...
},
```

### Sidenav

Remove the Notes link from `src/app/layouts/shell/shell.html` (lines 23-32):

```html
<a mat-list-item routerLink="/notes" ...>
  <mat-icon matListItemIcon>note</mat-icon>
  <span matListItemTitle>Notes</span>
</a>
```

### Dashboard

Remove the Notes card from the `links` array in `src/app/features/dashboard/dashboard.ts` (lines 78-82):

```ts
{
  route: '/notes',
  icon: 'note',
  title: 'Notes',
  description: 'Create and manage your notes',
},
```

### Backend

- Drop the `notes` table (and its RLS policies) from Supabase.

### Gotchas

- **Component Test depends on Notes.** `component-test.ts` imports `NotesService` and `Note` from `../notes/notes` for the DataTable demo. If removing Notes, also remove Component Test — or replace the demo data source with static data.
- `e2e/navigation.spec.ts` has a test that navigates to `/notes`. Remove or update that test case.

---

## Chat

Real-time messaging room with Supabase Realtime subscriptions and a signal store.

### Delete

```
src/app/features/chat/           (6 files)
```

### Routes

Remove the Chat route from the Shell `children` array in `src/app/app.routes.ts` (lines 72-75):

```ts
{
  path: 'chat',
  data: { title: 'Chat' },
  loadComponent: () => import('./features/chat/chat-room/chat-room').then((m) => m.ChatRoom),
},
```

### Sidenav

Remove the Chat link from `src/app/layouts/shell/shell.html` (lines 33-42):

```html
<a mat-list-item routerLink="/chat" ...>
  <mat-icon matListItemIcon>chat</mat-icon>
  <span matListItemTitle>Chat</span>
</a>
```

### Dashboard

Remove the Chat card from the `links` array in `src/app/features/dashboard/dashboard.ts` (lines 83-87):

```ts
{
  route: '/chat',
  icon: 'chat',
  title: 'Chat',
  description: 'Real-time messaging with others',
},
```

### Backend

- Drop the `messages` table (and its RLS policies) from Supabase.
- Disable Realtime on the `messages` table (or remove the replication publication if no other tables use Realtime).

### Gotchas

- `RealtimeService` in `core/` is also used by `AuthService` for channel cleanup on sign-out. **Do not remove `RealtimeService` or its export from `core/index.ts`** even after removing Chat.

---

## Files

File upload/download feature using Supabase Storage with a metadata table.

### Delete

```
src/app/features/files/          (4 files)
```

### Routes

Remove the Files route from the Shell `children` array in `src/app/app.routes.ts` (lines 77-81):

```ts
{
  path: 'files',
  data: { title: 'Files' },
  loadComponent: () =>
    import('./features/files/files-page/files-page').then((m) => m.FilesPage),
},
```

### Sidenav

Remove the Files link from `src/app/layouts/shell/shell.html` (lines 43-52):

```html
<a mat-list-item routerLink="/files" ...>
  <mat-icon matListItemIcon>folder</mat-icon>
  <span matListItemTitle>Files</span>
</a>
```

### Dashboard

Remove the Files card from the `links` array in `src/app/features/dashboard/dashboard.ts` (lines 88-92):

```ts
{
  route: '/files',
  icon: 'folder',
  title: 'Files',
  description: 'Upload and manage your files',
},
```

### Backend

- Drop the `files` table (and its RLS policies) from Supabase.
- Delete the `user-files` storage bucket (and its policies).

### Gotchas

- `StorageService` in `core/` is also used by `Profile` for avatar uploads. **Do not remove `StorageService`** unless you also remove avatar upload from Profile.

---

## Component Test

Showcase page demonstrating shared UI components (Toast, ConfirmDialog, LoadingSpinner, EmptyState, SearchInput, DataTable).

### Delete

```
src/app/features/component-test/ (1 file)
```

### Routes

Remove the Components route from the Shell `children` array in `src/app/app.routes.ts` (lines 50-54):

```ts
{
  path: 'components',
  data: { title: 'Components' },
  loadComponent: () =>
    import('./features/component-test/component-test').then((m) => m.ComponentTest),
},
```

### Sidenav

Remove the Components link from `src/app/layouts/shell/shell.html` (lines 63-72):

```html
<a mat-list-item routerLink="/components" ...>
  <mat-icon matListItemIcon>widgets</mat-icon>
  <span matListItemTitle>Components</span>
</a>
```

### Dashboard

No dashboard card for this feature.

### Backend

None.

### Gotchas

- **Depends on Notes.** `component-test.ts` imports `NotesService` and `Note` from `../notes/notes`. If Notes is still present but Component Test is removed, there's nothing to worry about. If removing both, remove Component Test first (or at the same time).

---

## Admin

Admin panel gated by `roleGuard('admin')` with conditional sidenav visibility.

### Delete

```
src/app/features/admin/          (2 files)
```

### Routes

Remove the Admin route from the Shell `children` array in `src/app/app.routes.ts` (lines 82-87):

```ts
{
  path: 'admin',
  data: { title: 'Admin' },
  loadComponent: () => import('./features/admin/admin').then((m) => m.Admin),
  canActivate: [roleGuard('admin')],
},
```

### Sidenav

Remove the conditional Admin link block from `src/app/layouts/shell/shell.html` (lines 73-84):

```html
@if (isAdmin()) {
<a mat-list-item routerLink="/admin" ...>
  <mat-icon matListItemIcon>admin_panel_settings</mat-icon>
  <span matListItemTitle>Admin</span>
</a>
}
```

### Dashboard

No dashboard card for this feature.

### Backend

- The `profiles.role` column powers admin detection. You can leave it (harmless) or remove it if you don't need role-based access at all.

### Gotchas

- **Shell has admin-specific code.** In `src/app/layouts/shell/shell.ts`, remove:
  - The `UserRole` import from `@core` (line 12)
  - The `ProfileService` import from `@features/profile/profile-service` (line 14)
  - The `userRole` signal, `isAdmin` computed, and `loadUserRole()` method (lines 48-49, 81-93)
  - The `profileService` injection (line 43)
  - The `ngOnInit` lifecycle hook if `loadUserRole()` was its only call (lines 81-83)
  - The `OnInit` import and `implements OnInit` (line 1, line 37)
- The `roleGuard` export in `core/index.ts` and the `UserRole` type can stay (harmless, tree-shaken away) or be removed along with `src/app/core/role-guard.ts` and `src/app/core/role-guard.spec.ts`.
- Remove `roleGuard` from the imports in `src/app/app.routes.ts` line 3 if no other route uses it.

---

## Landing

Public landing page for unauthenticated visitors, wrapped in `PublicLayout`.

### Delete

```
src/app/features/landing/        (2 files)
src/app/layouts/public-layout/   (2 files)
```

### Routes

Remove the entire public landing route block from `src/app/app.routes.ts` (lines 22-32):

```ts
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
```

Replace it with a redirect so unauthenticated users go to `/login`:

```ts
{
  path: '',
  pathMatch: 'full',
  redirectTo: 'login',
},
```

### Sidenav

N/A — landing page is outside the Shell layout.

### Dashboard

N/A.

### Backend

None.

### Gotchas

- **Layouts barrel export.** Remove the `PublicLayout` export from `src/app/layouts/index.ts` (line 3):
  ```ts
  export { PublicLayout } from './public-layout/public-layout';
  ```
- **Remove the `PublicLayout` import** from `src/app/app.routes.ts` line 2 (remove it from the destructured import).
- **SSR prerender.** Remove `{ path: '', renderMode: RenderMode.Prerender }` from `src/app/app.routes.server.ts` (line 5). The `/login` and `/register` prerender entries should remain.
- **E2E tests.** `e2e/visual.spec.ts` has a "landing page" screenshot test and `e2e/accessibility.spec.ts` has a landing page a11y test. Remove or update both.
- **`guestGuard` stays.** It's still needed for the auth routes (`/login`, `/register`, `/forgot-password`).
- **`index.html` hydration script.** If you have a script that hides content on non-landing routes to prevent flash, review whether it's still needed.

---

## Minimal Starter

After removing **all** example features (Notes, Chat, Files, Component Test, Admin, Landing), what remains is a clean authenticated app skeleton:

### Auth

- `src/app/features/auth/` — Login, Register, Forgot Password, Reset Password, Verify Email (10 files)
- `src/app/core/auth.ts` — AuthService with Supabase auth
- `src/app/core/auth-guard.ts` — Redirects to `/login` if not authenticated
- `src/app/core/guest-guard.ts` — Redirects to `/dashboard` if already authenticated

### Dashboard

- `src/app/features/dashboard/` — Empty dashboard (remove the `links` array entries, keep the welcome message)

### Profile

- `src/app/features/profile/` — Profile page with avatar upload (4 files)

### Layout

- `src/app/layouts/shell/` — Authenticated shell with sidenav, toolbar, theme picker, avatar
- `src/app/layouts/auth-layout/` — Guest layout for auth pages
- `src/app/layouts/index.ts` — Barrel export (remove `PublicLayout` line)

### Core

- `auth.ts`, `auth-guard.ts`, `guest-guard.ts` — Authentication
- `supabase.ts`, `supabase-errors.ts` — Supabase client and error codes
- `error-mapper.ts` — User-friendly error messages
- `global-error-handler.ts` — Global exception handler
- `http-error-interceptor.ts` — HTTP error interceptor
- `preferences.ts` — Theme and sidenav preferences (localStorage)
- `realtime.ts` — RealtimeService (used by AuthService; keep it)
- `storage.ts` — StorageService (used by Profile avatar upload; keep it)

### Shared

All shared components stay (they're reusable building blocks):

- Toast, ConfirmDialog, LoadingSpinner, EmptyState, Skeleton, SkeletonOverlay
- DataTable, SearchInput, ThemePicker, SocialLoginButton, PasswordStrength
- LoadingBar, Avatar, ConnectionIndicator
- Validators (`match.validator.ts`)

### Other

- `src/app/features/not-found/` — 404 page
- `src/app/app.routes.ts` — Simplified to auth routes + dashboard + profile
- `src/app/app.routes.server.ts` — Remove landing prerender entry
- `e2e/` — Keep `auth.spec.ts`, `auth-flow.spec.ts`, `profile.spec.ts`; remove `notes.spec.ts`; update `navigation.spec.ts`, `visual.spec.ts`, `accessibility.spec.ts`
- All config files (`angular.json`, `tsconfig`, `vite`, `playwright`, etc.) stay unchanged
