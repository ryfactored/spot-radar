# Theming Guide

This document explains how the theming system works, how to create new themes, and what to keep in mind when building components.

---

## Architecture Overview

The theming system has four layers:

1. **Palettes** (`src/_themes.scss`) -- Tailwind-based color maps fed into Angular Material
2. **Global styles** (`src/styles.scss`) -- Material includes, CSS custom property overrides per theme/mode, and shared polish
3. **Preferences service** (`src/app/core/preferences.ts`) -- Stores the user's chosen theme and dark/light mode, persisted to localStorage per user
4. **Root component** (`src/app/app.ts`) -- Applies `theme-{name}` and `dark-mode` classes to `<body>` via Angular effects

The cascade works like this:

```
User picks theme + mode
  -> PreferencesService stores choice (signal + localStorage)
    -> app.ts effect sets body classes: "theme-teal dark-mode"
      -> styles.scss selectors activate the matching CSS custom properties
        -> Material components + custom components render with those values
```

---

## File Map

| File | Purpose |
|------|---------|
| `src/_themes.scss` | Palette maps and `mat.m2-define-*-theme()` calls |
| `src/styles.scss` | Material includes, per-theme surface overrides, card polish, skeleton, toasts, base styles |
| `src/app/core/preferences.ts` | `PreferencesService` + `COLOR_THEMES` constant + `ColorTheme` type |
| `src/app/app.ts` | Applies `theme-{name}` and `dark-mode` to `<body>` |
| `src/app/layouts/shell/shell.scss` | Per-theme toolbar, sidenav, and active-link overrides |
| `src/app/shared/theme-picker/theme-picker.ts` | UI for switching theme and toggling dark mode |

---

## How Body Classes Work

The root `App` component uses two effects to sync the body:

```ts
// Always exactly one theme class present
effect(() => {
  const colorTheme = this.preferences.colorTheme();
  this.colorThemeClasses.forEach(t => document.body.classList.remove(`theme-${t}`));
  document.body.classList.add(`theme-${colorTheme}`);
});

// Toggle dark-mode class
effect(() => {
  const darkMode = this.preferences.darkMode();
  document.body.classList.toggle('dark-mode', darkMode);
});
```

This produces a body like:

```html
<body class="theme-teal dark-mode">
```

All theme selectors in CSS rely on these classes.

---

## CSS Selector Strategy

`styles.scss` applies themes in layers of increasing specificity:

```scss
// 1. Base: default light theme (always applied)
@include mat.all-component-themes(themes.$default-light-theme);

// 2. Dark mode fallback (1 class, default palette)
.dark-mode {
  @include mat.all-component-colors(themes.$default-dark-theme);
}

// 3. Theme-specific light overrides (2 classes via :not)
.theme-teal:not(.dark-mode) {
  @include mat.all-component-colors(themes.$teal-light-theme);
}

// 4. Theme-specific dark overrides (2 classes)
.theme-teal.dark-mode {
  @include mat.all-component-colors(themes.$teal-dark-theme);
}
```

Because `.theme-teal.dark-mode` (2 classes) has higher specificity than `.dark-mode` (1 class), theme-specific dark overrides always win.

The surface override blocks follow the same pattern. The default dark surfaces are scoped to `.theme-default.dark-mode` so they don't leak into other themes:

```scss
.theme-default.dark-mode {
  --mat-app-background-color: #110f1d;
  --mat-card-elevated-container-color: #221e3d;
  /* ... */
}

.theme-teal.dark-mode {
  --mat-app-background-color: #0e2a26;
  --mat-card-elevated-container-color: #1c4f48;
  /* ... */
}
```

The default light block uses `.theme-default:not(.dark-mode)` for the same reason.

---

## CSS Custom Properties Reference

### Material Properties (overridden per theme)

| Property | What it controls |
|----------|-----------------|
| `--mat-app-background-color` | Page background |
| `--mat-sidenav-container-background-color` | Sidenav container |
| `--mat-sidenav-content-background-color` | Main content area |
| `--mat-sidenav-container-divider-color` | Sidenav border |
| `--mat-card-elevated-container-color` | Elevated card background |
| `--mat-card-outlined-container-color` | Outlined card background |
| `--mat-card-filled-container-color` | Filled card background |
| `--mat-dialog-container-color` | Dialog background |
| `--mat-table-background-color` | Table background |
| `--mat-table-row-item-outline-color` | Table row borders |
| `--mat-paginator-container-background-color` | Paginator background |

