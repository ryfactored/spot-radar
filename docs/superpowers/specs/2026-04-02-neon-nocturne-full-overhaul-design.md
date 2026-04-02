# Neon Nocturne Full App Overhaul

**Date:** 2026-04-02

## Problem

The app has a functional but generic Material Design look. The releases feed received a partial Neon Nocturne treatment, but it clashes with the untouched shell, auth pages, landing page, and other screens. The filter bar looks like a settings panel and takes up too much space. The user wants a complete visual transformation matching the "Sonic Gallery" design system.

## Design Reference

- Design system: `docs/stitch/DESIGN.md` (updated "Sonic Gallery" version)
- Reference HTML: `docs/stitch/stitch_expanded/code.html`
- Reference screenshot: `docs/stitch/stitch_expanded/screen.png`

## Design Principles

These apply to every surface in the app:

- **No 1px borders** for sectioning — use background color shifts between `surface` tiers only
- **Plus Jakarta Sans** everywhere — 800 weight with tight tracking (-0.02em) for headlines, regular weight for body/labels
- **Surface hierarchy**: base `#0e0e11`, container `#19191d`, container-high `#1f1f23`, container-highest `#25252a`
- **Text colors**: on-surface `#f0edf1` (never pure white), on-surface-variant `#acaaae`, outline `#767579`
- **Primary accent**: `#ba9eff` (violet), dim `#8553f3`
- **Secondary**: `#c08cf7` (lighter violet)
- **Tertiary**: `#ff97b5` (electric pink — used for "In Library" source chip)
- **Glassmorphism** for floating elements: `rgba(25, 25, 29, 0.6)` + `backdrop-filter: blur(24px)`
- **Signature gradient** for primary CTAs: `linear-gradient(135deg, #ba9eff, #8553f3)` with black text
- **Ghost borders** only when needed: `outline-variant` (`#48474b`) at 15% opacity
- **Atmospheric shadows**: primary color at 6% opacity with 40px blur for floating elements
- **Album art**: `border-radius: 0.5rem`, hover `scale(1.05)` with 700ms transition
- **No player bar** — Spot Radar links to Spotify, doesn't play audio

---

## 1. App Shell

**Files:** `src/app/layouts/shell/shell.ts`, `src/app/layouts/shell/shell.scss`

### Sidebar (256px, persistent)

- Background: `#19191d` (surface-container), no right border
- Ambient shadow: `box-shadow: 40px 0 40px rgba(186, 158, 255, 0.06)` for violet glow bleed
- **Logo area** (top): gradient icon (32px circle, primary gradient) + "Spot Radar" in Plus Jakarta Sans 800, 16px, tight tracking + "New Releases" subtitle in primary violet, 8px uppercase, 0.2em letter-spacing
- **Nav links**: icon + label, vertical stack with 2px gap between items
  - Active: `rgba(186, 158, 255, 0.08)` background, primary text, `border-radius: 0.75rem`, `scale(1.05)` slight bump
  - Inactive: `#938f99` text (muted), hover transitions to primary
  - Icon style: Material Symbols Outlined, 24px
  - Label: Plus Jakarta Sans, 13px, 600 weight
- **User card** (bottom, `margin-top: auto`): surface-container-high rounded card with avatar (40px circle) + name + role text
- Mobile: existing overlay behavior, styled to match

### Top Bar (fixed, transparent)

- `background: transparent`, `backdrop-filter: blur(24px)` (blur kicks in on scroll)
- Width: `calc(100% - 256px)`, offset by sidebar
- Height: 80px, padding 0 48px
- **Left**: glass search input — `surface-container-highest` at 40% opacity, `border-radius: 0.25rem` (sharp/technical per design system), placeholder text in outline color. Cosmetic only — not functional yet.
- **Right**: notification icon (with primary dot indicator) + avatar icon. Both in outline color, hover to primary.

### Content Area

- Background: `#0e0e11` (base)
- Padding: 112px top (below fixed top bar), 48px horizontal
- No max-width constraint — content stretches to fill
- Remove the 1px bottom border from the current toolbar

---

## 2. Feed Page — Header & Filters

**Files:** `src/app/features/releases/releases-feed/releases-feed.ts`, `src/app/features/releases/feed-filter-bar.ts`

