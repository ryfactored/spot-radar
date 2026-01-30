# Angular Starter - Phase 4: Frontend Design Simplification

A lightweight redesign pass on the Angular starter template. The goal is to make the existing UI consistent, theme-aware, and clean enough to fork confidently -- without adding complexity.

---

## Current State

The app has solid bones: Material Design components, three-theme system with dark mode, responsive sidenav shell, lazy-loaded routes, and decent accessibility (skip links, ARIA labels, focus-visible). However, several areas of inconsistency and hardcoded values make it harder to re-skin for derivative projects.

---

## Iterations Overview

| #   | Iteration                                               | Scope                                                                       |
| --- | ------------------------------------------------------- | --------------------------------------------------------------------------- |
| 26  | Active route indicator on sidenav                       | `shell.html`, `shell.scss`, `shell.ts`                                      |
| 27  | Replace hardcoded colors with CSS custom properties     | `shell.scss`, `styles.scss`, `auth-layout.ts`, `landing.ts`, `profile.ts`   |
| 28  | Clean up `app.html` placeholder                         | `app.html`                                                                  |
| 29  | Standardize page header pattern                         | `shell.scss`, `dashboard.ts`, `notes-list.ts`, `chat-room.ts`, `profile.ts` |
| 30  | Improve the dashboard page                              | `dashboard.ts`                                                              |
| 31  | Use `environment.siteTitle` for all app name references | `shell.html`/`shell.ts`, `public-layout.ts`, `auth-layout.ts`               |

---

### Iteration 26: Active Route Indicator on Sidenav

**Problem:** Sidenav links in `shell.html` have no visual indicator for the current page. Users cannot tell where they are. Screen reader users also lack `aria-current="page"`.

**Changes:**

- `src/app/layouts/shell/shell.html` -- Add `routerLinkActive="active-link"` and `#rla="routerLinkActive"` to each `<a mat-list-item>`. Bind `[attr.aria-current]="rla.isActive ? 'page' : null"`.
- `src/app/layouts/shell/shell.scss` -- Add `.active-link` style with a left border accent and subtle background tint. Support dark mode variant.
- `src/app/layouts/shell/shell.ts` -- Add `RouterLinkActive` to imports.

**Done when:** Clicking a sidenav link highlights it, and the highlight persists on page load. `aria-current="page"` is set on the active item.

---

### Iteration 27: Replace Hardcoded Colors with CSS Custom Properties

**Problem:** Several components use hardcoded hex colors (`#3f51b5`, `#e0e0e0`, `#667eea`, `#f5f5f5`, etc.) that don't respond to theme changes. Switching from Default to Ocean or Forest theme, or toggling dark mode, leaves these elements unchanged.

**Changes:**

- `src/app/layouts/shell/shell.scss` -- Replace `#3f51b5` in `.skip-link` with `var(--mat-sys-primary, #3f51b5)`.
- `src/styles.scss` -- Replace `#3f51b5` in `*:focus-visible` with `var(--mat-sys-primary, #3f51b5)`. Replace `#7986cb` in `.dark-mode *:focus-visible` with `var(--mat-sys-primary, #7986cb)`.
- `src/app/layouts/auth-layout/auth-layout.ts` -- Replace `#3f51b5` title color with `var(--mat-sys-primary, #3f51b5)`. Replace `#f5f5f5` container background with `var(--mat-app-background-color, #f5f5f5)`. Replace the hardcoded white card background with `var(--mdc-elevated-card-container-color, white)` for both light and dark, collapsing the duplicate dark-mode overrides.
- `src/app/features/profile/profile.ts` -- Replace `#e0e0e0` avatar placeholder background with `var(--mat-sys-surface-variant, #e0e0e0)`. Replace `#9e9e9e` icon color with `var(--mat-sys-on-surface-variant, #9e9e9e)`. Replace `#757575` hint color with `var(--mat-sys-on-surface-variant, #757575)`.
- `src/app/features/landing/landing.ts` -- Keep the hero gradient as a deliberate brand color (document it as the customization point). Replace `#fafafa` features background and `#333` footer/text colors with CSS custom properties so dark mode works.

