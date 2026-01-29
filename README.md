# Angular Starter Template

A modern Angular 21 starter template with Supabase authentication, CRUD operations, state management using signals, and a complete testing setup.

## Features

- **Authentication** - Email/password, Google, and GitHub OAuth via Supabase
- **Notes CRUD** - Full create, read, update, delete functionality with pagination and search
- **Dark Mode** - Theme toggle with localStorage persistence
- **User Profile** - View and manage authenticated user info
- **State Management** - Signal-based stores for reactive state
- **Error Handling** - Global error handler with toast notifications
- **Skeleton Loaders** - Loading states for better UX
- **Responsive Layout** - Material Design sidenav with collapsible navigation

## Prerequisites

- **Node.js 20+**
- **Angular CLI 21** - `npm install -g @angular/cli@21`
- **Supabase Account** - [Create one at supabase.com](https://supabase.com)

## Quick Start

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd angular-starter
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure Supabase**

   Update `src/environments/environment.ts` with your Supabase credentials:

   ```typescript
   export const environment = {
     production: false,
     supabaseUrl: 'YOUR_SUPABASE_URL',
     supabaseAnonKey: 'YOUR_SUPABASE_ANON_KEY',
   };
   ```

4. **Set up the database** (see [Database Setup](#database-setup))

5. **Start the development server**

   ```bash
   npm start
   ```

6. **Open your browser** at `http://localhost:4200`

## Database Setup

Run this SQL in your Supabase SQL Editor to create the notes table:

```sql
-- Create notes table
create table public.notes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  content text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Enable Row Level Security
alter table public.notes enable row level security;

-- RLS policies: users can only access their own notes
create policy "Users can view own notes"
  on public.notes for select
  using (auth.uid() = user_id);

create policy "Users can create own notes"
  on public.notes for insert
  with check (auth.uid() = user_id);

create policy "Users can update own notes"
  on public.notes for update
  using (auth.uid() = user_id);

create policy "Users can delete own notes"
  on public.notes for delete
  using (auth.uid() = user_id);
```

### Enable OAuth Providers (Optional)

To enable Google or GitHub authentication:

1. Go to **Authentication > Providers** in your Supabase dashboard
2. Enable Google and/or GitHub
3. Add the required OAuth credentials from each provider
4. Go to **Authentication > URL Configuration** and add redirect URLs:
   - `http://localhost:4200/**` (for local development)
   - `https://your-domain.com/**` (for production)

## Available Scripts

| Command          | Description                                         |
| ---------------- | --------------------------------------------------- |
| `npm start`      | Start development server at `http://localhost:4200` |
| `npm run build`  | Build for production                                |
| `npm run watch`  | Build in watch mode for development                 |
| `npm test`       | Run unit tests with Vitest                          |
| `npm run e2e`    | Run end-to-end tests with Playwright                |
| `npm run e2e:ui` | Run Playwright tests with UI mode                   |

## Project Structure

```
src/
├── app/
│   ├── core/                    # Singleton services & guards
│   │   ├── auth.ts              # Authentication service (signals)
│   │   ├── auth-guard.ts        # Route guard for authenticated users
│   │   ├── guest-guard.ts       # Route guard for unauthenticated users
│   │   ├── supabase.ts          # Supabase client service
│   │   ├── preferences.ts       # User preferences store (theme, sidenav)
│   │   ├── global-error-handler.ts
│   │   └── http-error-interceptor.ts
│   │
│   ├── features/                # Feature modules (lazy-loaded)
│   │   ├── auth/
│   │   │   ├── login/           # Login page
│   │   │   └── register/        # Registration page
│   │   ├── dashboard/           # Dashboard page
│   │   ├── notes/               # Notes feature
│   │   │   ├── notes.ts         # Notes service
│   │   │   ├── notes-store.ts   # Notes signal store
│   │   │   ├── notes-list/      # Notes list component
│   │   │   └── note-form/       # Note create/edit form
│   │   └── profile/             # Profile feature
│   │       ├── profile.ts       # Profile page component
│   │       └── profile-service.ts # Profile data service
│   │
│   ├── layouts/                 # Layout components
│   │   ├── shell/               # Main app shell with sidenav
│   │   └── auth-layout/         # Auth pages layout
│   │
│   ├── shared/                  # Shared components & utilities
│   │   ├── confirm-dialog/      # Confirmation dialog component & service
│   │   ├── empty-state/         # Empty state component
│   │   ├── loading-spinner/     # Loading spinner
│   │   ├── skeleton/            # Skeleton loader
│   │   └── toast.ts             # Toast notification service
│   │
│   ├── app.ts                   # Root component
│   ├── app.config.ts            # App configuration & providers
│   └── app.routes.ts            # Route definitions
│
├── environments/
│   └── environment.ts           # Environment configuration
│
└── styles.scss                  # Global styles
```

## Architecture Decisions

### Standalone Components

All components are standalone (no NgModules). This is the modern Angular approach that provides:

- Simpler component structure
- Better tree-shaking
- Explicit dependencies per component

```typescript
@Component({
  standalone: true,
  imports: [CommonModule, MatButtonModule],
  // ...
})
export class MyComponent {}
```

### Path Aliases

The project uses TypeScript path aliases for cleaner imports:

| Alias         | Path                           | Usage                        |
| ------------- | ------------------------------ | ---------------------------- |
| `@core`       | `src/app/core`                 | Services, guards, utilities  |
| `@shared`     | `src/app/shared`               | Shared components & services |
| `@layouts`    | `src/app/layouts`              | Layout components            |
| `@features/*` | `src/app/features/*`           | Feature modules              |
| `@env`        | `src/environments/environment` | Environment config           |

```typescript
// Before
import { AuthService } from '../../../core/auth';
import { ToastService } from '../../../shared/toast';

// After
import { AuthService } from '@core';
import { ToastService } from '@shared';
```

### Signal-Based State Management

The app uses Angular Signals for reactive state instead of RxJS-heavy patterns:

**AuthService** - User authentication state

```typescript
currentUser = signal<User | null>(null);
loading = signal(true);
```

**NotesStore** - Notes state with computed values

```typescript
readonly allNotes = this.notes.asReadonly();
readonly isEmpty = computed(() => this.notes().length === 0);
readonly isStale = computed(() => /* cache invalidation logic */);
```

**PreferencesService** - User preferences with auto-persist

```typescript
effect(() => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(this.preferences()));
});
```

### Functional Route Guards

Guards use the modern functional pattern with signals:

```typescript
export const authGuard = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return toObservable(auth.loading).pipe(
    filter((loading) => !loading),
    take(1),
    map(() => (auth.currentUser() ? true : router.parseUrl('/login'))),
  );
};
```

### Lazy-Loaded Routes

Feature components are lazy-loaded for optimal bundle size:

```typescript
{
  path: 'notes',
  loadComponent: () => import('./features/notes/notes-list/notes-list')
    .then(m => m.NotesList),
}
```

### Global Error Handling

Centralized error handling with:

- `GlobalErrorHandler` - Catches unhandled errors
- `httpErrorInterceptor` - Handles HTTP errors with Supabase-specific messages
- `ToastService` - Displays user-friendly error notifications

## Testing

### Unit Tests (Vitest)

Unit tests are located alongside source files with `.spec.ts` suffix.

```bash
# Run all unit tests
npm test

# Run with coverage
npm test -- --coverage
```

### End-to-End Tests (Playwright)

E2E tests are in the `e2e/` directory.

```bash
# Run E2E tests (headless)
npm run e2e

# Run with Playwright UI
npm run e2e:ui
```

The Playwright config automatically starts the dev server before running tests.

## Deployment

### Vercel

1. **Connect your repository** to Vercel

2. **Configure build settings**:
   - Build Command: `npm run build`
   - Output Directory: `dist/angular-starter/browser`
   - Install Command: `npm install`

3. **Add environment variables** in Vercel dashboard:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`

4. **Update Supabase settings**:
   - Add your Vercel domain to **Authentication > URL Configuration > Site URL**
   - Add redirect URLs for OAuth providers

### Other Platforms

The production build outputs to `dist/angular-starter/browser`. Deploy this directory to any static hosting service (Netlify, Firebase Hosting, AWS S3, etc.).

```bash
npm run build
```

## Environment Variables

For production builds, create `src/environments/environment.prod.ts`:

```typescript
export const environment = {
  production: true,
  supabaseUrl: 'YOUR_SUPABASE_URL',
  supabaseAnonKey: 'YOUR_SUPABASE_ANON_KEY',
};
```

## License

MIT
