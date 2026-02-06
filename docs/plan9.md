# Angular Starter - Phase 9

**Goal**: Miscellaneous housekeeping and improvements.

---

## Iteration 84 — Normalize git author names

The git history contains 4 different author names for the same person:

| Author Name | Commits |
| ----------- | ------- |
| Ryan        | 54      |
| ryherring48 | 20      |
| ry          | 12      |
| ryfactored  | 1       |

### Plan

Use `git filter-repo` to rewrite all commits so the author name is consistently `ry`. This rewrites commit hashes for every affected commit (effectively the entire history).

**Command:**

```bash
git filter-repo --name-callback 'return b"ry"' --force
```

This replaces the author name **and** committer name on every commit with `ry`, regardless of the original value. Email addresses are left unchanged.

**Post-rewrite steps:**

1. Verify with `git log --format="%an" | sort | uniq -c`
2. Re-add the remote origin (filter-repo removes it as a safety measure)
3. Force push: `git push --force`

### Caveats

- **All commit hashes change.** Anyone with an existing clone must re-clone.
- `git filter-repo` must be installed (`pip install git-filter-repo`).
- The remote origin is automatically removed by `git filter-repo` and must be re-added manually.

---

## Iteration 85 — Reorganize `core/` into domain sub-folders

The `core/` directory had 15 implementation files (+ 14 spec files) in a flat structure. As the number of files grew, the flat layout made it harder to see which files belong together.

### Plan

Move files into three domain sub-folders (`auth/`, `errors/`, `supabase/`) while keeping four standalone files at the root. The root `index.ts` barrel absorbs all path changes so every `@core` import across the codebase remains unchanged.

**Target structure:**

```
core/
├── index.ts                        ← updated re-exports (only file external consumers use)
├── auth/
│   ├── auth.ts                     ← AuthService
│   ├── auth.spec.ts
│   ├── auth-guard.ts               ← authGuard, guestGuard
│   ├── auth-guard.spec.ts
│   ├── role-guard.ts               ← roleGuard, UserRole
│   └── role-guard.spec.ts
├── errors/
│   ├── error-mapper.ts             ← mapError, mapToError, unwrap, unwrapWithCount
│   ├── error-mapper.spec.ts
│   ├── global-error-handler.ts     ← GlobalErrorHandler
│   ├── global-error-handler.spec.ts
│   ├── http-error-interceptor.ts   ← httpErrorInterceptor
│   ├── http-error-interceptor.spec.ts
│   ├── extract-error-message.ts    ← extractErrorMessage
│   ├── extract-error-message.spec.ts
│   └── supabase-errors.ts          ← SUPABASE_ERRORS constants
├── supabase/
│   ├── supabase.ts                 ← SupabaseService
│   ├── supabase.spec.ts
│   ├── storage.ts                  ← StorageService
│   ├── storage.spec.ts
│   ├── realtime.ts                 ← RealtimeService
│   └── realtime.spec.ts
├── preferences.ts                  ← PreferencesService (root)
├── preferences.spec.ts
├── feature-flags.ts                ← FeatureFlags (root)
├── feature-flags.spec.ts
├── feature-flag-guard.ts           ← featureFlagGuard (root)
├── feature-flag-guard.spec.ts
├── unsaved-changes-guard.ts        ← unsavedChangesGuard (root)
└── unsaved-changes-guard.spec.ts
```

### Changes

1. **Moved 21 files** via `git mv` into `auth/`, `errors/`, and `supabase/` sub-folders.
2. **Updated cross-folder imports** in 6 implementation/spec files (`auth.ts`, `role-guard.ts`, `storage.ts`, `preferences.ts`, `auth.spec.ts`, `role-guard.spec.ts`).
3. **Updated `core/index.ts`** — all 20 export paths rewritten with domain grouping comments.
4. **Fixed `app.spec.ts`** — changed direct `./core/preferences` import to `@core`.

### What did NOT change

