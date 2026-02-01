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

- `npm run serve:ssr` — Run SSR server locally

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

### Iteration 24: Chat Feature (Realtime Showcase) ✅

**Goal:** Add real-time updates using Supabase Realtime, demonstrated via a chat feature.

**Why:** Chat is a natural showcase for Supabase Realtime because messages from all authenticated users appear instantly — the core value prop of realtime subscriptions.

**What was done:**

- Created `RealtimeService` wrapping Supabase's `channel().on()` API
- Created `ConnectionIndicator` component showing connection status (connected/connecting/reconnecting/disconnected)
- Created Chat feature with realtime message updates:
  - `ChatService` — list() fetches last 50 messages, send() inserts new message
  - `ChatStore` — signal-based store with realtime subscription for INSERT events
  - `ChatRoom` — component with message list, input field, auto-scroll, own-message highlighting
- Added `/chat` route and nav link

**New files:**

- `src/app/core/realtime.ts` — RealtimeService with subscribeToTable(), connectionStatus signal
- `src/app/core/realtime.spec.ts` — 15 unit tests
- `src/app/shared/connection-indicator/connection-indicator.ts` — Status indicator component
- `src/app/shared/connection-indicator/connection-indicator.spec.ts` — 13 unit tests
- `src/app/features/chat/chat.ts` — ChatService
- `src/app/features/chat/chat.spec.ts` — 7 unit tests
- `src/app/features/chat/chat-store.ts` — ChatStore with realtime
- `src/app/features/chat/chat-store.spec.ts` — 18 unit tests
- `src/app/features/chat/chat-room/chat-room.ts` — Chat component
- `src/app/features/chat/chat-room/chat-room.spec.ts` — 17 unit tests

**Database setup (run in Supabase SQL Editor):**

```sql
create table messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  username text not null,
  content text not null,
  created_at timestamptz default now() not null
);

alter table messages enable row level security;

create policy "Anyone can read messages"
  on messages for select to authenticated using (true);

create policy "Users can insert their own messages"
  on messages for insert to authenticated with check (auth.uid() = user_id);

alter publication supabase_realtime add table messages;
```

**Also done (post-iteration polish):**

- Fixed OAuth redirect flash on Vercel (inline script in `index.html` + deferred visibility restore in `App` constructor)
- Added DEV badge (blue `code` icon, bottom-left, non-production only)
- Added `serve:ssr:dev` npm script; changed default SSR port to 4200
- Renamed project from "angular-template" to "angular-starter"

**Tests:** 255 unit tests passing, lint clean, build clean

---

### Iteration 25a: File Uploads — Avatars ✅

**Goal:** Add file upload support using Supabase Storage, starting with profile avatars displayed in the shell header.

**Why:** File uploads are a common requirement that most apps eventually need. Adding it to the starter template demonstrates the Supabase Storage pattern and gives a working foundation for profile images and file-based features.

**What was done:**

- Created `StorageService` with upload, getPublicUrl, createSignedUrl, remove methods
- Client-side validation: max 5MB for avatars (images only), max 10MB for general attachments
- Added avatar upload to Profile page (circular preview, click to change, initials fallback)
- Added avatar display in Shell toolbar (image or initials circle next to logout button)
- Shell loads `avatar_url` and `display_name` alongside role from profiles table

**Prerequisites (Supabase SQL Editor):**

```sql
-- Create avatars bucket (public, so avatar URLs work without auth)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true);

CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can delete their own avatar"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Anyone can view avatars"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'avatars');
```

**New files:**

- `src/app/core/storage.ts` — StorageService
- `src/app/core/storage.spec.ts` — StorageService tests (14 tests)

**Modified files:**

- `src/app/core/index.ts` — export StorageService
- `src/app/features/profile/profile.ts` — avatar upload UI
- `src/app/features/profile/profile.spec.ts` — avatar tests
- `src/app/layouts/shell/shell.ts` — avatar display logic
- `src/app/layouts/shell/shell.html` — avatar in toolbar
- `src/app/layouts/shell/shell.scss` — avatar styles

**Tests:** 285 unit tests passing, lint clean, build clean

---

### Iteration 25b: Standalone Files Page ✅

**Goal:** Add a dedicated `/files` page for general file uploads, replacing the earlier note-attachments approach.

**Why:** A standalone files page is more flexible than note-attached files. Users can upload, browse, download, and delete any file — not just files tied to a specific note. This also keeps the notes feature simple (title + content only) while still showcasing Supabase Storage with private buckets and signed URLs.

**What was done:**

- Reverted note attachments: removed `NoteAttachment` interface, `attachments` field from `Note`, all attachment UI from note-form and notes-list, and storage cleanup from delete
- Created `FilesService` with list, upload, download (signed URL), and delete methods
- Created `FilesPage` component with file upload, listing grid, download, and delete with confirmation
- Added `/files` route and "Files" nav link in shell sidebar

**Prerequisites (Supabase SQL Editor):**

```sql
-- User files bucket (private)
INSERT INTO storage.buckets (id, name, public) VALUES ('user-files', 'user-files', false);

CREATE POLICY "Users can upload own files" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'user-files' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can view own files" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'user-files' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can delete own files" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'user-files' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Files metadata table
CREATE TABLE files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  size BIGINT NOT NULL,
  type TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own files" ON files FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own files" ON files FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own files" ON files FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own files" ON files FOR DELETE USING (auth.uid() = user_id);
```

Optional cleanup (if previous note-attachments SQL was run):

```sql
DELETE FROM storage.buckets WHERE id = 'note-attachments';
ALTER TABLE notes DROP COLUMN IF EXISTS attachments;
```

**New files:**

- `src/app/features/files/files.ts` — FilesService (11 tests)
- `src/app/features/files/files.spec.ts` — FilesService tests
- `src/app/features/files/files-page/files-page.ts` — FilesPage component (9 tests)
- `src/app/features/files/files-page/files-page.spec.ts` — FilesPage tests

**Reverted files (removed attachment code):**

- `src/app/features/notes/notes.ts` — removed NoteAttachment, attachments field
- `src/app/features/notes/note-form/note-form.ts` — restored simple title+content form
- `src/app/features/notes/note-form/note-form.spec.ts` — restored minimal spec
- `src/app/features/notes/notes-list/notes-list.ts` — removed badge + storage cleanup
- `src/app/features/notes/notes-list/notes-list.spec.ts` — removed storage mock + 4 tests
- `src/app/features/notes/notes.spec.ts` — removed attachments from mock
- `src/app/features/notes/notes-store.spec.ts` — removed attachments from mocks

**Modified files:**

- `src/app/app.routes.ts` — added /files route
- `src/app/layouts/shell/shell.html` — added Files nav link

**Tests:** 294 unit tests passing, lint clean, build clean

---

**Pattern**: Each iteration should end with verification that build passes and tests are green before moving to the next.
