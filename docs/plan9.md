# Angular Starter - Phase 9

**Goal**: Miscellaneous housekeeping and improvements.

---

## Iteration 84 — Normalize git author names

The git history contains 4 different author names for the same person:

| Author Name | Commits |
| ----------- | ------- |
| Ryan        | 54      |
| ryfactored | 20      |
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

**Total iterations**: 8 (84–91).