- All `@core` imports across `features/`, `shared/`, `layouts/` — the barrel absorbed the restructuring.
- The `tsconfig` path alias — `@core` still points to `src/app/core`.
- No sub-barrel files were added — the root `index.ts` imports directly from sub-folders.

### Verification

- `npm run build` — passes
- `npm test -- --no-watch` — all 370 tests pass
- `npm run lint` — clean

---

## Iteration 86 — Add ProfileStore and FilesStore for consistent state management

Extracted local component state into dedicated stores for the Profile and Files features, matching the existing NotesStore/ChatStore pattern. Every feature that manages shared or list data now uses the same three-layer pattern: **Service** (pure data access) → **Store** (reactive state container) → **Component** (orchestrator).

### Pattern

- **Service** — Async methods that call Supabase and return data. No signals, no state.
- **Store** — `providedIn: 'root'` injectable holding domain data in signals. Exposes readonly signals and mutation methods. Never calls services or makes network requests.
- **Component** — Injects both service and store. Calls the service, then pushes results into the store. Templates bind to store signals. Transient UI flags (`saving`, `uploading`, `deleting`, etc.) stay as local component signals.

### New files

| File                                     | Description                                                                                                                                                                        |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `features/files/files-store.ts`          | `FilesStore` — signals for `files` and `loading`, computed `isEmpty`, mutation methods `setFiles`, `addFile`, `removeFile`, `setLoading`, `clear`                                  |
| `features/files/files-store.spec.ts`     | 11 tests covering initial state, all mutations, and computed values                                                                                                                |
| `features/profile/profile-store.ts`      | `ProfileStore` — signal for `profile` and `loading`, computed `avatarUrl`/`displayName` derived from profile, mutation methods `setProfile`, `setAvatarUrl`, `setLoading`, `clear` |
| `features/profile/profile-store.spec.ts` | 14 tests covering initial state, all mutations, computed derivations, and edge cases                                                                                               |

### Modified files

| File                                           | Changes                                                                                                                                                                                                                         |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `features/profile/profile-service.ts`          | Removed `avatarUrl`/`displayName` writable signals and `setSharedState()` method. All 4 CRUD methods now return data without managing state.                                                                                    |
| `features/files/files-page/files-page.ts`      | Replaced local `files`/`loading` signals with `FilesStore` access. Upload calls `store.addFile()`, delete calls `store.removeFile()`, load calls `store.setFiles()`. `uploading` stays local.                                   |
| `features/profile/profile.ts`                  | Injected `ProfileStore`. `loading` reads `store.isLoading`. Template reads `profileStore.avatarUrl()`. After CRUD calls: `store.setProfile(result)`, `store.setAvatarUrl(url)`, `store.clear()`. `profileService` made private. |
| `layouts/shell/shell.ts`                       | Injected `ProfileStore`. `avatarUrl`/`displayName` now read from store instead of service. Resource loader calls `store.setProfile(profile)` after fetching.                                                                    |
| `features/files/files-page/files-page.spec.ts` | Added `FilesStore` to test setup (real instance via `TestBed.inject`).                                                                                                                                                          |
| `features/profile/profile.spec.ts`             | Replaced `profileMock.avatarUrl`/`displayName` signals with real `ProfileStore`. Added assertions for `store.setProfile()` and `store.clear()`.                                                                                 |
| `layouts/shell/shell.spec.ts`                  | Replaced `avatarUrl`/`displayName` on profile mock with real `ProfileStore`. Added test for store population after resource load.                                                                                               |

### What did NOT change

- **FilesService** — pure data access, unchanged.
- **NotesStore / ChatStore** — untouched.
- **Any `@core` imports** — stores are feature-level, not core.
- **No new barrel exports** — stores are imported directly by their feature consumers.
- **ProfileService CRUD logic** — same Supabase calls, just no longer setting shared signals.

### Verification

- `npm run build` — passes
- `npm test -- --no-watch` — all 403 tests pass (57 test files)
- `npm run lint` — clean

