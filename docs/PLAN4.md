# Angular Starter - Phase 4: Frontend Design Polish

A two-part redesign pass on the Angular starter template. Part 1 (iterations 26-31) cleaned up consistency, theme-awareness, and dead code. Part 2 (iterations 32-38) modernizes the visual feel -- moving away from stock Angular Material defaults toward a more contemporary look, while keeping changes CSS-focused and easy to re-skin for derivative projects.

---

## Current State

After Part 1, the app is consistent: CSS custom properties for all colors, standardized page headers, centralized site title, clean dashboard, and active-link indicators. Part 2 builds on this foundation with visual polish.

---

## Iterations Overview

| #   | Iteration                                               | Scope                                                                       |
| --- | ------------------------------------------------------- | --------------------------------------------------------------------------- |
| 26  | Active route indicator on sidenav                       | `shell.html`, `shell.scss`, `shell.ts`                                      |
| 27  | Replace hardcoded colors with CSS custom properties     | `shell.scss`, `styles.scss`, `auth-layout.ts`, `landing.ts`, `profile.ts`   |
| 28  | Clean up `app.html` placeholder                         | `app.html`                                                                  |
| 29  | Standardize page header pattern                         | `shell.scss`, `dashboard.ts`, `notes-list.ts`, `chat-room.ts`, `profile.ts` |
| 30  | Improve the dashboard page                              | `dashboard.ts`                                                              |
| 31  | Use `environment.siteTitle` for all app name references | `shell.html`/`shell.ts`, `public-layout.ts`, `auth-layout.ts`              |
| 32  | Swap font to Inter                                      | `index.html`, `styles.scss`                                                 |
| 33  | Refresh theme palettes with custom colors               | `_themes.scss`, `theme-picker.ts`, `landing.ts`                             |
| 34  | Softer card radius and consistent hover elevation       | `styles.scss`                                                               |
| 35  | Pill-style sidenav active indicator                     | `shell.scss`                                                                |
| 36  | Smooth theme and dark-mode transitions                  | `styles.scss`                                                               |
| 37  | Subtle button press feedback                            | `styles.scss`                                                               |
| 38  | Auth card glassmorphism                                 | `auth-layout.ts`                                                            |

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

## Part 2: Modern Visual Polish

---

### Iteration 32: Swap Font to Inter

**Problem:** Roboto is the default Angular Material font. It's clean but instantly signals "stock Material app." Inter is a modern geometric sans-serif (used by Vercel, Linear, GitHub) with better number legibility and a more contemporary feel. It's a drop-in swap.

**Changes:**

- `src/index.html` -- Replace the Google Fonts `Roboto` link with `Inter` (weights 300, 400, 500, 600).
- `src/styles.scss` -- Update the `font-family` on `html, body` to `Inter, system-ui, -apple-system, sans-serif`.
- `src/_themes.scss` -- Update the M2 typography config to use Inter: `mat.m2-define-typography-config($font-family: 'Inter, system-ui, -apple-system, sans-serif')`.

**Done when:** All text renders in Inter. Material components (buttons, form fields, toolbar) pick up the new font through the typography config. Fallback to system-ui if Inter fails to load.

---

### Iteration 33: Refresh Theme Palettes with Custom Colors

**Problem:** The three themes use Material's stock M2 palettes -- Indigo/Pink, Blue/Teal, Green/Amber. These are the most recognizable "default Angular" colors. Every Angular demo app uses them.

**Changes:**