These are consumed by Angular Material components automatically. Set them in each theme block and Material picks them up.

> **Important**: Material M2 uses `--mat-card-*` prefixed properties, NOT `--mdc-*`. The `--mdc-elevated-card-container-color` properties are defined in the stylesheet but are never read by `var()`. Always use the `--mat-card-*` form.

### Material Properties (set globally)

| Property | Value | What it controls |
|----------|-------|-----------------|
| `--mat-card-elevated-container-shape` | `12px` | Card border radius |
| `--mat-card-outlined-container-shape` | `12px` | Card border radius |
| `--mat-card-filled-container-shape` | `12px` | Card border radius |

These are set on `html` and apply to all themes.

### App-Level Properties (set per theme)

| Property | What it controls |
|----------|-----------------|
| `--app-inset-bg` | Background for "inset" content areas inside cards (demo boxes, search results, nested panels) |
| `--app-card-border-color` | Subtle border on all cards |
| `--app-card-hover-border-color` | Border color on linked card hover |

### Material Properties Available for Components

These are set by Material and available to use without needing to override them per theme:

| Property | What it provides |
|----------|-----------------|
| `--mat-sys-primary` | Theme primary color |
| `--mat-card-subtitle-text-color` | Muted text color that adapts to light/dark |
| `--mat-sys-on-surface-variant` | Variant text color from Material |

---

## Current Theme Values

### Default (Blue)

| Token | Light | Dark |
|-------|-------|------|
| Background | `#eff6ff` | `#110f1d` |
| Card | `#eff6ff` | `#221e3d` |
| Inset | `#dbeafe` | `#1a1736` |
| Card border | `#dbeafe` | `#352f58` |
| Hover border | `#93c5fd` | `#4a4478` |

### Teal

| Token | Light | Dark |
|-------|-------|------|
| Background | `#f0fdfa` | `#0e2a26` |
| Card | `#e6faf6` | `#1c4f48` |
| Inset | `#ccfbf1` | `#163d37` |
| Card border | `#b2f5ea` | `#2e8a80` |
| Hover border | `#5eead4` | `#3aa89c` |

### Slate

| Token | Light | Dark |
|-------|-------|------|
| Background | `#f8fafc` | `#0f172a` |
| Card | `#edf2f8` | `#1f3050` |
| Inset | `#dce4ef` | `#1a2842` |
| Card border | `#d0d9e5` | `#395270` |
| Hover border | `#94a3b8` | `#4e6a88` |

---

## Adding a New Theme

### Step 1: Define the palette (`src/_themes.scss`)

Add a new Tailwind-style palette map with shades 50--900 and A100--A700, plus a contrast sub-map:

```scss
$violet-palette: (
  50: #f5f3ff,
  100: #ede9fe,
  200: #ddd6fe,
  300: #c4b5fd,
  400: #a78bfa,
  500: #8b5cf6,
  600: #7c3aed,
  700: #6d28d9,
  800: #5b21b6,
  900: #4c1d95,
  A100: #ddd6fe,
  A200: #a78bfa,
  A400: #8b5cf6,
  A700: #6d28d9,
  contrast: (
    50: rgba(0, 0, 0, 0.87),
    100: rgba(0, 0, 0, 0.87),
    200: rgba(0, 0, 0, 0.87),
    300: rgba(0, 0, 0, 0.87),
    400: white,
    500: white,
    600: white,
    700: white,
    800: white,
    900: white,
    A100: rgba(0, 0, 0, 0.87),
    A200: rgba(0, 0, 0, 0.87),
    A400: white,
    A700: white,
  ),
);
```

Then define the light and dark theme objects. All themes currently share `$sky-palette` as the accent:

```scss
$violet-primary: mat.m2-define-palette($violet-palette);
$violet-accent: mat.m2-define-palette($sky-palette, A200, A100, A400);

$violet-light-theme: mat.m2-define-light-theme((
  color: (primary: $violet-primary, accent: $violet-accent),
));

$violet-dark-theme: mat.m2-define-dark-theme((
  color: (primary: $violet-primary, accent: $violet-accent),
));
```

