# Feature Removal Guide

How to cleanly remove each example feature when cloning the template.

## Quick: Disable via feature flags

To hide a feature without deleting code, set it to `false` in `src/environments/environment.base.ts`:

```ts
featureFlags: { notes: false, chat: true, files: true, admin: true, components: true, ... },
```

This removes the sidenav link, hides the dashboard card, and blocks the route (redirects to `/dashboard`). The code stays in the bundle but is unreachable. Use this for quick toggling or gradual rollouts.

## Permanent: Delete the code

To fully remove a feature and reduce bundle size, follow the steps below. Work through one feature at a time. After each removal, run `npm run build` to confirm nothing is broken.

> **Note**: Sidenav links and dashboard cards are already gated by feature flags (`@if (featureFlags.isEnabled(...))` in the template, `computed()` filter in Dashboard). Disabling a feature flag hides them automatically. The steps below are for permanent removal of the code.

---

## Notes

CRUD feature with paginated list, create/edit forms, signal store, and 5-minute TTL cache.

### Delete

```
src/app/features/notes/          (9 files)
e2e/notes.spec.ts
```

### Routes

Remove these three route objects from the Shell `children` array in `src/app/app.routes.ts`:

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

Remove the `@if (featureFlags.isEnabled('notes'))` block (containing the Notes link) from `src/app/layouts/shell/shell.html`.

### Dashboard

Remove the Notes entry from the `allLinks` array in `src/app/features/dashboard/dashboard.ts`:

```ts
{
  route: '/notes',
  icon: 'note',
  title: 'Notes',
  description: 'Create and manage your notes',
  feature: 'notes',
},
```

### Backend

- Drop the `notes` table (and its RLS policies) from Supabase.

### Gotchas

- **Component Test depends on Notes.** The `data.ts` child page imports `NotesService` and `Note` from `../../notes/notes` for the DataTable demo. If removing Notes, also remove Component Test — or replace the demo data source with static data.
- `e2e/navigation.spec.ts` has a test that navigates to `/notes`. Remove or update that test case.
- `e2e/dashboard.spec.ts` has a test that clicks through to `/notes`. Remove or update it.

---

## Chat

Real-time messaging room with Supabase Realtime subscriptions and a signal store.

### Delete

```
src/app/features/chat/           (6 files)
e2e/chat.spec.ts
```

### Routes

Remove the Chat route from the Shell `children` array in `src/app/app.routes.ts`:

```ts
{
  path: 'chat',
  data: { title: 'Chat' },
  loadComponent: () => import('./features/chat/chat-room/chat-room').then((m) => m.ChatRoom),
  canActivate: [featureFlagGuard('chat')],
},
```

### Sidenav

Remove the `@if (featureFlags.isEnabled('chat'))` block (containing the Chat link) from `src/app/layouts/shell/shell.html`.

### Dashboard

Remove the Chat entry from the `allLinks` array in `src/app/features/dashboard/dashboard.ts`:

```ts
{
  route: '/chat',
  icon: 'chat',
  title: 'Chat',
  description: 'Real-time messaging with others',
  feature: 'chat',
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
src/app/features/files/          (7 files)
e2e/files.spec.ts
```

### Routes

Remove the Files route from the Shell `children` array in `src/app/app.routes.ts`:

```ts
{
  path: 'files',
  data: { title: 'Files' },
  loadComponent: () =>
    import('./features/files/files-page/files-page').then((m) => m.FilesPage),
  canActivate: [featureFlagGuard('files')],
},
```

### Sidenav

Remove the `@if (featureFlags.isEnabled('files'))` block (containing the Files link) from `src/app/layouts/shell/shell.html`.

### Dashboard

Remove the Files entry from the `allLinks` array in `src/app/features/dashboard/dashboard.ts`:

```ts
{
  route: '/files',
  icon: 'folder',
  title: 'Files',
  description: 'Upload and manage your files',
  feature: 'files',
},
```

### Backend