### Header

- "Curated Discovery" label: primary violet, 13px, 700 weight, `letter-spacing: 0.3em`, uppercase
- "Your Feed" title: Plus Jakarta Sans, ~3.5rem (56px), 800 weight, `letter-spacing: -0.02em`, `#f0edf1`
- Subtitle: "The latest releases from your artists" in on-surface-variant, 18px, 500 weight
- Layout: header left-aligned, filter pills right-aligned in the same row (flex, space-between)

### Compact Filter Pills

- Only non-default active filters appear as small pill badges
- Pill style: `rgba(186, 158, 255, 0.12)` background, primary text, 9px, 700 weight, uppercase, `border-radius: 1rem`, `padding: 5px 12px`
- A tune/filter icon button at the end (28px circle, `surface-container-high`, outline icon) opens the full filter panel
- The filter panel opens as a glass overlay/dropdown anchored to the tune button:
  - Glassmorphism: `rgba(25, 25, 29, 0.85)` + `backdrop-filter: blur(24px)`
  - Contains: release type toggles, source filter toggles, min tracks select, recency select, hide live toggle, mark all seen button, sync split button
  - Material components restyled via CSS variable overrides to match dark palette
  - Dismissed on backdrop click or Escape

### Grid Layout

- CSS grid, 12 columns, `gap: 40px` (generous per design system)
- First non-dismissed new release: featured card spanning `col-span-8` with 16:9 aspect ratio
- Second release: `col-span-4` with square art
- Remaining releases: `col-span-4` each (3 per row)
- Section labels ("X new since..." / "Previously seen"): primary text for new, outline for seen, uppercase tiny label with no divider line
- "Explore Archives" footer: outline-border button, centered, with editorial italic tagline below

---

## 3. Release Cards

**File:** `src/app/features/releases/release-card.ts`

### Standard Card (magazine style)

- **No background container** at rest — art + metadata float on the page surface
- On hover: card area gains subtle `surface-container-highest` background transition
- **Album art**: square, `border-radius: 0.5rem`, `overflow: hidden`, hover `scale(1.05)` 700ms transition, `margin-bottom: 1.5rem`
- **Hover overlay on art**: `rgba(0, 0, 0, 0.4)` with centered gradient play button (links to Spotify)
- **Dismiss**: "x" icon in glass circle, top-right corner of art, visible on hover only
- **Title**: Plus Jakarta Sans, 17px, 700 weight, tight tracking
- **Type chip** (non-albums): primary at 10% opacity background, primary text, 8px uppercase
- **Artist row**: artist name in on-surface-variant 13px + source chip inline
  - "Following": outline color (`#767579`), plain text, uppercase 9px
  - "In Library": tertiary color (`#ff97b5`), dotted underline, clickable (opens popover)
- **Bottom row**: date in outline color (11px) + "SPOTIFY" link in primary, uppercase, 9px, wide letter-spacing
- Track count badge: remove (the art + metadata are sufficient)

### Featured Card (8-column hero)

- `featured = input(false)` on the component
- Art: 16:9 aspect ratio, full-width, gradient overlay from bottom
- "Featured Release" chip: primary background, black text, uppercase, `border-radius: 2px` (sharp)
- Title: 40px+ 800 weight
- Artist: primary color, 18px
- CTA: gradient "Listen on Spotify" button + glass heart/dismiss buttons
- Release time: "Released 2 hours ago" in on-surface-variant

### Collapsed Card

**File:** `src/app/features/releases/release-card-collapsed.ts`

- No background, 40% opacity
- Small thumb (36px, 4px radius) + title + artist/date
- Hover: opacity increases to 0.7, subtle translateY(-1px)

### Skeleton

**File:** `src/app/features/releases/release-card-skeleton.ts`

- Matches standard card shape: square art placeholder + text bars below
- `surface-container-high` background for shimmer elements
- No container background (matches the "no background" card design)

---

## 4. Saved Albums Popover

**Files:** `src/app/features/releases/saved-albums-popover.ts`, `src/styles.scss`

