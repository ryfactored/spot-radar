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

**Angular 21, standalone components, zoneless (no zone.js), SSR with Express, Supabase backend.**

### Zoneless Change Detection

There is no zone.js. Only **signals** trigger change detection. All reactive component state (`loading`, `error`, `success`, etc.) must use `signal()`, `computed()`, or other signal primitives. Plain property assignments after async operations will NOT update the UI. Existing components like login/register have plain properties that work only because Supabase's `onAuthStateChange` fires a signal update or `router.navigate()` triggers change detection as a side effect.

### State Management

Signals are the primary state primitive. RxJS is used only where required (route guards via `toObservable()`, breakpoint detection via `toSignal()`). Feature stores use the signal store pattern — see `notes-store.ts` for the reference implementation with computed derived state and 5-minute TTL cache invalidation. Use `effect()` for side effects like auto-persisting to localStorage.

### Project Layout

- **`core/`** — Singleton services, guards, error handling. Barrel-exported via `@core`.
- **`features/`** — Lazy-loaded feature areas (auth, notes, chat, files, dashboard, etc.).
- **`shared/`** — Reusable components, validators, toast service. Barrel-exported via `@shared`.
- **`layouts/`** — Shell (authenticated), AuthLayout (guest), PublicLayout (landing). Barrel-exported via `@layouts`.

### Path Aliases

`@core` → `src/app/core`, `@shared` → `src/app/shared`, `@layouts` → `src/app/layouts`, `@features/*` → `src/app/features/*`, `@env` → `src/environments/environment`

### Auth & Routing

AuthService manages state with `currentUser` and `loading` signals. Guards are functional: `authGuard` waits for loading to complete then checks user; `guestGuard` redirects authenticated users to `/dashboard`; `roleGuard('admin')` is a factory checking profile.role. All feature components use `loadComponent()` for lazy loading. Routes without guards (like `/reset-password`) exist for flows where the user arrives authenticated via URL token — use `computed()` with `auth.loading()` to handle the async session establishment.

### Error Handling

Three layers: `GlobalErrorHandler` catches unhandled exceptions (uses `NgZone.run()` for UI updates), `httpErrorInterceptor` handles HTTP errors, and `error-mapper.ts` maps Supabase error codes to user-friendly messages. Use `unwrap()` / `unwrapWithCount()` helpers for Supabase `{ data, error }` results. Default is always a generic message — only explicitly mapped codes get custom messages.

### SSR

Express-based SSR with `provideClientHydration(withEventReplay())`. Landing, login, and register are prerendered. Authenticated routes use client-side rendering. A script in index.html hides content on non-landing routes to prevent flash during hydration.

## Conventions

- **Standalone components only** — no NgModules. Inline templates and styles (SCSS) using backticks.
- **Component selectors**: `app-` prefix, kebab-case.
- **Class names**: PascalCase matching the feature (e.g., `export class NotesList`, `export class Login`).
- **Files**: kebab-case, `.ts` extension for components (not `.component.ts`).
- **Formatting**: Prettier with `printWidth: 100`, single quotes. 2-space indentation.
- **Testing**: Vitest with `vi.fn()` for mocks, `TestBed` for Angular DI, `NoopAnimationsModule` for component tests. Playwright for E2E with `test.describe()` blocks.
- **ToastService API**: `toast.success(msg)`, `toast.error(msg)`, `toast.info(msg)`.
- **Forms**: Reactive forms with `fb.nonNullable.group()`. Custom validators in `shared/validators/`.
