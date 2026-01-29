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

### Iteration 22: SEO / SSR

**Goal:** Add server-side rendering so the public landing page is indexable by search engines.

**Why:** The landing page is the only public-facing page and the one most likely shared via links. Currently it's a blank HTML shell until JavaScript loads — search engines and social previews (Open Graph) see nothing. SSR pre-renders the HTML on the server so crawlers get real content. Authenticated pages don't need SSR since they're behind login.

#### Step-by-step

**Step 1: Add Angular SSR**

Run `ng add @angular/ssr`. This:
- Installs `@angular/ssr` and `express`
- Creates `server.ts` (Express server entry point)
- Updates `angular.json` with SSR build configuration
- Updates `app.config.ts` to include `provideClientHydration()`

**Step 2: Handle Supabase in SSR context**

Supabase uses browser APIs (`localStorage`, `window`). On the server, these don't exist. Update `SupabaseService` to:
- Check if running in browser using `isPlatformBrowser()`
- Skip auth persistence on server (use `persistSession: false` or memory storage)
- Return null/empty for auth state on server

**Step 3: Add Open Graph meta tags**

Update the landing page to set meta tags for social sharing:
- `og:title` — "Angular Starter Template"
- `og:description` — Brief description of the template
- `og:image` — URL to a preview image (optional, can add later)
- `og:url` — Canonical URL

Use Angular's `Meta` service to set these dynamically, or add them statically to `index.html` if the landing page content is fixed.

**Step 4: Configure Vercel for SSR**

Vercel auto-detects Angular SSR and configures serverless functions. Verify:
- Build output includes both browser and server bundles
- `vercel.json` is not needed (Vercel handles routing)
- Preview deploy works with SSR

**Step 5: Test SSR locally**

Run `npm run serve:ssr:angular-template` (or the script added by `ng add`). Visit `http://localhost:4000` and:
- View page source — should see pre-rendered HTML, not empty `<app-root>`
- Verify landing page renders
- Verify login/register pages render (even if they redirect client-side)
- Verify authenticated routes don't break (they'll render loading state on server)

**Step 6: Verify and deploy**

- Run `npm run build` (builds both browser and server)
- Run `npm test` and `npm run e2e` to ensure no regressions
- Push to trigger Vercel deploy
- Test the deployed SSR landing page with [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/) or similar

#### Notes

- SSR adds complexity — only use it if SEO matters for your landing page
- Authenticated routes don't benefit from SSR (user-specific content can't be pre-rendered)
- If Supabase causes issues, consider lazy-loading it only in browser context

---

### Iteration 23: Route Guards + Role-Based Access

**Goal:** Add user roles and protect routes based on role membership.

**Why:** The current `authGuard` only checks "is the user logged in?" — it can't distinguish between a regular user and an admin. As the app grows, certain pages (user management, analytics, settings) should be restricted to specific roles. Building this foundation now avoids retrofitting later.

**Tasks:**

- [ ] Add `role` column to Supabase user profile (e.g. `user`, `admin`)
- [ ] Create `RoleService` to fetch and cache the current user's role
- [ ] Create `roleGuard(allowedRoles)` — a configurable route guard that checks role membership
- [ ] Add a protected admin route (placeholder page) to demonstrate the pattern
- [ ] Show/hide navigation items based on role
- [ ] Add tests for role guard (allowed, denied, unauthenticated)

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