### Step 2: Add Material includes (`src/styles.scss`)

Add both the light and dark Material color overrides:

```scss
.theme-violet.dark-mode {
  @include mat.all-component-colors(themes.$violet-dark-theme);
}

.theme-violet:not(.dark-mode) {
  @include mat.all-component-colors(themes.$violet-light-theme);
}
```

### Step 3: Add surface overrides (`src/styles.scss`)

Add two blocks -- light and dark -- setting all the custom properties. Pick colors that come from your palette and feel cohesive:

```scss
// Violet light
.theme-violet:not(.dark-mode) {
  --mat-app-background-color: #f5f3ff;
  --mat-sidenav-container-background-color: #f5f3ff;
  --mat-sidenav-content-background-color: #f5f3ff;
  --mat-sidenav-container-divider-color: #ddd6fe;
  --mat-card-elevated-container-color: #ede9fe;
  --mat-card-outlined-container-color: #ede9fe;
  --mat-card-filled-container-color: #ede9fe;
  --mat-dialog-container-color: #ede9fe;
  --mat-table-background-color: #ede9fe;
  --mat-table-row-item-outline-color: #ddd6fe;
  --mat-paginator-container-background-color: #ede9fe;
  --app-inset-bg: #ddd6fe;
  --app-card-border-color: #ddd6fe;
  --app-card-hover-border-color: #a78bfa;
}

// Violet dark
.theme-violet.dark-mode {
  --mat-app-background-color: #1a0f2e;
  --mat-sidenav-container-background-color: #1a0f2e;
  --mat-sidenav-content-background-color: #1a0f2e;
  --mat-sidenav-container-divider-color: #3b2d5e;
  --mat-card-elevated-container-color: #2d1f50;
  --mat-card-outlined-container-color: #2d1f50;
  --mat-card-filled-container-color: #2d1f50;
  --mat-dialog-container-color: #2d1f50;
  --mat-table-background-color: #2d1f50;
  --mat-table-row-item-outline-color: #4a3878;
  --mat-paginator-container-background-color: #2d1f50;
  --app-inset-bg: #231845;
  --app-card-border-color: #4a3878;
  --app-card-hover-border-color: #6b52a8;
}
```

**Color picking tips:**

- **Card background**: Use palette shade 50--100 for light, a dark tinted version for dark
- **Inset background**: One step darker than card in light (100--200), one step darker in dark
- **Card border**: Match the inset color in light; a mid-tone in dark
- **Hover border**: A vivid mid-range shade (300--400)
- **App background**: Same as card or one shade lighter for light; the darkest tinted value for dark

### Step 4: Add shell overrides (`src/app/layouts/shell/shell.scss`)

Add `:host-context()` blocks for your theme's light and dark modes:

```scss
// Violet light
:host-context(.theme-violet:not(.dark-mode)) mat-sidenav {
  background-color: #ede9fe;
  border-right-color: #ddd6fe;
}

:host-context(.theme-violet:not(.dark-mode)) .active-link {
  background: color-mix(in srgb, #8b5cf6 14%, transparent);
}

// Violet dark
:host-context(.theme-violet.dark-mode) .toolbar {
  background-color: #2d1f50;
  color: #f5f3ff;
  border-bottom: 1px solid #3b2d5e;
}

:host-context(.theme-violet.dark-mode) mat-sidenav {
  background-color: #150d28;
  border-right-color: #3b2d5e;
}

:host-context(.theme-violet.dark-mode) .toolbar-avatar {
  background: rgba(255, 255, 255, 0.12);
}

:host-context(.theme-violet.dark-mode) .active-link {
  background: color-mix(in srgb, #a78bfa 24%, transparent);
}
```

### Step 5: Register in preferences (`src/app/core/preferences.ts`)

Add the new entry to `COLOR_THEMES`:

```ts
export const COLOR_THEMES = [
  { value: 'default', label: 'Default', colors: { primary: '#3b82f6', accent: '#38bdf8' } },
  { value: 'teal', label: 'Teal', colors: { primary: '#14b8a6', accent: '#38bdf8' } },
  { value: 'slate', label: 'Slate', colors: { primary: '#475569', accent: '#38bdf8' } },
  { value: 'violet', label: 'Violet', colors: { primary: '#8b5cf6', accent: '#38bdf8' } },
] as const;
```