---

## Iteration 87 — Add contributing guide and update docs

Added a `docs/contributing.md` file and updated `CLAUDE.md` and `README.md` to reflect the current state of the codebase.

### New files

| File                   | Description                                                                                                                                                                                                    |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `docs/contributing.md` | Contributing guide covering setup, commands, pre-submit checklist, code conventions, three-layer architecture pattern with code examples, project layout, error handling, forms, theming, and testing patterns |

### Modified files

| File        | Changes                                                                                                                                                                                                               |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CLAUDE.md` | Expanded State Management section to document the Service/Store/Component pattern and list all four stores                                                                                                            |
| `README.md` | Fixed stale `core/` project structure tree to reflect `auth/`/`errors/`/`supabase/` sub-folders from Iteration 85. Updated signal stores Architecture Highlight. Added contributing.md link to Documentation section. |

---

## Iteration 88 — Route preloading strategy

Add `PreloadAllModules` to the router so lazy route chunks download in the background after initial page load. Currently chunks only fetch when the user navigates to a route, causing a brief delay. With preloading, the JS is already cached and navigation feels instant.

### Changes

**File:** `src/app/app.config.ts`

- Imported `withPreloading` and `PreloadAllModules` from `@angular/router`
- Added `withPreloading(PreloadAllModules)` as a second argument to `provideRouter(routes)`

### How it works

After the initial page finishes loading and the browser is idle, Angular's preloading scheduler fetches every lazy route chunk in the background. When the user clicks a sidenav link, the component is already in the browser cache. Guarded routes still preload the JS — the guard only blocks navigation, not the download.

`PreloadAllModules` is the right choice here because the app has a small number of lazy chunks (each is a single `loadComponent()` call, not a full module). A custom strategy would add complexity for no measurable gain.

This only runs in the browser — during SSR, no preloading occurs.

### Test impact

None. Tests use `provideRouter([])` which ignores preloading config.

---

## Iteration 89 — NgOptimizedImage in Avatar

Replace the plain `<img [src]>` in the Avatar component with Angular's `NgOptimizedImage` directive for automatic lazy loading, proper `srcset` hints, and Largest Contentful Paint optimization.

### Changes

**File:** `src/app/shared/avatar/avatar.ts`

- Imported `NgOptimizedImage` from `@angular/common`
- Added it to the component's `imports` array
- Changed the template `<img>` from `[src]="src()"` to `[ngSrc]="src()!"` with `[width]="size()"` and `[height]="size()"`

### How it works

`NgOptimizedImage` wraps the native `<img>` element with performance best practices:

- **Lazy loading** — adds `loading="lazy"` by default so off-screen images don't block page load
- **Dimension hints** — `[width]` and `[height]` tell the browser exact dimensions, preventing Cumulative Layout Shift (CLS)
- **srcset generation** — automatically generates responsive image sizes if an image loader is configured (not needed here since Supabase URLs are used directly)

The `src()!` non-null assertion is safe because the `<img>` only renders inside `@if (showImage())`, which requires `!!this.src()`. The `(error)` handler still fires on the underlying DOM element — the fallback to initials/icon is fully preserved. Cache-busting query params (`?t=Date.now()`) pass through unchanged.

### Why lazy loading is fine for the toolbar avatar

The Shell toolbar avatar only renders after authentication completes and the profile loads from Supabase — it's never in the critical rendering path. By the time the avatar URL exists, the page is already interactive.

### Test impact

None. Existing tests check `img.src` and dispatch `error` events on the DOM `<img>` element. `NgOptimizedImage` produces a standard `<img>` in the DOM, so they work unchanged.

---

## Iteration 90 — Supabase preconnect (reverted)

~~Add a `<link rel="preconnect">` hint in `index.html` so the browser establishes TCP + TLS to the Supabase server early, before any JavaScript runs.~~

### Outcome

Implemented and then **reverted**. The hardcoded Supabase URL in `index.html` is a maintenance risk — it can drift from the actual `supabaseUrl` in the environment files with no build-time check. There's no clean way to inject environment values into `index.html` with Angular's standard tooling, and a runtime script would defeat the purpose of preconnect. Removed.

---

## Iteration 91 — @defer on landing page below-fold content

Wrap the landing page's features section and footer in `@defer (on idle)` so Angular prioritizes rendering the hero section (above the fold) and defers the 6 feature cards until the browser is idle.

### Changes

**File:** `src/app/features/landing/landing.ts`

Wrapped the features section + footer (lines 29–113) in `@defer (on idle)` with a lightweight `@placeholder` containing just the section heading.

**File:** `src/app/features/landing/landing.spec.ts`

Updated the feature cards test to use Angular's `DeferBlockState` testing API — calls `fixture.getDeferBlocks()` and renders the first block in `DeferBlockState.Complete` before querying `.feature-card` elements.

### How it works

`@defer (on idle)` uses `requestIdleCallback` — Angular skips rendering the deferred block until the main thread has no pending work. Since the hero section takes `min-height: 100vh`, the features and footer are always below the fold on initial load. The user never sees the placeholder because the deferred content renders within milliseconds, well before they scroll down.

**SSR/prerender behavior:** The landing page is prerendered (`RenderMode.Prerender` in `app.routes.server.ts`). During SSR, `@defer` renders the `@placeholder`, not the full content. The prerendered HTML will contain the hero + the "Everything You Need" heading — sufficient for SEO. The full cards hydrate on the client almost immediately.

**Chunk splitting note:** Since `MatCardModule` and `MatIconModule` are already in the component's `imports` array, `@defer` won't create a separate JS chunk for them. The benefit is deferred **DOM creation** — Angular skips instantiating 6 card components and their templates until idle, making the hero paint faster.

---

## Iteration 92 — Admin Users list

Add a read-only users list page under `/admin/users` so admins can see who has registered. Uses the shared `DataTable` component with server-side pagination and sorting. No detail page or filters — just a simple paginated table.

### Architecture

Follows the three-layer pattern (Service → Store → Component):

- **UsersService** — queries the `profiles` table with pagination and exact count.
- **UsersStore** — holds users list in signals with pagination state and TTL cache. Read-only (no mutations beyond `setUsers` and `clear`).
- **UsersList** — orchestrates service and store, renders a `DataTable` with columns: email, display name, role, joined date.

Routing follows the existing flat pattern (like `/notes` and `/notes/new`): `/admin/users` is a sibling route under the Shell with the same `roleGuard('admin')` and `featureFlagGuard('admin')` guards. The admin dashboard gains a "Users" link card.

### Supabase RLS note

The `profiles` table likely has a `SELECT` policy scoped to `auth.uid() = id`. For this page to work, an additional RLS policy must allow admins to read all rows — e.g. `USING (auth.jwt() ->> 'role' = 'admin')` or a policy that checks the requesting user's role in the profiles table. This is a backend/migration concern outside the scope of this iteration.

### New files

| File                                           | Description                                                                                              |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `features/admin/users-service.ts`              | `UsersService` — `list(page, pageSize)` method querying profiles with pagination and exact count         |
| `features/admin/users-store.ts`                | `UsersStore` — signals for `users`, `loading`, `totalCount`, `page`, `pageSize`, TTL cache via `isStale` |
| `features/admin/users-list/users-list.ts`      | `UsersList` component — `DataTable` with server-side pagination, 4 columns                               |
| `features/admin/users-service.spec.ts`         | Service tests                                                                                            |
| `features/admin/users-store.spec.ts`           | Store tests                                                                                              |
| `features/admin/users-list/users-list.spec.ts` | Component tests                                                                                          |

### Modified files

| File                           | Changes                                                                           |
| ------------------------------ | --------------------------------------------------------------------------------- |
| `app.routes.ts`                | Added `/admin/users` route with `roleGuard('admin')`, `featureFlagGuard('admin')` |
| `features/admin/admin.ts`      | Added "Users" link card navigating to `/admin/users`                              |
| `features/admin/admin.spec.ts` | Updated assertion for new template content                                        |

---

## Iteration 93 — Expandable admin sidenav submenu + breadcrumb component

Added two interconnected navigation features: an expandable admin submenu in the shell sidenav and a reusable breadcrumb component rendered on nested pages.

### New files

| File                                   | Description                                                                                                                                                                                                                                               |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `shared/breadcrumb/breadcrumb.ts`      | Reusable `Breadcrumb` component with `BreadcrumbItem` interface. Reads `breadcrumb` data from the deepest active route via `NavigationEnd`, renders an accessible `<nav>/<ol>` with `RouterLink` on non-last items and `aria-current="page"` on the last. |
| `shared/breadcrumb/breadcrumb.spec.ts` | 4 tests: creation, empty state, rendering with links/separators, separator count = items - 1                                                                                                                                                              |

### Modified files

| File                          | Changes                                                                                                                                                                                                                                                                                                                                                             |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `shared/index.ts`             | Added `Breadcrumb` and `BreadcrumbItem` exports                                                                                                                                                                                                                                                                                                                     |
| `app.routes.ts`               | Added `breadcrumb` data to the `admin/users` route                                                                                                                                                                                                                                                                                                                  |
| `layouts/shell/shell.ts`      | Replaced dedicated `adminExpanded` signal with generic `expandedGroups` signal (`Set<string>`). Added `toggleGroup(group, navigateTo?)` method. Constructor derives expandable group prefixes from route config (any child path with a `/` whose prefix also exists as a standalone route). Auto-expands matching groups on `NavigationEnd`. Imported `Breadcrumb`. |
| `layouts/shell/shell.html`    | Replaced single admin link with expandable submenu (`<button>` toggle + Overview/Users children with icons). Added `<app-breadcrumb />` above `<router-outlet>`.                                                                                                                                                                                                    |
| `layouts/shell/shell.scss`    | Added styles for admin toggle (flat button reset), chevron rotation animation, and submenu item indentation/sizing.                                                                                                                                                                                                                                                 |
| `layouts/shell/shell.spec.ts` | Updated admin link selectors from `a[routerLink="/admin"]` to `.admin-toggle`. Added 5 tests for submenu expand/collapse behavior.                                                                                                                                                                                                                                  |

### Expandable submenu design

The submenu system is generic — no per-group signals or methods needed:

- `expandedGroups = signal(new Set<string>())` tracks all open groups by key
- `toggleGroup(group, navigateTo?)` toggles any group; optionally navigates on expand
- Group prefixes are derived from the router config at startup (e.g. `admin/users` → group `admin`)
- Auto-expand on navigation is automatic for any group

To add a new submenu (e.g. Settings with children), just add the routes (`settings`, `settings/notifications`) and the template markup — no `shell.ts` changes needed.

### Supabase RLS policy for admin user access

The `profiles` table needs an RLS policy allowing admins to `SELECT` all rows. A direct subquery on `profiles` within the policy causes infinite recursion (`42P17`), so a `SECURITY DEFINER` helper function is needed to bypass RLS for the role check. Run in the Supabase SQL Editor:

```sql
-- Helper function that bypasses RLS to check the requesting user's role
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Policy using the function
CREATE POLICY "Admins can view all profiles"
ON profiles
FOR SELECT
TO authenticated
USING (is_admin());
```

- `SECURITY DEFINER` — runs with DB owner permissions, bypassing RLS (avoids the recursive policy evaluation)
- `STABLE` — tells Postgres the result won't change within a single query, so it evaluates once per request, not once per row
- `SET search_path = ''` — security best practice to prevent search path hijacking

Non-admins still only see their own row via the existing `auth.uid() = id` policy. Supabase ORs all `SELECT` policies together, so both coexist.

---

## Iteration 94 — Admin Feature Flags page

Added a runtime feature flags management page at `/admin/feature-flags`. Admins can toggle any feature flag on/off via slide toggles. Changes are session-scoped (in-memory only, reset on page reload). Also added `components` as a feature flag and genericized the profile delete account description.

### Core changes

Made `FeatureFlags` service reactive by converting the plain `flags` object to a `signal<Record<string, boolean>>`. This means `isEnabled()` is now signal-tracked — toggling a flag in the admin UI immediately updates the shell nav, breadcrumb visibility, and route guards.

**File:** `src/app/core/feature-flags.ts`

- `private flags` → `signal<Record<string, boolean>>({...environment.featureFlags})`
- `isEnabled()` → reads `this.flags()` (signal-tracked)
- Added `setEnabled(feature, enabled)` — updates one flag at runtime
- Added `readonly allFlags` — computed signal returning `{ name, enabled }[]`

### New files

| File                                                 | Description                                                                                                                                                                                |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `features/admin/feature-flags/feature-flags.ts`      | `FeatureFlagsPage` component — `MatSlideToggle` for each flag, iterates `featureFlags.allFlags()`, calls `setEnabled()` on change. Includes info subtitle noting changes are session-only. |
| `features/admin/feature-flags/feature-flags.spec.ts` | 6 tests: creation, heading, subtitle, toggle count, flag names, setEnabled interaction                                                                                                     |

### Modified files

| File                               | Changes                                                                                                                                                               |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `core/feature-flags.ts`            | Converted to signal-based reactivity with `setEnabled()` and `allFlags`                                                                                               |
| `core/feature-flags.spec.ts`       | Added 3 tests for `setEnabled`, `allFlags`, and reactivity                                                                                                            |
| `app.routes.ts`                    | Added `/admin/feature-flags` route with breadcrumb, `roleGuard('admin')`, `featureFlagGuard('admin')`. Added `featureFlagGuard('components')` to `/components` route. |
| `features/admin/admin.ts`          | Added Feature Flags card with `toggle_on` icon and "X of Y enabled" computed subtitle                                                                                 |
| `features/admin/admin.spec.ts`     | Added 2 tests for new card rendering and enabled flags summary                                                                                                        |
| `layouts/shell/shell.html`         | Added "Feature Flags" link in admin submenu. Wrapped Components nav link in `@if (featureFlags.isEnabled('components'))`.                                             |
| `layouts/shell/shell.spec.ts`      | Updated submenu test to expect 3 links (Overview, Users, Feature Flags)                                                                                               |
| `environments/environment.base.ts` | Added `components: true` to `featureFlags`                                                                                                                            |
| `features/profile/profile.ts`      | Genericized delete account description to remove hardcoded feature names                                                                                              |

### Verification

- `npm run build` — passes
- `npm test -- --no-watch` — all 458 tests pass (62 test files)

---

## Summary

| Iteration | Name                                       | Category      | Items | Status   |
| --------- | ------------------------------------------ | ------------- | ----- | -------- |
| 84        | Normalize git author names                 | Housekeeping  | 1     | Done     |
| 85        | Reorganize `core/` into domain sub-folders | Housekeeping  | 4     | Done     |
| 86        | Add ProfileStore and FilesStore            | Architecture  | 11    | Done     |
| 87        | Add contributing guide and update docs     | Documentation | 3     | Done     |
| 88        | Route preloading strategy                  | Performance   | 1     | Done     |
| 89        | NgOptimizedImage in Avatar                 | Performance   | 1     | Done     |
| 90        | Supabase preconnect                        | Performance   | 1     | Reverted |
| 91        | @defer on landing page                     | Performance   | 2     | Done     |
| 92        | Admin Users list                           | Feature       | 9     | Done     |
| 93        | Expandable admin submenu + breadcrumb      | Feature       | 8     | Done     |
| 94        | Admin Feature Flags page                   | Feature       | 9     | Done     |

**Total iterations**: 11 (84–94).