- Panel class: glassmorphism — `rgba(25, 25, 29, 0.85)` + `backdrop-filter: blur(24px)`, `border-radius: 1rem`, atmospheric primary shadow
- Header: primary color, uppercase, wide letter-spacing
- Album rows: 32px rounded art, name in on-surface, year in outline, Spotify link icon in primary
- Empty state: on-surface-variant text

---

## 5. Sync Indicator

**File:** `src/app/features/releases/sync-indicator.ts`

- Glass container: `rgba(25, 25, 29, 0.6)` + blur
- Progress bar: override to use primary gradient
- Text: on-surface-variant, Plus Jakarta Sans
- Subtle primary glow: `box-shadow: 0 0 24px rgba(186, 158, 255, 0.08)`

---

## 6. Landing Page

**File:** `src/app/features/landing/landing.ts`

- Background: `#0e0e11` with animated violet gradient orbs (existing pattern, update colors)
- Hero: Plus Jakarta Sans 800, `letter-spacing: -0.02em`, gradient CTA buttons
- Feature cards: `surface-container` background, no borders, primary gradient icon badges (32px circle), hover `scale(1.02)`
- Footer: no top border (violates no-line rule), use tonal shift instead — `surface-container-low` background section
- Text: on-surface `#f0edf1`, muted text in on-surface-variant

---

## 7. Auth Pages

**Files:** `src/app/layouts/auth-layout/auth-layout.ts`, `src/app/features/auth/auth-form-styles.ts`, login/register/forgot-password/reset-password components

- Auth layout background: `#0e0e11` with two radial gradient orbs (primary at 8-12% opacity)
- Auth card: glassmorphism — `rgba(25, 25, 29, 0.8)` + `backdrop-filter: blur(24px)`, `border-radius: 0.75rem`, no hard border (ghost border at 15% if needed)
- App title: primary color, Plus Jakarta Sans 700
- Form fields: override Material outlined appearance — ghost borders (`outline-variant` at 15%), on-surface input text, outline placeholder text
- Submit buttons: signature gradient, black text, `border-radius: 0.5rem`
- Social login buttons: glass-style — `surface-container-highest` at 40% opacity
- Links: primary color, no underline, underline on hover

---

## 8. Dashboard

**File:** `src/app/features/dashboard/dashboard.ts`

- Greeting: Plus Jakarta Sans 800, tight tracking, same editorial header treatment
- Quick-link cards: magazine card style (no background at rest, surface-container-highest on hover), primary icon, title + description
- Grid: `repeat(auto-fill, minmax(280px, 1fr))`

---

## 9. Profile

**File:** `src/app/features/profile/profile.ts`

- Section cards: glassmorphism containers instead of Material cards — `rgba(25, 25, 29, 0.6)` + blur
- Avatar: gradient ring border (`3px solid` with primary gradient via `border-image` or wrapper div)
- Form fields: same ghost-border override as auth pages
- Danger zone: `rgba(255, 110, 132, 0.06)` tint background instead of red border, error-dim text for title
- Buttons: gradient primary for save, ghost style for secondary actions

---

## 10. Global Styles & Design Tokens

**Files:** `src/index.html`, `src/styles/_design-tokens.scss`, `src/styles.scss`

- **Fonts**: Replace Inter with `Plus Jakarta Sans:wght@400;500;600;700;800` (single font throughout — the updated Stitch uses Plus Jakarta Sans for everything, no Manrope)
- **Design tokens**: `--font-body` and `--font-headline` both set to `'Plus Jakarta Sans', sans-serif`
- **Global overrides**: Update all Material component background overrides to use Neon Nocturne surface colors in dark mode
- **Popover panel**: glassmorphism as described in section 4
- **Filter overlay panel**: new global class `.filter-panel-overlay` with glassmorphism

---

## Out of Scope

- Search functionality (search bar is cosmetic placeholder)
- Audio playback / player bar
- Date jumper navigation (the Stitch reference shows this but our data model is filter-based, not date-based)
- Admin page content redesign (just restyle containers)
- Notes, Chat, Files pages (feature-flagged off)

---

## Constraints

- Keep all existing functionality, routing, guards, and data flow unchanged
- Keep Material component imports — restyle via CSS variable overrides
- Keep all test files unchanged — this is a visual-only change
- `standalone: true` remains implicit (Angular 19+ default)