- Drop the `files` table (and its RLS policies) from Supabase.
- Delete the `user-files` storage bucket (and its policies).

### Gotchas

- `StorageService` in `core/` is also used by `Profile` for avatar uploads. **Do not remove `StorageService`** unless you also remove avatar upload from Profile.

---

## Component Test

Showcase page demonstrating shared UI components, organized into tabbed child pages: Feedback (Toast, ConfirmDialog, LoadingSpinner, EmptyState), Display (Skeleton, Avatar, PasswordStrength), and Data (SearchInput, DataTable).

### Delete

```
src/app/features/component-test/ (4 files)
e2e/components.spec.ts
```

### Routes

Remove the entire Components route (parent + children) from the Shell `children` array in `src/app/app.routes.ts`:

```ts
{
  path: 'components',
  loadComponent: () =>
    import('./features/component-test/component-test').then((m) => m.ComponentTest),
  canActivate: [featureFlagGuard('components')],
  data: {
    title: 'Components',
    childNavMode: CHILD_NAV_MODE.TABS,
    childNav: [...],
  },
  children: [
    { path: '', loadComponent: () => import('./features/component-test/feedback/feedback')... },
    { path: 'display', loadComponent: () => import('./features/component-test/display/display')... },
    { path: 'data', loadComponent: () => import('./features/component-test/data/data')... },
  ],
},
```

### Sidenav

Remove the `@if (featureFlags.isEnabled('components'))` block (containing the Components link) from `src/app/layouts/shell/shell.html`.

### Dashboard

No dashboard card for this feature.

### Backend

None.

### Gotchas

- **Depends on Notes.** The `data.ts` child page imports `NotesService` and `Note` from `../../notes/notes` for the DataTable demo. If Notes is still present but Component Test is removed, there's nothing to worry about. If removing both, remove Component Test first (or at the same time).
- Remove the `CHILD_NAV_MODE` import from `src/app/app.routes.ts` if no other route uses it (Admin also uses it).

---

## Admin

Admin panel with overview dashboard, user management, and feature flags page. Gated by `roleGuard('admin')` and `featureFlagGuard('admin')`. Uses sidenav child navigation mode with breadcrumbs.

### Delete

```
src/app/features/admin/          (10 files)
```

### Routes

Remove the entire Admin route (parent + children) from the Shell `children` array in `src/app/app.routes.ts`:

```ts
{
  path: 'admin',
  data: {
    title: 'Admin',
    childNavMode: CHILD_NAV_MODE.SIDENAV,
    showBreadcrumb: true,
    childNav: [...],
  },
  canActivate: [roleGuard('admin'), featureFlagGuard('admin')],
  children: [
    { path: '', loadComponent: () => import('./features/admin/admin')... },
    { path: 'users', loadComponent: () => import('./features/admin/users-list/users-list')... },
    { path: 'feature-flags', loadComponent: () => import('./features/admin/feature-flags/feature-flags')... },
  ],
},
```

### Sidenav

Remove the `@if (isAdmin() && featureFlags.isEnabled('admin'))` block from `src/app/layouts/shell/shell.html`. This is a large block containing both the expandable submenu version (with toggle button and submenu items) and the simple link fallback.

### Dashboard

No dashboard card for this feature.

### Backend

- The `profiles.role` column powers admin detection. You can leave it (harmless) or remove it if you don't need role-based access at all.

### Gotchas

- **Shell has admin-specific code.** In `src/app/layouts/shell/shell.ts`, remove:
  - The `UserRole` import from `@core`
  - The `userRoleResource` (resource that loads the user profile and checks admin role) and `isAdmin` computed signal
  - The `ProfileService` import and injection can stay — it's also used for loading the avatar and display name
- **Route imports.** Remove `roleGuard` from the imports in `src/app/app.routes.ts`. If Component Test is also removed, remove `CHILD_NAV_MODE` too.
- The `roleGuard` export in `core/index.ts` and the `UserRole` type can stay (harmless, tree-shaken away) or be removed along with `src/app/core/auth/role-guard.ts` and its spec.