- `src/_themes.scss` -- Replace stock palettes with custom `m2-define-palette` maps using more distinctive hues:
  - **Default** -- Slate blue primary (`#6366f1`, similar to Tailwind's indigo-500) with a warm rose accent (`#f43f5e`). Build a custom palette map with 50-900 shades + A100-A700.
  - **Ocean** -- Deep cyan primary (`#0891b2`) with a sky accent (`#38bdf8`). Cooler and more distinctive than stock `$m2-blue-palette`.
  - **Forest** -- Emerald primary (`#059669`) with a lime accent (`#84cc16`). Richer than stock `$m2-green-palette`.
- `src/app/shared/theme-picker/theme-picker.ts` -- Update the `colors` preview dots to match the new primary/accent hex values.
- `src/app/features/landing/landing.ts` -- Update the hero gradient to use the new default primary color range (e.g. `#6366f1` to `#a855f7`) so the landing page matches the refreshed default theme.

**Done when:** Each theme has a visually distinct, modern palette that doesn't look like stock Angular Material. The theme picker dots reflect the new colors. Dark mode variants derive correctly from the same custom palettes.

---

### Iteration 34: Softer Card Radius and Consistent Hover Elevation

**Problem:** Cards use Material's default 4px border-radius, which feels flat and dated. Only dashboard cards have hover shadows; notes and files cards don't respond to hover at all.

**Changes:**

- `styles.scss` -- Add a global `mat-card` override: `border-radius: 12px` and a hover transition (`transition: box-shadow 0.2s ease, transform 0.2s ease`). On hover, apply `box-shadow: 0 4px 12px rgba(0,0,0,0.1)` and `transform: translateY(-2px)`.
- Remove the per-component hover shadow from `dashboard.ts` (now handled globally).

**Done when:** All `mat-card` elements across the app have 12px radius and a subtle lift-on-hover. The effect is consistent on dashboard, notes, files, and profile pages.

---

### Iteration 35: Pill-Style Sidenav Active Indicator

**Problem:** The current active-link style uses a 3px left border, which is functional but feels like a dated sidebar pattern. Modern apps (Google, Notion, Linear) use a rounded pill/highlight background.

**Changes:**

- `src/app/layouts/shell/shell.scss` -- Replace the `.active-link` left-border style with a pill-shaped background: `border-radius: 8px`, `margin: 2px 8px`, `background: color-mix(in srgb, var(--mat-sys-primary) 12%, transparent)`. Remove the `border-left`. Adjust the dark-mode variant to use `16%` opacity instead.

**Done when:** Active sidenav item has a rounded, tinted background pill instead of a left border. The effect adapts to all three themes and both light/dark modes.

---

### Iteration 36: Smooth Theme and Dark-Mode Transitions

**Problem:** Toggling dark mode or switching color themes causes an instant color snap across the entire UI. This feels abrupt.

**Changes:**

- `src/styles.scss` -- Add a transition rule to `body`: `transition: background-color 0.3s ease, color 0.3s ease`. Add similar transitions to `mat-toolbar`, `mat-sidenav`, `mat-card`, and `mat-sidenav-container` so surfaces animate smoothly.

**Done when:** Toggling dark mode or switching themes produces a smooth 300ms color crossfade instead of an instant snap. No layout shift or flicker during the transition.

---

### Iteration 37: Subtle Button Press Feedback

**Problem:** Buttons have Material's ripple effect but no physical feedback. They feel flat compared to modern UIs that give tactile "press" cues.

**Changes:**

- `src/styles.scss` -- Add a global rule for `[mat-raised-button]:active, [mat-fab]:active, [mat-flat-button]:active`: `transform: scale(0.97)` with `transition: transform 0.1s ease`. This gives a quick "push in" feel on click without affecting layout.

**Done when:** Raised buttons, FABs, and flat buttons compress slightly on press. The effect is subtle (3% scale) and fast (100ms). Ripple effect continues to work alongside it.

---

### Iteration 38: Auth Card Glassmorphism

**Problem:** The auth card (login/register) is a plain white box on a flat background. It looks functional but not distinctive.

**Changes:**

- `src/app/layouts/auth-layout/auth-layout.ts` -- Update the `.auth-card` styles:
  - Background: `rgba(255, 255, 255, 0.8)` (light mode) to make it semi-transparent.
  - Add `backdrop-filter: blur(12px)` and `-webkit-backdrop-filter: blur(12px)` for the frosted glass effect.
  - Update the `.auth-container` background to a subtle gradient (using the primary color at low opacity) so the blur has something to work against.
  - Dark mode: `rgba(30, 30, 30, 0.8)` background with the same blur.
- Add a `:host-context(.dark-mode)` override for the darker glass tint.

**Done when:** The login/register card has a frosted glass appearance over a subtle gradient background. The effect degrades gracefully (solid background if `backdrop-filter` is unsupported). Works in both light and dark mode.

---

**Pattern**: Each iteration should end with verification that build passes and tests are green before moving to the next.

---

## Maintenance Guide

### Forking this template for a new project

When cloning this starter for a new app, these are the files to customize:

1. **App name** -- Change `siteTitle` in both `src/environments/environment.ts` and `environment.prod.ts`. This propagates to the toolbar, auth layout, and public layout automatically. Also update `<title>` in `src/index.html` (the static fallback).

2. **Theme colors** -- Edit `src/_themes.scss`. Each theme is a pair of custom palette maps (primary + accent) with shades 50-900, A100-A700, and contrast values. Change the hex values in the palette maps. Then update the preview dots in `src/app/shared/theme-picker/theme-picker.ts` to match your new primary/accent 500 values. If you add or remove themes, also update the `ColorTheme` type in `src/app/core/preferences.ts` and the `themes` array in `theme-picker.ts`.

3. **Landing page brand colors** -- The hero gradient in `src/app/features/landing/landing.ts` is intentionally hardcoded (not theme-reactive) so it serves as the brand landing. Update the two `linear-gradient` values (hero background and feature icon background) to match your new default primary.

4. **Font** -- To swap Inter for another font, change the Google Fonts `<link>` in `src/index.html`, the `font-family` in `src/styles.scss`, and the `$custom-typography` config in `src/_themes.scss`. All three must match.

5. **Supabase** -- Update `supabaseUrl` and `supabaseAnonKey` in both environment files. Update `socialProviders` to match your Supabase project's enabled auth providers.

### Key architecture decisions

- **CSS custom properties for theming** -- Components use `var(--mat-sys-primary)`, `var(--mat-app-background-color)`, etc. with fallback values. This means components respond to theme changes without `:host-context` overrides. When adding new components, prefer `var(--mat-sys-*)` over hardcoded colors.

- **`@env` path alias** -- All environment imports use `import { environment } from '@env'` instead of relative paths. This alias is defined in `tsconfig.json` under `paths`.

- **`@core`, `@shared`, `@layouts` barrel imports** -- Services, shared components, and layouts are re-exported through barrel files. Use these aliases in imports rather than deep relative paths.

- **Shell-scoped utility classes** -- `.page-header` is defined in `shell.scss` (not encapsulated by Angular) so it's available to all child components rendered inside the shell. New utility classes for authenticated pages should be added here.

- **M2 theming (not M3)** -- The app uses Angular Material's M2 API (`m2-define-palette`, `m2-define-light-theme`, etc.). M3 migration would require a different palette format and theme structure. The custom palette maps in `_themes.scss` follow the M2 shape: keys 50-900, A100-A700, plus a `contrast` sub-map.

### Adding a new theme

1. Create two new palette maps in `_themes.scss` (primary and accent) following the existing pattern. Each needs 14 color shades and a `contrast` map.
2. Define light and dark theme variables using `mat.m2-define-light-theme()` / `mat.m2-define-dark-theme()`.
3. Add `@include mat.all-component-colors()` rules in `styles.scss` for both `.theme-<name>:not(.dark-mode)` and `.theme-<name>.dark-mode`.
4. Add the theme value to the `ColorTheme` union type in `src/app/core/preferences.ts`.
5. Add an entry to the `themes` array in `src/app/shared/theme-picker/theme-picker.ts` with preview dot colors.

### Adding a new sidenav route

1. Add the route to `src/app/app.routes.ts` (lazy-loaded inside the shell children).
2. Add a `<a mat-list-item>` block in `src/app/layouts/shell/shell.html` following the existing pattern: `routerLink`, `routerLinkActive="active-link"`, unique `#rla` template ref, and `[attr.aria-current]` binding.
3. Optionally add a quick-link card in `src/app/features/dashboard/dashboard.ts`.

### Adding a new page inside the shell

1. Create the component under `src/app/features/<name>/`.
2. Use `<div class="page-header"><h1>Page Title</h1></div>` as the first element for consistent header spacing.
3. Use `var(--mat-sys-*)` CSS custom properties for any colors. Avoid hardcoded hex values.
4. Use `appearance="outline"` on form fields, `mat-raised-button` for primary actions, and `mat-button` for secondary actions to match existing conventions.

### CSS custom properties reference

These are the most commonly used properties, set automatically by Angular Material's theme system:

| Property | Usage |
|---|---|
| `--mat-sys-primary` | Primary theme color (buttons, links, accents) |
| `--mat-sys-on-primary` | Text/icon color on primary backgrounds |
| `--mat-sys-primary-container` | Lighter primary tint (chat bubbles, highlights) |
| `--mat-sys-surface-variant` | Subtle surface color (placeholders, dividers) |
| `--mat-sys-on-surface-variant` | Secondary text color (hints, captions, timestamps) |
| `--mat-app-background-color` | Page/app background |
| `--mat-app-text-color` | Default text color |
| `--mdc-elevated-card-container-color` | Card background color |
