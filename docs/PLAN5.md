# Angular Starter - Phase 5: Template Hardening & Completeness

**Goal**: Make this a complete, production-ready starter template that's easy to clone, understand, strip down, and extend for any new Angular + Supabase app.

**Status at start of Phase 5**: 294 unit tests, 24 e2e tests, 3 color themes, dark mode, SSR, CI/CD, full auth with OAuth, Notes/Chat/Files/Profile features, accessibility audit, theming guide.

---

## Part 1: Missing Auth Flows

The auth system handles login, register, and logout -- but every production app also needs password reset and email verification. These are table-stakes features that would have to be rebuilt in every clone.

### Iteration 39 -- Forgot Password / Reset Password

Supabase has built-in support for password reset via `resetPasswordForEmail()` and the `RECOVERY` auth event. We need two pages and a small service addition.

**Changes:**

- `src/app/features/auth/forgot-password/forgot-password.ts` -- New page with email input. Calls `supabase.auth.resetPasswordForEmail(email, { redirectTo })`. Shows success message ("Check your email") regardless of whether the email exists (prevents enumeration).
- `src/app/features/auth/reset-password/reset-password.ts` -- New page with password + confirm password fields. Uses `PasswordStrength` component. Calls `supabase.auth.updateUser({ password })`. This page is reached via the recovery link in the email.
- `src/app/core/auth.ts` -- Add `resetPassword(email)` and `updatePassword(password)` methods.
- `src/app/app.routes.ts` -- Add `/forgot-password` under AuthLayout (guestGuard) and `/reset-password` under AuthLayout (no guard -- user arrives via email link with token in URL hash).
- `src/app/features/auth/login/login.ts` -- Add "Forgot password?" link below the login form.
- Unit tests for the new auth methods.
- E2e test: navigate to forgot-password, submit email, verify success message.

**Supabase email rate limits:** The free tier limits auth emails (signup confirmation, password reset) to **2 per hour** by default. This is a project-wide limit across all email types, so a few signup + reset attempts during development will exhaust it quickly. To avoid this, configure a custom SMTP provider in **Supabase > Authentication > SMTP Settings**. Resend (free tier: 100 emails/day) works well — set host to `smtp.resend.com`, port `465`, username `resend`, password is your API key, sender is an address on your verified domain.

### Iteration 40 -- Email Verification Page

After registration, Supabase sends a confirmation email. When the user clicks the link, they land back on the app with a token. We need a page to handle that callback and show appropriate feedback.

**Changes:**

