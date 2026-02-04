# Angular Starter Template

A production-ready Angular 21 starter template with Supabase backend, signal-based state management, SSR, theming, and a comprehensive testing setup.

## Features

- **Authentication** — Email/password + social OAuth (Google, GitHub, Spotify, Apple, Discord) via Supabase
- **Notes CRUD** — Create, read, update, delete with pagination, search, and realtime updates
- **Chat** — Realtime messaging with Supabase Realtime and presence indicators
- **File Management** — Upload, download, and manage files with Supabase Storage
- **User Profile** — Avatar upload, bio, display name, password change, and account deletion
- **Admin Panel** — Role-based admin page with user management
- **Theming** — Three color themes (Default, Teal, Slate) with dark/light mode toggle
- **SSR** — Server-side rendering with Express and client hydration
- **Accessibility** — WCAG 2.1 AA compliant with full keyboard navigation and screen reader support
- **Zoneless** — No zone.js; all reactivity driven by Angular Signals

## Quick Start

1. **Clone and install**

   ```bash
   git clone <repository-url> my-app
   cd my-app
   npm install
   ```

2. **Configure Supabase** — Update `src/environments/environment.ts` with your project URL and anon key

3. **Run the dev server**

   ```bash
   npm start
   ```

See [docs/setup.md](docs/setup.md) for the full setup guide including database migrations, OAuth configuration, and deployment.

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

## License

MIT