That's it. The `ColorTheme` type is derived from this array, `app.ts` reads from it to manage body classes, and the theme picker iterates it to render options. No other registration is needed.

---

## Building Theme-Aware Components

### Use CSS custom properties, not hardcoded colors

For muted/secondary text, use Material's subtitle color:

```scss
// Good
color: var(--mat-card-subtitle-text-color, #666);

// Bad
color: #666;
```

For inset/nested backgrounds (a content area inside a card, a code block, a result panel):

```scss
// Good
background: var(--app-inset-bg, #f5f5f5);

// Bad
background: #f5f5f5;
```

For semi-transparent overlays that should match the card surface:

```scss
// Good
background: color-mix(in srgb, var(--mat-card-elevated-container-color, white) 85%, transparent);

// Bad
background: rgba(255, 255, 255, 0.85);
```

### Use `:host-context(.dark-mode)` only when necessary

If a CSS custom property already adapts (like `--mat-card-subtitle-text-color`), you don't need a separate dark-mode rule. Only add `:host-context(.dark-mode)` when you genuinely need a different value that no existing variable provides:

```scss
// Unnecessary -- the variable already adapts
.text { color: var(--mat-card-subtitle-text-color, #666); }
:host-context(.dark-mode) .text { color: #aaa; }  // Delete this

// Necessary -- rgba hover highlights need different opacity
.row:hover { background: rgba(0, 0, 0, 0.04); }
:host-context(.dark-mode) .row:hover { background: rgba(255, 255, 255, 0.04); }
```

### Use `color-mix()` for theme-tinted backgrounds

When you need a background that's "a hint of the primary color", use `color-mix()` with `--mat-sys-primary`:

```scss
.highlight {
  background: color-mix(in srgb, var(--mat-sys-primary, #3b82f6) 12%, transparent);
}
```

This automatically adapts to whatever theme is active.

### Semantic colors are fine as hardcoded values

Status indicators (green for success, red for error, amber for warning) are semantic and don't need to change with the theme:

```scss
// These are fine hardcoded
.status-success { color: #4caf50; }
.status-error { color: #f44336; }
.status-warning { color: #ff9800; }
```

### Social/brand buttons need dark-mode hover variants

Dark borders (like `#333` for GitHub) are invisible on dark backgrounds. Add a `:host-context(.dark-mode)` override with a light border:

```scss
.github:hover { border-color: #333; }
:host-context(.dark-mode) .github:hover { border-color: #e6edf3; }
```

### Skeleton and loading states

Use the global `.skeleton-overlay` class for form/page-level skeleton states. It handles both light and dark modes. For individual skeleton elements, use the `<app-skeleton>` component which also adapts.

---

## Checklist for New Components

Before finishing a new component, check:

- [ ] No hardcoded `#666`, `#aaa`, `#333`, or similar grays for text -- use `var(--mat-card-subtitle-text-color, #666)` or another Material variable
- [ ] No hardcoded `#f5f5f5`, `#fafafa`, `#333`, `#1e1e1e` for backgrounds -- use `var(--app-inset-bg)` or `var(--mat-card-elevated-container-color)`
- [ ] If using `rgba(0,0,0,...)` for hover/overlay, add a `:host-context(.dark-mode)` variant with `rgba(255,255,255,...)`
- [ ] If the component renders inside a card, its backgrounds should use `--app-inset-bg` (one step darker/lighter than the card)
- [ ] If the component has borders that are dark-colored, verify they're visible in dark mode
- [ ] No use of `.dark-theme` class -- the correct class is `.dark-mode`

---

## Pages Outside the Theme System

The **landing page** and **auth layout** are intentionally hardcoded to a dark aesthetic. They sit outside the shell and are seen before login, so they use fixed dark backgrounds (`#121215` / `#1e1e22`) and don't respond to the theme picker. They do pick up `--mat-sys-primary` for accent color, so the primary color still adapts if the user has a stored theme preference.

---

## Persistence

Preferences are stored in localStorage under the key:

```
{appName}:preferences:{userId}
```

Guests (unauthenticated users) get the defaults (`colorTheme: 'default'`, `darkMode: true`) and their preferences are not persisted. On login, stored preferences are loaded for that user. On logout, preferences reset to defaults.
