# Contributing

## Prerequisites

- Node.js (see `.nvmrc` for version)
- A Supabase project (see [setup.md](setup.md) for database and auth configuration)

## Development Setup

```bash
git clone <repository-url>
cd angular-starter
npm install
npm start          # Dev server at http://localhost:4200
```

## Commands

```bash
npm start                          # Dev server
npm run build                      # Production build (SSR)
npm test                           # Unit tests (watch mode)
npm test -- --no-watch             # Unit tests, single run
npm test -- --no-watch <file>      # Single test file
npm run e2e                        # E2E tests (headless)
npm run e2e:ui                     # E2E tests (interactive)
npm run lint                       # ESLint
npm run format                     # Prettier (write)
npm run format:check               # Prettier (check only)
```

## Before Submitting

1. `npm run build` passes
2. `npm test -- --no-watch` — all tests pass
3. `npm run lint` — clean
4. `npm run format:check` — no formatting issues

## Code Conventions

### Files and Naming

- **File names**: kebab-case, `.ts` extension (not `.component.ts`)
- **Class names**: PascalCase matching the feature (`NotesList`, `Login`, `FilesPage`)
- **Component selectors**: `app-` prefix, kebab-case (`app-notes-list`)
- **Standalone components only** — no NgModules. `standalone: true` is omitted (Angular 19+ default)
- **Inline templates and styles** using backticks

### Formatting

Prettier with `printWidth: 100`, single quotes, 2-space indentation. Run `npm run format` before committing.

### Imports

Use path aliases instead of relative paths that cross directory boundaries:

| Alias         | Path                           |
| ------------- | ------------------------------ |
| `@core`       | `src/app/core`                 |
| `@shared`     | `src/app/shared`               |
| `@layouts`    | `src/app/layouts`              |
| `@features/*` | `src/app/features/*`           |
| `@env`        | `src/environments/environment` |

## Architecture

### Zoneless Change Detection

There is no zone.js. All reactive state must use `signal()`, `computed()`, or other signal primitives. Plain property assignments after async operations will not trigger change detection.

### Three-Layer Pattern (Service / Store / Component)

All features with shared or list data follow this pattern:

**Service** — Pure data access. Async methods that call Supabase and return data. No signals, no state.

```typescript
// profile-service.ts
async getProfile(userId: string): Promise<Profile | null> { ... }
async updateProfile(userId: string, updates: Partial<Profile>): Promise<Profile> { ... }
```

**Store** — `providedIn: 'root'` injectable holding domain data in signals. Exposes readonly signals and mutation methods. Never calls services or makes network requests.

```typescript
// profile-store.ts
@Injectable({ providedIn: 'root' })
export class ProfileStore {
  private profile = signal<Profile | null>(null);
  private loading = signal(false);

  readonly currentProfile = this.profile.asReadonly();
  readonly isLoading = this.loading.asReadonly();
  readonly avatarUrl = computed(() => this.profile()?.avatar_url ?? null);

  setProfile(profile: Profile | null) {
    this.profile.set(profile);
  }
  setLoading(loading: boolean) {
    this.loading.set(loading);
  }
  clear() {
    this.profile.set(null);
  }
}
```

**Component** — Orchestrator. Injects both service and store. Calls the service, pushes results into the store. Templates bind to store signals.

```typescript
// profile.ts
private profileService = inject(ProfileService);
profileStore = inject(ProfileStore);

async ngOnInit() {
  this.profileStore.setLoading(true);
  const profile = await this.profileService.getProfile(userId);
  this.profileStore.setProfile(profile);
  this.profileStore.setLoading(false);
}
```

**What goes where:**

| Store (shared domain state)      | Local signal (transient UI state) |
| -------------------------------- | --------------------------------- |
| `files`, `loading`, `profile`    | `saving`, `uploading`, `deleting` |
| Data read by multiple components | Flags for a single button/form    |

Existing stores: `NotesStore`, `ChatStore`, `FilesStore`, `ProfileStore`. See `notes-store.ts` for the reference implementation with computed derived state and TTL cache invalidation.

### Project Layout

- **`core/`** — Singleton services, guards, error handling. Sub-folders: `auth/`, `errors/`, `supabase/`. Barrel-exported via `@core`.
- **`features/`** — Lazy-loaded feature areas. Each feature contains its own service, store, component(s), and specs.
- **`shared/`** — Reusable components, validators, toast service. Barrel-exported via `@shared`.
- **`layouts/`** — Shell (authenticated), AuthLayout (guest), PublicLayout (landing). Barrel-exported via `@layouts`.

### Error Handling

- Use `unwrap()` / `unwrapWithCount()` for Supabase `{ data, error }` results
- Use `extractErrorMessage(err, fallback)` in catch blocks
- `httpErrorInterceptor` handles HTTP errors; `GlobalErrorHandler` catches the rest
- `error-mapper.ts` maps Supabase error codes to user-friendly messages

### Forms

Reactive forms with `fb.nonNullable.group()`. Custom validators live in `shared/validators/`.

### Theming

Use `var(--mat-sys-*)` CSS custom properties for colors. Override Material component styles via `--mdc-*` tokens instead of `!important`.

## Testing

### Unit Tests (Vitest)

Specs are colocated with source files as `.spec.ts`. Patterns:

- `vi.fn()` for mocks
- `TestBed` for Angular DI
- `NoopAnimationsModule` for component tests
- Real store instances via `TestBed.inject()` (stores are simple enough to use directly)
- Mock services with `vi.fn().mockResolvedValue()`

### E2E Tests (Playwright)

Tests live in `e2e/` and use `test.describe()` blocks.

```bash
npm run e2e                        # Headless
npm run e2e:ui                     # Interactive UI
npm run e2e:update-snapshots       # Update visual regression snapshots
```
