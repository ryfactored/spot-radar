# Angular Starter - Phase 3

---

## Current State

The template includes:

- **Authentication** — Email/password and configurable OAuth providers via Supabase
- **Theming** — Three color themes with light/dark mode, per-user preferences
- **Error Handling** — Mapped errors, unwrap helpers, global error handler
- **Accessibility** — WCAG 2.1 AA, axe-core E2E tests, skip links, ARIA
- **Test Coverage** — 163 unit tests (80%+), 24 E2E tests, visual regression baselines
- **CI/CD** — GitHub Actions (build, test, E2E), Vercel auto-deploy
- **SSR** — Server-side rendering for public pages (landing, login, register)

---

## Iterations

### Iteration 21: ESLint + Prettier ✅

**Goal:** Enforce code quality and consistent formatting across the codebase.

**Why:** The project had Prettier config in `package.json` but no ESLint setup, and neither was enforced in CI. Without automated linting, code style drifts over time, unused imports accumulate, and subtle bugs (`any` types, missing returns) slip through review.

**What was done:**

- Installed `@angular-eslint/schematics` (ESLint with Angular-recommended rules)
- Installed `eslint-config-prettier` to prevent ESLint/Prettier conflicts
- Generated `eslint.config.js` with TypeScript, Angular, and template accessibility rules
- Added test file overrides (relaxed `no-explicit-any`, `no-empty-function`, `no-unused-vars` in `*.spec.ts`)
- Added `"@typescript-eslint/no-unused-vars": ["error", { "caughtErrors": "none" }]` for catch clauses
- Fixed 46 lint violations:
  - Removed unused imports (`Validators`, `UserProfile`, `signal`)
  - Changed `catch (err: any)` to `catch (err)` with `instanceof Error` checks
  - Renamed `search` output to `searchChange` in SearchInput (conflicted with native DOM event)
  - Added `eslint-disable` for intentional `any` in DataTable (generic row type)
- Added lint and format check steps to CI workflow (before build)
- Added `format:check` npm script
- Prettier reformatted files for consistency (line length, trailing commas, line endings)

**New files:**

- `eslint.config.js` — ESLint configuration

**New npm scripts:**

- `npm run lint` — Run ESLint
- `npm run format:check` — Verify Prettier formatting

**Tests:** 163 unit tests passing, lint clean, build passing

---

### Iteration 22: SEO / SSR ✅

**Goal:** Add server-side rendering so the public landing page is indexable by search engines.

**Why:** The landing page is the only public-facing page and the one most likely shared via links. Currently it's a blank HTML shell until JavaScript loads — search engines and social previews (Open Graph) see nothing. SSR pre-renders the HTML on the server so crawlers get real content. Authenticated pages don't need SSR since they're behind login.

**What was done:**

- Ran `ng add @angular/ssr` to add Angular SSR support
- Updated Angular packages to 21.1.2 (required for SSR compatibility)
- Added `isPlatformBrowser()` checks in:
  - `SupabaseService` — skip session persistence on server
  - `GlobalErrorHandler` — skip toasts on server
  - `App` — skip theme/dark mode class manipulation on server
- Configured `app.routes.server.ts` with render modes:
  - `RenderMode.Prerender` for public pages (`/`, `/login`, `/register`)
  - `RenderMode.Client` for all authenticated/dynamic routes
- Increased bundle size budget from 1.5MB to 1.6MB (SSR adds overhead)
- Added SEO config to environment files (`siteUrl`, `siteTitle`, `siteDescription`)
- Landing page sets Open Graph meta tags dynamically via Angular's `Meta` service

**New files:**

- `server.ts` — Express server entry point
- `src/main.server.ts` — Server bootstrap
- `src/app/app.config.server.ts` — Server-side app config
- `src/app/app.routes.server.ts` — SSR render mode configuration

**New npm scripts:**

- `npm run serve:ssr:angular-template` — Run SSR server locally

**Tests:** 163 unit tests passing, lint clean, build clean, 3 routes prerendered

---

### Iteration 23: Route Guards + Role-Based Access ✅

**Goal:** Add user roles and protect routes based on role membership.

**Why:** The current `authGuard` only checks "is the user logged in?" — it can't distinguish between a regular user and an admin. As the app grows, certain pages (user management, analytics, settings) should be restricted to specific roles. Building this foundation now avoids retrofitting later.

#### Step-by-step

**Step 1: Add `role` column to Supabase**