**Done when:** Switching between Default/Ocean/Forest themes and light/dark mode produces correct colors on every page. No hardcoded hex colors remain in component styles except the landing hero gradient (intentionally branded).

---

### Iteration 28: Clean Up `app.html` Placeholder

**Problem:** `src/app/app.html` contains ~340 lines of Angular's default scaffold (SVG logo, pill links, social links). The `app.ts` component uses an inline template with just `<router-outlet />` and a dev badge. The external template file is dead code that confuses anyone exploring the project.

**Changes:**

- `src/app/app.html` -- Delete the file entirely.
- `src/app/app.ts` -- Already uses an inline template, so confirm `templateUrl` is not referenced. The component currently uses `template:` (inline), so no change needed unless `templateUrl` is present.

**Done when:** `app.html` is deleted. The app still compiles and routes work. No reference to the file remains.

---

### Iteration 29: Standardize Page Header Pattern

**Problem:** Each feature page handles its h1 + actions differently. Dashboard has a bare h1, Notes uses a flex header div, Chat nests a title-row inside a header div, Profile has a bare h1 above a card. This inconsistency means every new page has to invent its own header layout.

**Changes:**

- `src/app/layouts/shell/shell.scss` -- Add a `.page-header` utility class: flex row, space-between, align-items center, margin-bottom 24px. Add `.page-header h1 { margin: 0; }`.
- `src/app/features/dashboard/dashboard.ts` -- Wrap h1 in `.page-header`.
- `src/app/features/notes/notes-list/notes-list.ts` -- Replace the custom `.header` class with `.page-header`. Remove the component-level `.header` style.
- `src/app/features/chat/chat-room/chat-room.ts` -- Replace the custom `.header` / `.title-row` with `.page-header`. Remove the component-level header styles.
- `src/app/features/profile/profile.ts` -- Wrap h1 in `.page-header`.

**Done when:** All four pages use the same `.page-header` pattern. Headers look consistent across Dashboard, Notes, Chat, and Profile.

---

### Iteration 30: Improve the Dashboard Page

**Problem:** The dashboard is the first thing authenticated users see, and it currently shows a bare h1, login status text, and redundant sign-in/logout buttons (already available in the toolbar). It doesn't feel like a real app.

**Changes:**

- `src/app/features/dashboard/dashboard.ts` -- Replace the current template with:
  - A `.page-header` with "Dashboard" h1 (no action buttons).
  - A welcome message using the user's email or display name.
  - A row of 3-4 quick-link cards (Notes, Chat, Files, Profile) using `mat-card` in a responsive grid. Each card has a Material icon, title, and short description. Cards link to their respective routes.
  - Remove the redundant login/logout buttons.

**Done when:** Dashboard shows a welcome greeting and quick-link cards. No redundant auth controls. The grid is responsive (stacks on mobile).

---

### Iteration 31: Use `environment.siteTitle` for All App Name References

**Problem:** "Angular Starter" is hardcoded in four places: the shell toolbar, public layout logo, auth layout title, and `index.html` page title. Forking the template requires a find-and-replace across multiple files.

**Changes:**

- `src/app/layouts/shell/shell.ts` -- Import `environment` and expose `siteTitle`. Update `shell.html` to use `{{ siteTitle }}` instead of the hardcoded string.
- `src/app/layouts/public-layout/public-layout.ts` -- Import `environment` and use `siteTitle` in the logo text.
- `src/app/layouts/auth-layout/auth-layout.ts` -- Import `environment` and use `siteTitle` in the card title.
- `index.html` -- Leave as-is (the landing component already sets the document title dynamically via `Title` service). Optionally set the fallback `<title>` to a generic value or keep it as the default.

**Done when:** Changing `environment.siteTitle` updates the app name everywhere. No hardcoded "Angular Starter" strings remain in component templates.

---

**Pattern**: Each iteration should end with verification that build passes and tests are green before moving to the next.