- `src/app/features/auth/verify-email/verify-email.ts` -- New page that detects the auth token from the URL, confirms the session, and shows a success message with a link to login/dashboard. Handles error state (expired/invalid link).
- `src/app/app.routes.ts` -- Add `/verify-email` route under AuthLayout (no guard).
- `src/app/features/auth/register/register.ts` -- After successful registration, show a message like "Check your email to verify your account" instead of just a generic success.
- E2e test for the verify-email page rendering (can't test the full flow without email access, but can test the error state).

---

## Part 2: Routing Gaps

### Iteration 41 -- 404 Not Found Page

There's no wildcard route. Any unknown URL silently shows a blank page. Every app needs a 404.

**Changes:**

- `src/app/features/not-found/not-found.ts` -- Simple page with empty-state-style layout: large icon, "Page not found" heading, "The page you're looking for doesn't exist or has been moved" message, "Go to Dashboard" / "Go Home" buttons (conditional on auth state).
- `src/app/app.routes.ts` -- Add `{ path: '**', component: NotFound }` as the last route. This needs to be outside any layout wrapper so it works for both authenticated and guest users. Use a minimal standalone layout or apply a simple centered layout inline.
- E2e test: navigate to `/nonexistent`, verify the 404 page renders.

### Iteration 42 -- Dynamic Page Titles

Browser tabs all show the same `siteTitle`. Each page should set its own title for UX and SEO.

**Changes:**

- `src/app/app.routes.ts` -- Add `data: { title: 'Dashboard' }` (etc.) to each route.
- `src/app/app.ts` -- Subscribe to `NavigationEnd` + `ActivatedRoute` data, set `Title.setTitle()` to `"PageTitle | SiteTitle"` or just `SiteTitle` for the landing page.
- No new components needed. Angular's built-in `Title` service handles this.
- Verify SSR renders correct `<title>` tags by checking prerendered HTML.

---

## Part 3: Polish & UX

### Iteration 43 -- Route Transition Loading Bar

When navigating between lazy-loaded routes (especially on slow connections), there's no visual feedback. A thin progress bar at the top of the page (like YouTube/GitHub) gives instant feedback.

**Changes:**

- `src/app/shared/loading-bar/loading-bar.ts` -- New component: a thin (3px) progress bar fixed to the top of the viewport. Uses `Router` events: show on `NavigationStart`, hide on `NavigationEnd`/`NavigationCancel`/`NavigationError`. Animate with CSS (`width` transition or indeterminate shimmer). Uses `--mat-sys-primary` for color.
- `src/app/layouts/shell/shell.html` -- Add `<app-loading-bar />` inside the shell (above the toolbar or inside `mat-sidenav-content`).
- `src/app/layouts/auth-layout/auth-layout.ts` -- Add `<app-loading-bar />` for auth page transitions too.
- Keep it minimal -- no third-party library, just a CSS-animated div responding to router events.

### Iteration 44 -- Reusable Avatar Component

The avatar rendering logic (image vs initials, circle shape, sizing) is duplicated between the shell toolbar and the profile page. Extract it into a shared component.

**Changes:**

- `src/app/shared/avatar/avatar.ts` -- New component with inputs: `src` (image URL or null), `name` (for initials fallback), `size` (default 32px). Renders either an `<img>` or initials text inside a circle. Handles image load errors gracefully (falls back to initials).
- `src/app/layouts/shell/shell.html` -- Replace inline avatar markup with `<app-avatar>`.
- `src/app/features/profile/profile.ts` -- Use `<app-avatar>` for the profile picture display.
- `src/app/shared/index.ts` -- Export the new component.
- Unit test for the avatar component (image rendering, initials fallback, error fallback).

### Iteration 45 -- Snackbar Position & Stacking

Currently toasts appear at the bottom-center with default Material behavior. If multiple toasts fire in quick succession, they replace each other. This is usually fine, but verify the behavior and ensure:

- Toasts don't overlap the mobile bottom of the screen
- Success/error toasts have a reasonable duration (success: 3s, error: 5s, info: 4s)
- Review whether the toast service needs a queue or if Material's default stacking is sufficient

**Changes:**

- `src/app/shared/toast.ts` -- Audit durations, positions, and behavior. Adjust if needed. This may end up being a no-op if the current behavior is already good.
- Verify on mobile viewport.

---

## Part 4: Template Reuse & Documentation

### Iteration 46 -- Feature Removal Guide

Document exactly how to cleanly strip each example feature when cloning the template. Each feature should be independently removable without breaking the rest of the app.

**Changes:**

- `docs/feature-removal.md` -- New document with sections:
  - **Notes feature**: Files to delete (`features/notes/`), routes to remove from `app.routes.ts`, sidenav link to remove from `shell.html`, dashboard card to remove from `dashboard.ts`. Supabase table (`notes`) can be skipped during schema setup.
  - **Chat feature**: Files to delete (`features/chat/`), routes, sidenav link, dashboard card. Supabase table (`messages`) and realtime subscription note.
  - **Files feature**: Files to delete (`features/files/`), routes, sidenav link, dashboard card. Supabase storage bucket (`attachments`) note.
  - **Component Test page**: Files to delete (`features/component-test/`), route, sidenav link. No backend dependency.
  - **Admin page**: Files to delete (`features/admin/`), route, conditional sidenav link. Role guard and profiles table `role` column can stay (useful) or be removed.
  - **Landing page**: Files to delete (`features/landing/`, `layouts/public-layout/`), routes. Update the default redirect for unauthenticated users to go to `/login` instead.
  - A "minimal starter" checklist: what the app looks like after removing all example features (just auth + dashboard + profile).

### Iteration 47 -- Clone & Setup Guide

A new developer cloning this repo for a new project needs clear instructions to get from "git clone" to "running app with their own Supabase project."

**Changes:**

- `docs/setup.md` -- New document covering:
  - **Quick start**: Clone, `npm install`, create Supabase project, copy URL + anon key into `environment.ts` and `environment.prod.ts`.
  - **Supabase setup**: Required tables (`profiles` with RLS policies, and any example feature tables if kept). SQL migration script or link to the schema. Auth providers configuration (Google, GitHub, etc.) with redirect URLs.
  - **Environment configuration**: What each field in `environment.ts` does. How `appName` affects localStorage keys. How to set `siteUrl` for OAuth redirects.
  - **Deployment**: How to deploy to Vercel (or other platforms). Environment variables to set in production.
  - **Customization checklist**: Rename `appName`, update `siteTitle`/`siteDescription`, swap favicon, update theme colors if desired (link to theming.md).

### Iteration 48 -- Supabase Schema Migration File

Right now there's no SQL file defining the database schema. When cloning, you'd have to reverse-engineer the schema from the service code. Add a migration file.

**Changes:**

- `supabase/migrations/001_initial_schema.sql` -- SQL file containing:
  - `profiles` table (id, email, display_name, avatar_url, bio, role, created_at, updated_at)
  - `notes` table (id, user_id, title, content, created_at, updated_at)
  - `messages` table (id, user_id, content, username, created_at)
  - `attachments` table (id, user_id, filename, storage_path, size, mime_type, created_at)
  - RLS policies for each table
  - Storage bucket creation (`avatars` public, `attachments` private)
  - Trigger for auto-creating profile on auth.users insert
- `supabase/migrations/002_example_features.sql` -- Separate file for Notes, Chat, Files tables so they're easy to skip when not needed.
- Reference these files in `docs/setup.md`.

---

## Part 5: Code Quality & Maintainability

### Iteration 49 -- Consolidate Hardcoded Strings

Audit the codebase for hardcoded UI strings that should come from a central place. Not full i18n (that's overkill for a starter), but making key strings easy to find and change.

**Changes:**

- Audit all hardcoded button labels, error messages, and placeholder text across auth pages, dashboard, and shared components.
- Ensure error messages go through `ErrorMapper` consistently.
- Ensure all page titles, descriptions, and labels that a cloner would want to customize are easy to find (either in the component or in environment/constants).
- This may be a no-op if things are already well-organized. Document findings either way.

### Iteration 50 -- Admin Placeholder Cleanup

The admin page is a static placeholder with a hardcoded gradient that doesn't use the theme system. Either make it a proper starting point or simplify it.

**Changes:**

- `src/app/features/admin/admin.ts` -- Replace the hardcoded gradient avatar icon with a theme-aware style using `var(--mat-sys-primary)`. Use the same `page-header` pattern as other pages. Keep the placeholder content but make it consistent with the rest of the app.
- Ensure the admin gradient `linear-gradient(135deg, #667eea 0%, #764ba2 100%)` is replaced with theme-aware styling.

### Iteration 51 -- Final Audit & Snapshot

Run a final review pass before considering the template complete.

**Changes:**

- Build, lint, format check, unit tests, e2e tests, Playwright visual regression.
- Update all visual regression snapshots if any UI changed.
- Update `docs/COMMANDS.md` if any new scripts were added.
- Review bundle size -- ensure it's still under the 1.6MB budget.
- Verify SSR prerender still works for all static routes.
- Smoke test: clone the repo to a temp directory, `npm install`, `npm start`, verify it works.
- Tag the release: `git tag v1.0.0`.

---

## Summary

| Iteration | Name                           | Category       |
| --------- | ------------------------------ | -------------- |
| 39        | Forgot / Reset Password        | Auth           |
| 40        | Email Verification Page        | Auth           |
| 41        | 404 Not Found Page             | Routing        |
| 42        | Dynamic Page Titles            | Routing        |
| 43        | Route Transition Loading Bar   | UX             |
| 44        | Reusable Avatar Component      | Components     |
| 45        | Snackbar Position & Stacking   | UX             |
| 46        | Feature Removal Guide          | Docs           |
| 47        | Clone & Setup Guide            | Docs           |
| 48        | Supabase Schema Migration File | Infrastructure |
| 49        | Consolidate Hardcoded Strings  | Code Quality   |
| 50        | Admin Placeholder Cleanup      | Code Quality   |
| 51        | Final Audit & Snapshot         | QA             |

**Estimated iterations**: 13 (39--51)

**What's intentionally NOT included:**

- Docker / containerization -- adds complexity without clear benefit for a starter template; deployment is straightforward with Vercel/Netlify
- i18n -- too opinionated; easy to add later with `@angular/localize` when actually needed
- Backend abstraction layer -- Supabase coupling is acceptable since it's the intended backend; the service layer already provides a natural swap point if needed
- Mobile bottom navigation -- the responsive sidenav already works well on mobile
- Push notifications / service worker -- too app-specific; better added per-project
- Advanced state management (NgRx, etc.) -- Signals are sufficient and simpler for a starter
