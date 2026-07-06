# Spot Radar

Your personal new-releases feed. Spot Radar connects to your Spotify account, tracks the artists you follow, and surfaces what they just dropped — built on Angular 21 (zoneless) with a Supabase backend, signal-based state, and SSR.

## Features

- **Spotify sign-in** — OAuth via Supabase; imports the artists you follow
- **New Releases feed** — Albums and singles from your artists, grouped into "new since you last checked" and "previously seen", with type/recency/source filters and infinite scroll
- **My Artists** — Search and filter the artists you track, by source (followed vs. saved)
- **Sync** — On-demand and scheduled background syncs against the Spotify API, with live progress
- **Dashboard** — At-a-glance latest release and follow/release counts
- **User Profile** — Avatar upload, display name, bio, password change, and account deletion
- **Admin Panel** — Role-gated user management and runtime feature flags
- **Theming** — Light/dark mode with color themes
- **SSR** — Server-side rendering with Express and client hydration
- **Zoneless** — No zone.js; all reactivity driven by Angular Signals

> The Notes, Chat, and Files areas are dormant scaffolding from the starter this
> project was built on. They are disabled by feature flags (and off in production);
> see [docs/feature-removal.md](docs/feature-removal.md) to remove them entirely.

## Quick Start

1. **Clone and install**

   ```bash
   git clone <repository-url> spot-radar
   cd spot-radar
   npm install
   ```

2. **Configure Supabase** — Copy `src/environments/environment.local.example.ts` to
   `src/environments/environment.local.ts` and fill in your Supabase project URL and
   anon key. This file is gitignored, so real credentials never get committed — do
   **not** put them in the tracked `environment.ts`. (In CI/hosting, the same values
   are injected from `SUPABASE_URL` / `SUPABASE_ANON_KEY` env vars via `scripts/set-env.js`.)

3. **Run the dev server**

   ```bash
   npm start
   ```

See [docs/setup.md](docs/setup.md) for the full setup guide including database migrations, Spotify OAuth configuration, edge-function deployment, and hosting.

## Commands

| Command                        | Description                         |
| ------------------------------ | ----------------------------------- |
| `npm start`                    | Dev server at http://localhost:4200 |
| `npm run build`                | Production build (SSR)              |
| `npm test`                     | Unit tests (Vitest, watch mode)     |
| `npm test -- --no-watch`       | Unit tests, single run              |
| `npm run e2e`                  | Playwright E2E tests (headless)     |
| `npm run e2e:ui`               | Playwright with interactive UI      |
| `npm run e2e:update-snapshots` | Update visual regression snapshots  |
| `npm run lint`                 | ESLint                              |
| `npm run format`               | Prettier (write)                    |
| `npm run format:check`         | Prettier (check only)               |
| `npm run serve:ssr`            | Run SSR production server locally   |

## Project Structure

```
src/
├── app/
│   ├── core/                      # Singleton services & guards (barrel-exported via @core)
│   │   ├── auth/
│   │   │   ├── auth.ts            # Auth service (signals, Supabase Auth)
│   │   │   ├── auth-guard.ts      # authGuard & guestGuard (shared factory)
│   │   │   └── role-guard.ts      # Route guard — role-based (admin)
│   │   ├── errors/
│   │   │   ├── error-mapper.ts    # Supabase error → user-friendly messages
│   │   │   ├── extract-error-message.ts
│   │   │   ├── global-error-handler.ts
│   │   │   ├── http-error-interceptor.ts
│   │   │   └── supabase-errors.ts # Error code constants
│   │   ├── supabase/
│   │   │   ├── supabase.ts        # Supabase client wrapper
│   │   │   ├── storage.ts         # File upload/download service
│   │   │   └── realtime.ts        # Realtime subscription manager
│   │   ├── preferences.ts         # User preferences store (theme, sidenav)
│   │   ├── feature-flags.ts       # Feature flag service
│   │   ├── feature-flag-guard.ts  # Route guard — feature flag check
│   │   └── unsaved-changes-guard.ts # canDeactivate guard for dirty forms
│   │
│   ├── features/                  # Lazy-loaded feature areas
│   │   ├── admin/                 # Admin panel (role-gated)
│   │   ├── auth/                  # Login, register, forgot/reset password, verify email
│   │   ├── chat/                  # Realtime chat room
│   │   ├── dashboard/             # Dashboard
│   │   ├── files/                 # File management
│   │   ├── landing/               # Public landing page
│   │   ├── notes/                 # Notes CRUD with signal store
│   │   └── profile/               # Profile, password change, account deletion
│   │
│   ├── layouts/                   # Shell (authenticated), AuthLayout, PublicLayout
│   │
│   ├── shared/                    # Reusable components & utilities
│   │   ├── avatar/                # Avatar component
│   │   ├── confirm-dialog/        # Confirm dialog component & service
│   │   ├── data-table/            # Generic data table with pagination
│   │   ├── loading-bar/           # Route loading bar
│   │   ├── password-strength/     # Password strength indicator
│   │   ├── search-input/          # Debounced search input
│   │   ├── skeleton-overlay/      # Skeleton loading overlay
│   │   ├── theme-picker/          # Theme selection component
│   │   ├── toast.ts               # Toast notification service
│   │   └── validators/            # Custom form validators
│   │
│   ├── app.ts                     # Root component
│   ├── app.config.ts              # App configuration & providers
│   └── app.routes.ts              # Route definitions
│
├── environments/
│   ├── environment.interface.ts   # Environment type definition
│   ├── environment.ts             # Development config
│   └── environment.prod.ts        # Production config
│
└── styles.scss                    # Global styles & theme definitions
```

## Architecture Highlights

- **Standalone components only** — no NgModules; inline templates and styles
- **Zoneless change detection** — all reactive state uses `signal()`, `computed()`, and `effect()`
- **Signal stores** — all features use the Service → Store → Component pattern; stores are pure state containers, services handle data access, components orchestrate (see `notes-store.ts` for TTL cache invalidation)
- **Functional route guards** — `authGuard`, `guestGuard`, `roleGuard()`, `unsavedChangesGuard`, `featureFlagGuard()`
- **Feature flags** — Toggle features on/off via environment config without code changes
- **SSR with Express** — `provideClientHydration(withEventReplay())`, prerendered landing/auth pages
- **Three-layer error handling** — `GlobalErrorHandler` + `httpErrorInterceptor` + `error-mapper.ts`
- **Path aliases** — `@core`, `@shared`, `@layouts`, `@features/*`, `@env`

## Testing

**Unit tests** (Vitest) are colocated with source files as `.spec.ts`:

```bash
npm test                                        # Watch mode
npm test -- --no-watch                           # Single run
npm test -- --no-watch src/app/core/auth.spec.ts # Single file
```

**E2E tests** (Playwright) live in `e2e/`:

```bash
npm run e2e       # Headless
npm run e2e:ui    # Interactive UI
```

## Deployment

The app uses SSR with Express. See [docs/setup.md](docs/setup.md) for Vercel, Docker, and static hosting deployment instructions.

## Documentation

- [Setup Guide](docs/setup.md) — Full clone-to-deploy walkthrough
- [Contributing](docs/contributing.md) — Code conventions, architecture patterns, and testing
- [Theming Guide](docs/theming.md) — Customize colors and add new themes
- [Feature Removal](docs/feature-removal.md) — Strip example features you don't need
- [Accessibility](docs/accessibility.md) — Audit results and patterns used
- [Command Reference](docs/commands.md) — Full list of npm scripts

## License

MIT