Run this SQL in Supabase SQL Editor:

```sql
-- Add role column with default 'user'
ALTER TABLE profiles ADD COLUMN role TEXT NOT NULL DEFAULT 'user';

-- Optional: Add check constraint for valid roles
ALTER TABLE profiles ADD CONSTRAINT valid_role CHECK (role IN ('user', 'admin'));
```

**Step 2: Update Profile interface**

Add `role` field to the `Profile` interface in `profile-service.ts`:

```typescript
export type UserRole = 'user' | 'admin';

export interface Profile {
  // ... existing fields
  role: UserRole;
}
```

**Step 3: Create `roleGuard`**

Create `src/app/core/role-guard.ts`:

- Factory function that accepts allowed roles: `roleGuard('admin')` or `roleGuard('admin', 'user')`
- Wait for auth loading (like `authGuard`)
- Fetch user profile to get role
- Return true if role matches, otherwise redirect to `/dashboard` with a toast

**Step 4: Add admin page**

Create `src/app/features/admin/admin.ts`:

- Simple placeholder page showing "Admin Dashboard"
- Only accessible to users with `admin` role

**Step 5: Add admin route**

Update `app.routes.ts`:

- Add `/admin` route inside Shell
- Apply both `authGuard` and `roleGuard('admin')`

**Step 6: Show/hide nav based on role**

Update Shell component:

- Inject ProfileService and fetch current user's profile
- Only show "Admin" nav link if `profile.role === 'admin'`

**Step 7: Add tests**

Create `src/app/core/role-guard.spec.ts`:

- Test: allows access when user has required role
- Test: denies access and redirects when user lacks role
- Test: denies access when user is not authenticated

**Step 8: Verify**

- Run `npm run lint && npm run build && npm test`
- Manually test: login as regular user (no admin link), change role to admin in Supabase, refresh (admin link appears)

**What was done:**

- Added `role` column to Supabase profiles table (SQL migration)
- Added `UserRole` type and updated `Profile` interface
- Created `roleGuard` factory function that accepts allowed roles
- Created `/admin` page (placeholder for admin functionality)
- Added `/admin` route with `roleGuard('admin')` protection
- Updated Shell to fetch user role and conditionally show Admin nav link
- Added 8 new tests (6 for roleGuard, 2 for admin component)

**New files:**

- `src/app/core/role-guard.ts` — Role-based route guard
- `src/app/core/role-guard.spec.ts` — Tests for role guard
- `src/app/features/admin/admin.ts` — Admin page component
- `src/app/features/admin/admin.spec.ts` — Admin page tests

**Tests:** 171 unit tests passing, lint clean, build clean

---

### Iteration 24: Notifications / Real-Time

**Goal:** Add real-time updates using Supabase's subscription feature.

**Why:** Currently, notes are only refreshed when the user navigates to the list or manually reloads. If notes are edited from another device or by another user (in a future shared-notes scenario), the UI becomes stale. Supabase provides PostgreSQL change notifications over WebSocket — subscribing to `INSERT`, `UPDATE`, and `DELETE` events keeps the UI in sync without polling.

**Tasks:**

- [ ] Create `RealtimeService` wrapping Supabase's `channel().on()` API
- [ ] Subscribe to notes table changes in `NotesStore`
- [ ] Update the notes list in real-time when notes are created, edited, or deleted
- [ ] Show a toast when a remote change is received (e.g. "Note updated")
- [ ] Unsubscribe on component destroy / logout
- [ ] Add connection status indicator (connected / reconnecting)

---

### Iteration 25: File Uploads

**Goal:** Add file upload support using Supabase Storage for profile avatars and note attachments.

**Why:** File uploads are a common requirement that most apps eventually need. Adding it to the starter template demonstrates the Supabase Storage pattern and gives a working foundation for profile images, document attachments, or any file-based feature.

**Tasks:**

- [ ] Create Supabase Storage bucket (e.g. `avatars`, `attachments`)
- [ ] Create `StorageService` wrapping Supabase Storage upload/download/delete
- [ ] Add avatar upload to profile page (image picker, preview, upload on save)
- [ ] Display avatar in shell header (with fallback to initials)
- [ ] Add file attachment support to notes (upload, list, download, delete)
- [ ] Add file size and type validation (client-side)
- [ ] Add tests for StorageService

---

**Pattern**: Each iteration should end with verification that build passes and tests are green before moving to the next.