---

## Landing

Public landing page for unauthenticated visitors, wrapped in `PublicLayout`.

### Delete

```
src/app/features/landing/        (2 files)
src/app/layouts/public-layout/   (2 files)
```

### Routes

Remove the entire public landing route block from `src/app/app.routes.ts`:

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

- **Layouts barrel export.** Remove the `PublicLayout` export from `src/app/layouts/index.ts`:
  ```ts
  export { PublicLayout } from './public-layout/public-layout';
  ```
- **Remove the `PublicLayout` import** from `src/app/app.routes.ts` (remove it from the destructured import).
- **SSR prerender.** Remove the `{ path: '', renderMode: RenderMode.Prerender }` entry from `src/app/app.routes.server.ts`. The `/login` and `/register` prerender entries should remain.
- **E2E tests.** `e2e/visual.spec.ts` has a "landing page" screenshot test and `e2e/accessibility.spec.ts` has a landing page a11y test. Remove or update both.
- **`guestGuard` stays.** It's still needed for the auth routes (`/login`, `/register`, `/forgot-password`).
- **`index.html` hydration script.** The script that hides content on non-root routes to prevent flash may no longer be needed. Review whether it's still useful for your auth pages.

---

## Minimal Starter

After removing **all** example features (Notes, Chat, Files, Component Test, Admin, Landing), what remains is a clean authenticated app skeleton:

### Auth

- `src/app/features/auth/` — Login, Register, Forgot Password, Reset Password, Verify Email (11 files)
- `src/app/core/auth/auth.ts` — AuthService with Supabase auth
- `src/app/core/auth/auth-guard.ts` — authGuard and guestGuard (shared factory)

### Dashboard

- `src/app/features/dashboard/` — Dashboard page (remove the `allLinks` array entries, keep the welcome message)

### Profile

- `src/app/features/profile/` — Profile page with avatar upload (6 files)

### Layout

- `src/app/layouts/shell/` — Authenticated shell with sidenav, toolbar, theme picker, avatar
- `src/app/layouts/auth-layout/` — Guest layout for auth pages
- `src/app/layouts/index.ts` — Barrel export (remove `PublicLayout` line)

### Core

- `auth/auth.ts`, `auth/auth-guard.ts` — Authentication and guards
- `supabase/supabase.ts` — Supabase client wrapper
- `supabase/realtime.ts` — RealtimeService (used by AuthService; keep it)
- `supabase/storage.ts` — StorageService (used by Profile avatar upload; keep it)
- `errors/` — Error mapper, global error handler, HTTP interceptor, error constants
- `preferences.ts` — Theme and sidenav preferences (localStorage)
- `feature-flags.ts`, `feature-flag-guard.ts` — Feature flag service and guard
- `unsaved-changes-guard.ts` — Dirty form guard

### Shared

All shared components stay (they're reusable building blocks):

- Toast, ConfirmDialog, LoadingSpinner, EmptyState, Skeleton, SkeletonOverlay
- DataTable, SearchInput, ThemePicker, SocialLoginButton, PasswordStrength
- LoadingBar, Avatar, Breadcrumb, ChildNav, ConnectionIndicator
- Pipes: TimeAgo, FileSize
- Validators (`match.validator.ts`)
- Animations (`route-animation.ts`)

### Other

- `src/app/features/not-found/` — 404 page
- `src/app/app.routes.ts` — Simplified to auth routes + dashboard + profile
- `src/app/app.routes.server.ts` — Remove landing prerender entry
- `e2e/` — Keep `auth.spec.ts`, `auth-flow.spec.ts`, `profile.spec.ts`, `dashboard.spec.ts`, `toast-colors.spec.ts`; remove `notes.spec.ts`, `chat.spec.ts`, `files.spec.ts`, `components.spec.ts`; update `navigation.spec.ts`, `visual.spec.ts`, `accessibility.spec.ts`
- All config files (`angular.json`, `tsconfig`, `playwright`, etc.) stay unchanged
