# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start                          # Dev server at http://localhost:4200
npm run build                      # Production build
npm test                           # Unit tests (Vitest)
npm test -- --no-watch             # Unit tests, single run
npm test -- --no-watch src/app/core/auth.spec.ts  # Single test file
npm run e2e                        # Playwright E2E tests (headless)
npm run e2e:ui                     # Playwright with interactive UI
npm run e2e:update-snapshots       # Update visual regression snapshots
npm run lint                       # ESLint
npm run format                     # Prettier
npm run format:check               # Check formatting without modifying
```

## Architecture

**Angular 21, zoneless (no zone.js), SSR with Express, Supabase backend.**

### Zoneless Change Detection

There is no zone.js. Only **signals** trigger change detection. All reactive component state (`loading`, `error`, `success`, etc.) must use `signal()`, `computed()`, or other signal primitives. Plain property assignments after async operations will NOT update the UI. For `[(ngModel)]` bindings with signals, use the split binding pattern: `[ngModel]="value()" (ngModelChange)="value.set($event)"`.

### State Management

Signals are the primary state primitive. RxJS is used only where required (route guards via `toObservable()`, breakpoint detection via `toSignal()`). Use `effect()` for side effects like auto-persisting to localStorage.

All features with shared or list data use the three-layer pattern:

- **Service** — Pure data access. Async methods that call Supabase and return data. No signals, no state.
- **Store** — `providedIn: 'root'` injectable holding domain data in signals. Exposes readonly signals and mutation methods. Never calls services or makes network requests.
- **Component** — Orchestrator. Injects both service and store. Calls the service, pushes results into the store. Templates bind to store signals. Transient UI flags (`saving`, `uploading`, `deleting`) stay as local component signals.

Stores: `NotesStore`, `ChatStore`, `FilesStore`, `ProfileStore`. See `notes-store.ts` for the reference implementation with computed derived state and 5-minute TTL cache invalidation.

### Database Schema

App tables (`profiles`, `notes`, `messages`, `files`) live in the `angular_starter` schema, not `public`. The schema name is configurable via `environment.supabaseDbSchema` (defaults to `'angular_starter'`). The Supabase client's `db.schema` option routes all `.from('table')` calls to the configured schema automatically — no per-query schema references needed in service code.

### Project Layout

- **`core/`** — Singleton services, guards, error handling. Barrel-exported via `@core`.
- **`features/`** — Lazy-loaded feature areas (auth, notes, chat, files, dashboard, etc.).
- **`shared/`** — Reusable components, validators, toast service. Barrel-exported via `@shared`.
- **`layouts/`** — Shell (authenticated), AuthLayout (guest), PublicLayout (landing). Barrel-exported via `@layouts`.

### Path Aliases

`@core` → `src/app/core`, `@shared` → `src/app/shared`, `@layouts` → `src/app/layouts`, `@features/*` → `src/app/features/*`, `@env` → `src/environments/environment`

### Auth & Routing

AuthService manages state with `currentUser` and `loading` signals, initialized solely via Supabase's `onAuthStateChange` (fires `INITIAL_SESSION` on startup — no separate `loadUser()` call). `signOut()` calls `supabase.auth.signOut()` and relies on the `SIGNED_OUT` event to clear state and navigate. Guards are functional: `authGuard` and `guestGuard` are created by a shared `createAuthGuard(requireAuth)` factory in `auth-guard.ts`; `roleGuard('admin')` checks profile.role; `featureFlagGuard('chat')` checks `environment.featureFlags`. All feature components use `loadComponent()` for lazy loading. Routes without guards (like `/reset-password`) exist for flows where the user arrives authenticated via URL token.

### Route Navigation Settings

Parent routes can configure child navigation and breadcrumb visibility via route data:

- **`childNavMode`** — Controls how child pages are navigated. Values: `'tabs'` (horizontal tab bar), `'sidenav'` (expandable menu in shell sidenav), `'none'`. Routes without an explicit `childNavMode` use the `defaultChildNavMode` feature flag (defaults to `'none'`).
- **`showBreadcrumb`** — Controls breadcrumb visibility for the route. Requires the `breadcrumb` feature flag to be enabled. Defaults to `false` — routes must explicitly set `showBreadcrumb: true` to show breadcrumbs.
- **`childNav`** — Array of `{ label, route, icon }` items for the child navigation UI.

Example route with tabs navigation and no breadcrumbs:

```typescript
{
  path: 'components',
  data: {
    title: 'Components',
    childNavMode: CHILD_NAV_MODE.TABS,
    childNav: [
      { label: 'Feedback', route: '/components', icon: 'notifications' },
      { label: 'Display', route: '/components/display', icon: 'visibility' },
    ],
  },
}
```

Example route with sidenav submenu and breadcrumbs:

```typescript
{
  path: 'admin',
  data: {
    title: 'Admin',
    childNavMode: CHILD_NAV_MODE.SIDENAV,
    showBreadcrumb: true,
    childNav: [...],
  },
}
```

### Error Handling

Three layers: `httpErrorInterceptor` handles HTTP errors and marks them with `__handled`, `GlobalErrorHandler` catches remaining unhandled exceptions (skips `__handled` errors, uses `NgZone.run()` for UI updates), and `error-mapper.ts` maps Supabase error codes to user-friendly messages. Use `unwrap()` / `unwrapWithCount()` helpers for Supabase `{ data, error }` results. Use `extractErrorMessage(err, fallback)` to safely extract a message from unknown error types in catch blocks. Default is always a generic message — only explicitly mapped codes get custom messages.

### Loading States

Two primary patterns:

- **Skeleton cards** — List/grid views. Create a `*CardSkeleton` component matching the real card shape using `Skeleton` from `@shared`. Render 6 in the same grid container. See `NoteCardSkeleton`, `FileCardSkeleton`.
- **SkeletonOverlay** — Forms and pre-filled content where the DOM structure already exists. Apply `[appSkeletonOverlay]="loading()"` on the container. See Profile, NoteForm.

`LoadingSpinner` remains available for edge cases (e.g., Chat message stream) but is not the default for page-level loading.

### SSR

Express-based SSR with `provideClientHydration(withEventReplay())`. Landing, login, and register are prerendered. Authenticated routes use client-side rendering. A script in index.html hides content on non-landing routes to prevent flash during hydration.

## Conventions

- **Standalone components only** — no NgModules. `standalone: true` is omitted (Angular 19+ default). Inline templates and styles using backticks.
- **Component selectors**: `app-` prefix, kebab-case.
- **Class names**: PascalCase matching the feature (e.g., `export class NotesList`, `export class Login`).
- **Files**: kebab-case, `.ts` extension for components (not `.component.ts`).
- **Formatting**: Prettier with `printWidth: 100`, single quotes. 2-space indentation.
- **Testing**: Vitest with `vi.fn()` for mocks, `TestBed` for Angular DI, `NoopAnimationsModule` for component tests. Playwright for E2E with `test.describe()` blocks.
- **ToastService API**: `toast.success(msg)`, `toast.error(msg)`, `toast.info(msg)`.
- **Forms**: Reactive forms with `fb.nonNullable.group()`. Custom validators in `shared/validators/`.
- **Theming**: Use `var(--mat-sys-*)` CSS custom properties for colors that adapt to light/dark mode. Override Material component styles via `--mdc-*` tokens (e.g., `--mdc-filled-button-container-color`) instead of `!important`. Auth form components share styles via `AUTH_FORM_STYLES` constant.
- **Environments**: `environment.base.ts` holds shared values with placeholders for secrets. `environment.local.ts` (gitignored) provides real Supabase credentials via `localOverrides`; copy `environment.local.example.ts` to get started. `environment.ts` and `environment.prod.ts` spread base + local overrides. `SocialProvider` type lives in `environments/social-provider.ts`.
