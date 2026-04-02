# Neon Nocturne Full App Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the entire Spot Radar app from generic Material Design to the "Sonic Gallery" Neon Nocturne aesthetic — deep obsidian surfaces, violet accents, glassmorphism, editorial typography, and magazine-style card layouts.

**Architecture:** This is a visual-only overhaul across ~15 files. No business logic, data flow, routing, or test files change. Each task reskins one logical area (shell, feed, cards, auth, etc.) and can be verified independently with `npm run build`. All tasks use the same design tokens: Plus Jakarta Sans font, `#0e0e11` base, `#19191d` container, `#ba9eff` primary, `#ff97b5` tertiary, glassmorphism for floating elements.

**Tech Stack:** Angular 21 (inline templates/styles), Angular Material (restyled via CSS variable overrides), CSS custom properties, Google Fonts

---

## File Structure

| Action | Path                                                       | Responsibility                                  |
| ------ | ---------------------------------------------------------- | ----------------------------------------------- |
| Modify | `src/index.html`                                           | Font links                                      |
| Modify | `src/styles/_design-tokens.scss`                           | Global design tokens                            |
| Modify | `src/styles.scss`                                          | Global overrides, popover panel, filter overlay |
| Modify | `src/app/layouts/shell/shell.ts`                           | Sidebar + top bar template                      |
| Modify | `src/app/layouts/shell/shell.scss`                         | Shell styles                                    |
| Modify | `src/app/features/releases/feed-filter-bar.ts`             | Compact pills + overlay panel                   |
| Modify | `src/app/features/releases/releases-feed/releases-feed.ts` | Editorial grid layout + header                  |
| Modify | `src/app/features/releases/release-card.ts`                | Magazine card + featured hero                   |
| Modify | `src/app/features/releases/release-card-collapsed.ts`      | Dismissed card restyle                          |
| Modify | `src/app/features/releases/release-card-skeleton.ts`       | Skeleton restyle                                |
| Modify | `src/app/features/releases/sync-indicator.ts`              | Glass indicator                                 |
| Modify | `src/app/features/releases/saved-albums-popover.ts`        | Popover inner styles                            |
| Modify | `src/app/layouts/auth-layout/auth-layout.ts`               | Auth wrapper restyle                            |
| Modify | `src/app/features/auth/auth-form-styles.ts`                | Shared auth form styles                         |
| Modify | `src/app/features/landing/landing.ts`                      | Landing page restyle                            |
| Modify | `src/app/layouts/public-layout/public-layout.ts`           | Public nav restyle                              |
| Modify | `src/app/features/dashboard/dashboard.ts`                  | Dashboard restyle                               |
| Modify | `src/app/features/profile/profile.ts`                      | Profile page restyle                            |

---

### Task 1: Global Design Tokens & Fonts

Update the foundational design tokens and font imports so all subsequent tasks can reference them.

**Files:**

- Modify: `src/index.html`
- Modify: `src/styles/_design-tokens.scss`
- Modify: `src/styles.scss`

- [ ] **Step 1: Update font import in index.html**

In `src/index.html`, the font link already loads Plus Jakarta Sans and Manrope. The updated Stitch reference uses Plus Jakarta Sans for everything (body, headline, labels). Update the font link to only load Plus Jakarta Sans if Manrope is no longer needed, or keep both — the key change is in the design tokens.

No change needed to index.html — fonts are already loaded.

- [ ] **Step 2: Update design tokens in `_design-tokens.scss`**

In the `:root` block, update:

```scss
// Change these lines:
--font-body: 'Manrope', system-ui, sans-serif;
--font-headline: 'Plus Jakarta Sans', sans-serif;

// To:
--font-body: 'Plus Jakarta Sans', sans-serif;
--font-headline: 'Plus Jakarta Sans', sans-serif;
```

- [ ] **Step 3: Update dark mode default colors in `_design-tokens.scss`**

In the `.theme-default.dark-mode` block, update the semantic tokens to use Neon Nocturne colors:

```scss
.theme-default.dark-mode,
.dark-mode:not(.theme-teal):not(.theme-slate) {
  --color-dark-bg: #0e0e11;
  --color-dark-surface: #19191d;
  --color-dark-border: #48474b;
  --color-dark-border-hover: #767579;
  --color-dark-inset: #1f1f23;
  --color-dark-divider: #25252a;

  --color-primary: #ba9eff;
  --color-background: var(--color-dark-bg);
  --color-surface: var(--color-dark-surface);
  --color-border: var(--color-dark-border);
  --color-border-hover: var(--color-dark-border-hover);
  --color-inset: var(--color-dark-inset);
  --color-divider: var(--color-dark-divider);
  --color-text-primary: #f0edf1;
  --color-text-secondary: #acaaae;
}
```

- [ ] **Step 4: Update global styles in `styles.scss`**

Update the `.saved-albums-popover-panel` class (already exists) — ensure it uses the Neon Nocturne glassmorphism:

```scss
.saved-albums-popover-panel {
  min-width: 220px;
  max-width: 300px;
  padding: 12px;
  background: rgba(25, 25, 29, 0.85);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid rgba(72, 72, 71, 0.15);
  border-radius: 1rem;
  box-shadow: 0 40px 40px rgba(186, 158, 255, 0.06);
}
```

Add a new `.filter-panel-overlay` class after the popover panel class:

```scss
.filter-panel-overlay {
  padding: 20px;
  background: rgba(25, 25, 29, 0.85);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid rgba(72, 72, 71, 0.15);
  border-radius: 1rem;
  box-shadow: 0 40px 40px rgba(186, 158, 255, 0.06);
  max-width: 480px;
}
```

- [ ] **Step 5: Build to verify**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 6: Commit**

```bash
git add src/index.html src/styles/_design-tokens.scss src/styles.scss
git commit -m "feat: update design tokens to Neon Nocturne palette"
```

---

### Task 2: App Shell — Sidebar & Top Bar

Restyle the shell layout to match the Stitch reference: wide persistent sidebar with Neon Nocturne styling, transparent top bar with glass search.

**Files:**

- Modify: `src/app/layouts/shell/shell.ts`
- Modify: `src/app/layouts/shell/shell.scss`

- [ ] **Step 1: Update shell template in `shell.ts`**

The shell template currently lives in `shell.html` (external template). Read the full template first, then update it.

Key template changes:

- **Sidenav content**: Replace the current nav list with styled nav links matching the Stitch reference:
  - Logo area at top: gradient icon circle + "Spot Radar" brand text + "New Releases" subtitle
  - Nav links: `<a>` tags with icon + label, active state via `routerLinkActive`
  - User card at bottom: avatar + name from profile store + sign out action
- **Toolbar**: Replace Material toolbar with a custom transparent top bar:
  - Glass search input (cosmetic, no functionality)
  - Notification icon + avatar icon on the right
  - `backdrop-filter: blur(24px)`, transparent background
- Keep all existing `@if` conditionals for feature flags, admin menu, etc.
- Keep `routerLink`, `routerLinkActive`, `(click)` handlers unchanged
- Keep breadcrumb and child nav components unchanged

The template changes are extensive — the implementer should read the current `shell.html` or inline template, understand the data bindings and conditionals, then restyle the HTML structure while preserving all Angular bindings.

- [ ] **Step 2: Update shell styles in `shell.scss`**

Replace the shell styles with Neon Nocturne aesthetic:

```scss
// Sidebar
mat-sidenav,
.mat-sidenav {
  width: 256px !important;
  background: #19191d !important;
  border-right: none !important;
  box-shadow: 40px 0 40px rgba(186, 158, 255, 0.06);
  padding: 24px 20px;
}

// Logo
.sidebar-logo {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.sidebar-logo-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #ba9eff, #8553f3);
  display: flex;
  align-items: center;
  justify-content: center;
}

.sidebar-logo-text {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-weight: 800;
  font-size: 16px;
  color: #f0edf1;
  letter-spacing: -0.02em;
}

.sidebar-logo-subtitle {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 8px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  color: #ba9eff;
}

// Nav links
.nav-link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border-radius: 0.75rem;
  color: #938f99;
  text-decoration: none;
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 13px;
  font-weight: 600;
  transition: all 0.2s ease;

  mat-icon,
  .mat-icon {
    font-size: 22px;
    width: 22px;
    height: 22px;
    color: inherit;
  }

  &:hover {
    color: #ba9eff;
  }

  &.active {
    background: rgba(186, 158, 255, 0.08);
    color: #ba9eff;
  }
}

// User card
.sidebar-user-card {
  margin-top: auto;
  padding: 12px;
  background: #1f1f23;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  gap: 10px;
}

.sidebar-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
}

// Top bar
.top-bar {
  position: fixed;
  top: 0;
  right: 0;
  width: calc(100% - 256px);
  height: 80px;
  z-index: 40;
  background: transparent;
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 48px;
}

.glass-search {
  background: rgba(37, 37, 42, 0.4);
  border: none;
  border-radius: 0.25rem;
  padding: 10px 16px 10px 40px;
  color: #f0edf1;
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 14px;
  width: 100%;
  max-width: 400px;
  outline: none;

  &::placeholder {
    color: #767579;
  }
}

.top-bar-icons {
  display: flex;
  align-items: center;
  gap: 16px;

  button {
    background: none;
    border: none;
    color: #767579;
    cursor: pointer;
    padding: 8px;
    border-radius: 50%;
    transition: color 0.2s;

    &:hover {
      color: #ba9eff;
    }
  }
}

// Content area
.sidenav-content,
.mat-sidenav-content {
  background: #0e0e11 !important;
  padding: 112px 48px 48px !important;
}

// Remove toolbar border
mat-toolbar,
.mat-toolbar {
  border-bottom: none !important;
  box-shadow: none !important;
}

// Mobile adjustments
@media (max-width: 767px) {
  .top-bar {
    width: 100%;
    padding: 0 16px;
    height: 60px;
  }

  .sidenav-content,
  .mat-sidenav-content {
    padding: 80px 16px 16px !important;
  }
}
```

- [ ] **Step 3: Build to verify**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/app/layouts/shell/shell.ts src/app/layouts/shell/shell.scss
git commit -m "feat: restyle app shell with Neon Nocturne sidebar and top bar"
```

---

### Task 3: Feed Page — Header, Filter Pills & Grid Layout

Transform the feed page from a vertical list with a bulky filter bar into an editorial layout with a hero header, compact filter pills, and an asymmetric grid.

**Files:**

- Modify: `src/app/features/releases/feed-filter-bar.ts`
- Modify: `src/app/features/releases/releases-feed/releases-feed.ts`

- [ ] **Step 1: Redesign FeedFilterBar as compact pills + overlay**

The FeedFilterBar currently renders all controls inline. Redesign it to show:

- A hero header section: "Curated Discovery" label (primary, uppercase, wide tracking) + "Your Feed" title (56px, 800 weight) + subtitle
- Active filter pills (right-aligned): only show pills for non-default filter values
- A tune icon button that opens the full filter panel via CDK Overlay

Keep all existing inputs and outputs unchanged. The component needs new imports:

```typescript
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
```

Add CDK overlay logic to open/close the filter panel. Use a `<ng-template>` for the panel content containing the existing Material controls.

Template structure:

```html
<div class="feed-header">
  <div class="header-text">
    <span class="header-label">Curated Discovery</span>
    <h2 class="header-title">Your Feed</h2>
    <p class="header-subtitle">The latest releases from your artists</p>
  </div>
  <div class="header-actions">
    <!-- Active filter pills (only non-defaults) -->
    @if (releaseTypeFilter() !== 'everything') {
    <span class="filter-pill">{{ releaseTypeFilter() | titlecase }}</span>
    } @if (sourceFilter() !== 'all') {
    <span class="filter-pill"
      >{{ sourceFilter() === 'followed' ? 'Following' : 'In Library' }}</span
    >
    } @if (recencyDays() !== 90) {
    <span class="filter-pill">Last {{ recencyDays() }}d</span>
    } @if (minTrackCount() > 0) {
    <span class="filter-pill">{{ minTrackCount() }}+ tracks</span>
    } @if (hideLive()) {
    <span class="filter-pill">No live</span>
    }
    <button class="filter-toggle" (click)="openFilterPanel($event)" aria-label="Open filters">
      <mat-icon>tune</mat-icon>
    </button>
  </div>
</div>

<!-- Sync indicator passthrough -->
@if (syncing()) {
<div class="sync-status">
  <mat-icon>sync</mat-icon>
  <span>Syncing…</span>
</div>
}

<ng-template #filterPanel>
  <div class="filter-panel-content">
    <div class="panel-header">
      <span>Filters</span>
      <button class="panel-close" (click)="closeFilterPanel()">
        <mat-icon>close</mat-icon>
      </button>
    </div>
    <!-- All existing Material controls go here, same bindings -->
    <div class="panel-section">
      <label class="panel-label">Release Type</label>
      <mat-button-toggle-group
        [value]="releaseTypeFilter()"
        (change)="releaseTypeChange.emit($event.value)"
        aria-label="Release type"
      >
        <mat-button-toggle value="everything">Everything</mat-button-toggle>
        <mat-button-toggle value="album">Albums</mat-button-toggle>
        <mat-button-toggle value="single">Singles</mat-button-toggle>
      </mat-button-toggle-group>
    </div>
    <div class="panel-section">
      <label class="panel-label">Source</label>
      <mat-button-toggle-group
        [value]="sourceFilter()"
        (change)="sourceFilterChange.emit($event.value)"
        aria-label="Artist source"
      >
        <mat-button-toggle value="all">All</mat-button-toggle>
        <mat-button-toggle value="followed">Following</mat-button-toggle>
        <mat-button-toggle value="saved">In Library</mat-button-toggle>
      </mat-button-toggle-group>
    </div>
    <div class="panel-section">
      <label class="panel-label">Min Tracks</label>
      <mat-select [value]="minTrackCount()" (selectionChange)="minTrackChange.emit($event.value)">
        <mat-option [value]="0">No minimum</mat-option>
        <mat-option [value]="3">3+</mat-option>
        <mat-option [value]="5">5+</mat-option>
        <mat-option [value]="8">8+</mat-option>
      </mat-select>
    </div>
    <div class="panel-section">
      <label class="panel-label">Recency</label>
      <mat-select [value]="recencyDays()" (selectionChange)="recencyChange.emit($event.value)">
        <mat-option [value]="30">Last 30 days</mat-option>
        <mat-option [value]="90">Last 90 days</mat-option>
        <mat-option [value]="180">Last 6 months</mat-option>
        <mat-option [value]="365">Last year</mat-option>
      </mat-select>
    </div>
    <div class="panel-section">
      <mat-slide-toggle [checked]="hideLive()" (change)="hideLiveChange.emit($event.checked)">
        Hide live albums
      </mat-slide-toggle>
    </div>
    <div class="panel-actions">
      <button class="btn-mark-seen" (click)="markAllSeen.emit(); closeFilterPanel()">
        <mat-icon>check</mat-icon> Mark all seen
      </button>
      <div class="split-btn">
        <button
          class="btn-sync"
          [disabled]="syncing()"
          (click)="syncNow.emit('quick'); closeFilterPanel()"
        >
          <mat-icon>sync</mat-icon> {{ syncing() ? 'Syncing…' : 'Sync' }}
        </button>
        <button class="btn-sync-arrow" [disabled]="syncing()" [matMenuTriggerFor]="syncMenu">
          <mat-icon>arrow_drop_down</mat-icon>
        </button>
      </div>
      <mat-menu #syncMenu="matMenu">
        <button mat-menu-item (click)="syncNow.emit('full')">
          <mat-icon>manage_search</mat-icon>
          <span>Full sync</span>
        </button>
      </mat-menu>
    </div>
  </div>
</ng-template>
```

Style the filter bar with Neon Nocturne tokens. Use CSS variable overrides for Material toggle groups inside the panel:

```css
--mat-standard-button-toggle-selected-state-background-color: rgba(186, 158, 255, 0.15);
--mat-standard-button-toggle-selected-state-text-color: #ba9eff;
--mat-standard-button-toggle-text-color: #acaaae;
--mat-standard-button-toggle-background-color: transparent;
--mat-standard-button-toggle-shape: 12px;
--mat-standard-button-toggle-divider-color: rgba(72, 72, 71, 0.15);
```

Add CDK Overlay logic to the class:

```typescript
private overlay = inject(Overlay);
private vcr = inject(ViewContainerRef);
private filterPanelTemplate = viewChild<TemplateRef<unknown>>('filterPanel');
private filterOverlayRef: OverlayRef | null = null;

openFilterPanel(event: MouseEvent): void {
  this.filterOverlayRef?.dispose();
  const target = event.target as HTMLElement;
  const positionStrategy = this.overlay.position()
    .flexibleConnectedTo(target)
    .withPositions([
      { originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top', offsetY: 8 },
    ]);
  this.filterOverlayRef = this.overlay.create({
    positionStrategy,
    hasBackdrop: true,
    backdropClass: 'cdk-overlay-transparent-backdrop',
    panelClass: 'filter-panel-overlay',
  });
  this.filterOverlayRef.backdropClick().subscribe(() => this.closeFilterPanel());
  this.filterOverlayRef.keydownEvents().subscribe(e => {
    if (e.key === 'Escape') this.closeFilterPanel();
  });
  const template = this.filterPanelTemplate();
  if (template) {
    this.filterOverlayRef.attach(new TemplatePortal(template, this.vcr));
  }
}

closeFilterPanel(): void {
  this.filterOverlayRef?.dispose();
  this.filterOverlayRef = null;
}
```

Add necessary imports: `ViewContainerRef`, `TemplateRef`, `viewChild` from `@angular/core`, `Overlay`, `OverlayRef` from `@angular/cdk/overlay`, `TemplatePortal` from `@angular/cdk/portal`, `TitleCasePipe` from `@angular/common`.

- [ ] **Step 2: Update releases-feed template for editorial grid**

In `releases-feed.ts`, update the template:

- Remove the `<app-feed-filter-bar>` component tag's sync indicator reference (sync indicator is now separate)
- Change `.feed-container` from flex column to CSS grid with 12 columns
- First non-dismissed release renders with `[featured]="true"` spanning 8 columns
- Second release spans 4 columns
- Remaining releases span 4 columns each (3 per row)
- Section labels use primary text + teal dot instead of divider lines
- Add "Explore Archives" footer

Add computed signals:

```typescript
protected featuredRelease = computed(() => {
  const releases = this.newReleases();
  return releases.find(r => !this.store.dismissedIds().has(r.spotify_album_id)) ?? null;
});

protected gridReleases = computed(() => {
  const releases = this.newReleases();
  const featured = this.featuredRelease();
  if (!featured) return releases;
  return releases.filter(r => r.spotify_album_id !== featured.spotify_album_id);
});
```

Update styles for the grid layout:

```css
.feed-container {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 40px;
  padding: 0 0 48px;
}

.featured-section {
  grid-column: span 8;
}

.secondary-section {
  grid-column: span 4;
}

.grid-card {
  grid-column: span 4;
}

.section-label {
  grid-column: span 12;
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.15em;
}

.section-label.new {
  color: #ba9eff;
}

.section-label.seen {
  color: #767579;
}

.section-label .dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #6df5e1;
}

@media (max-width: 900px) {
  .feed-container {
    grid-template-columns: repeat(6, 1fr);
    gap: 20px;
  }
  .featured-section {
    grid-column: span 6;
  }
  .secondary-section {
    grid-column: span 6;
  }
  .grid-card {
    grid-column: span 3;
  }
  .section-label {
    grid-column: span 6;
  }
}

@media (max-width: 600px) {
  .feed-container {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  .featured-section,
  .secondary-section,
  .grid-card,
  .section-label {
    grid-column: span 1;
  }
}
```

- [ ] **Step 3: Build to verify**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/app/features/releases/feed-filter-bar.ts src/app/features/releases/releases-feed/releases-feed.ts
git commit -m "feat: editorial feed layout with compact filter pills and grid"
```

---

### Task 4: Release Cards — Magazine Style & Featured Hero

Restyle the release card as a magazine-style card with no background at rest, hover overlay on art, and a featured hero variant.

**Files:**

- Modify: `src/app/features/releases/release-card.ts`
- Modify: `src/app/features/releases/release-card-collapsed.ts`
- Modify: `src/app/features/releases/release-card-skeleton.ts`
- Modify: `src/app/features/releases/sync-indicator.ts`
- Modify: `src/app/features/releases/saved-albums-popover.ts`

- [ ] **Step 1: Redesign release-card.ts**

Update template to match the magazine card design from the mockup:

- Standard card: no background container, art on top (square, rounded), title/artist/meta below with generous spacing
- Hover overlay on art: dark overlay with centered gradient play button linking to Spotify
- Dismiss: "x" icon in glass circle, top-right of art, visible on hover
- Source chips: "Following" as plain outline text, "In Library" as tertiary with dotted underline
- Bottom row: date + "SPOTIFY" link
- Featured variant: 16:9 art with gradient overlay, large title, gradient CTA, "Featured Release" chip

Remove `host: { '[class.is-album]': ... }` — the single card design works for all types. Keep `'[class.is-featured]': 'featured()'` for the featured variant.

The featured template should be wrapped in `@if (featured()) { ... } @else { ... }` to show two different layouts from the same component.

See Section 3 of the spec for exact colors, sizes, and spacing.

- [ ] **Step 2: Restyle release-card-collapsed.ts**

Update styles:

- No background, 40% opacity
- 36px thumb with 4px radius
- Hover: opacity 0.7, translateY(-1px)
- Remove the explicit background color

```css
.collapsed-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border-radius: 0.5rem;
  width: 100%;
  text-align: left;
  border: none;
  background: transparent;
  cursor: pointer;
  opacity: 0.4;
  transition:
    opacity 0.2s,
    transform 0.2s;
}

.collapsed-card:hover {
  opacity: 0.7;
  transform: translateY(-1px);
}

.thumb {
  width: 36px;
  height: 36px;
  border-radius: 4px;
  object-fit: cover;
  flex-shrink: 0;
}

.title {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 13px;
  font-weight: 600;
  color: #f0edf1;
}

.sub {
  font-size: 11px;
  color: #767579;
}
```

- [ ] **Step 3: Restyle release-card-skeleton.ts**

Match new card shape — vertical art + text bars, no background container:

```css
.skeleton-card {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.skeleton-art {
  width: 100%;
  aspect-ratio: 1;
  border-radius: 0.5rem;
  background: #1f1f23;
}

.skeleton-text {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 0 2px;
}
```

- [ ] **Step 4: Restyle sync-indicator.ts**

Glass container with primary glow:

```css
.sync-indicator {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px 20px;
  border-radius: 0.75rem;
  background: rgba(25, 25, 29, 0.6);
  backdrop-filter: blur(12px);
  box-shadow: 0 0 24px rgba(186, 158, 255, 0.08);
}

.sync-text {
  margin: 0;
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 0.875rem;
  color: #acaaae;
}
```

Override progress bar color via CSS variable: `--mdc-linear-progress-active-indicator-color: #ba9eff;`

- [ ] **Step 5: Update saved-albums-popover.ts inner styles**

Update to use Plus Jakarta Sans instead of Manrope, and Neon Nocturne colors:

- Header: `#ba9eff`, Plus Jakarta Sans, uppercase
- Album name: `#f0edf1`
- Year: `#767579`
- Spotify link: `#ba9eff`
- Empty text: `#767579`
- Art: `border-radius: 0.5rem`

- [ ] **Step 6: Build and test**

Run: `npm run build && npm test -- --no-watch`
Expected: Build succeeds, all tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/app/features/releases/
git commit -m "feat: magazine-style release cards with featured hero variant"
```

---

### Task 5: Auth Pages — Glass Card & Gradient Forms

Restyle the auth layout and form components with glassmorphism and Neon Nocturne colors.

**Files:**

- Modify: `src/app/layouts/auth-layout/auth-layout.ts`
- Modify: `src/app/features/auth/auth-form-styles.ts`

- [ ] **Step 1: Restyle auth-layout.ts**

Update the inline styles:

- Background: `#0e0e11` with two radial gradient orbs using `#ba9eff` at 8% and 12% opacity
- Auth card: glassmorphism — `rgba(25, 25, 29, 0.8)` + `backdrop-filter: blur(24px)`, `border-radius: 0.75rem`, ghost border (`rgba(72, 72, 71, 0.15)`)
- App title: `#ba9eff`, Plus Jakarta Sans 700
- Remove hard borders

```css
.auth-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100dvh;
  padding: 16px;
  background-color: #0e0e11;
  background-image:
    radial-gradient(ellipse at 20% 20%, rgba(186, 158, 255, 0.12) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 80%, rgba(186, 158, 255, 0.08) 0%, transparent 50%);
}

.auth-card {
  max-width: 400px;
  width: 100%;
  padding: 40px;
  background: rgba(25, 25, 29, 0.8);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid rgba(72, 72, 71, 0.15);
  border-radius: 0.75rem;
  box-shadow: 0 40px 40px rgba(186, 158, 255, 0.06);
}

.app-title {
  text-align: center;
  margin-bottom: 24px;
  color: #ba9eff;
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-weight: 700;
  font-size: 1.5rem;
  letter-spacing: -0.02em;
}
```

- [ ] **Step 2: Update auth-form-styles.ts**

Update the shared styles constant:

```typescript
export const AUTH_FORM_STYLES = `
  h2 {
    text-align: center;
    margin-bottom: 24px;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-weight: 700;
    color: #f0edf1;
  }

  .full-width {
    width: 100%;
  }

  mat-form-field {
    margin-bottom: 16px;
  }

  .footer {
    text-align: center;
    margin-top: 16px;

    a {
      color: #ba9eff;
      text-decoration: none;

      &:hover {
        text-decoration: underline;
      }
    }
  }

  .error {
    color: #ff6e84;
    text-align: center;
  }

  .success {
    color: #6df5e1;
    text-align: center;
  }

  .divider {
    margin: 24px 0;
  }

  .social-buttons {
    margin-bottom: 16px;
  }

  [mat-raised-button][color="primary"] {
    background: linear-gradient(135deg, #ba9eff, #8553f3) !important;
    color: #000 !important;
    border-radius: 0.5rem;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-weight: 700;
  }
`;
```

- [ ] **Step 3: Build to verify**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/app/layouts/auth-layout/auth-layout.ts src/app/features/auth/auth-form-styles.ts
git commit -m "feat: glassmorphism auth pages with Neon Nocturne styling"
```

---

### Task 6: Landing Page & Public Layout

Restyle the landing page and its public layout wrapper.

**Files:**

- Modify: `src/app/layouts/public-layout/public-layout.ts`
- Modify: `src/app/features/landing/landing.ts`

- [ ] **Step 1: Restyle public-layout.ts**

Update the fixed toolbar:

- Transparent background (already is)
- Logo: "Spot Radar" in Plus Jakarta Sans 800, `#ba9eff`
- CTA buttons: gradient style for "Get Started", ghost style for "Sign In"

- [ ] **Step 2: Restyle landing.ts**

Update the landing page colors and typography:

- Background: `#0e0e11` with animated violet gradient (update colors from blue to violet)
- Hero title: Plus Jakarta Sans 800, `letter-spacing: -0.02em`, `#f0edf1`
- Subtitle: `#acaaae`
- CTA buttons: gradient primary + ghost secondary
- Feature cards: `#19191d` background (no borders), primary gradient icon badges
- Feature card hover: `scale(1.02)` (already exists)
- Footer: `#19191d` background section instead of border-top line
- Update CSS custom properties: `--landing-bg: #0e0e11`, `--landing-surface: #19191d`, `--landing-border: #48474b`, `--landing-text: #f0edf1`, `--landing-text-muted: #acaaae`

- [ ] **Step 3: Build to verify**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/app/layouts/public-layout/public-layout.ts src/app/features/landing/landing.ts
git commit -m "feat: Neon Nocturne landing page and public layout"
```

---

### Task 7: Dashboard & Profile Pages

Restyle the remaining authenticated pages.

**Files:**

- Modify: `src/app/features/dashboard/dashboard.ts`
- Modify: `src/app/features/profile/profile.ts`

- [ ] **Step 1: Restyle dashboard.ts**

Update the dashboard:

- Greeting: Plus Jakarta Sans 800, tight tracking, editorial header treatment matching the feed
- Quick-link cards: no background at rest, `#25252a` on hover, no borders
- Icon badges: primary gradient circles
- Grid gap: increase to 24px

- [ ] **Step 2: Restyle profile.ts**

Update the profile page:

- Section cards: glassmorphism — `rgba(25, 25, 29, 0.6)` + blur instead of Material cards
- Avatar: gradient ring border (use a wrapper div with primary gradient background and 3px padding, inner white circle)
- Form fields: ghost borders matching auth pages
- Danger zone: `rgba(255, 110, 132, 0.06)` tint background, no hard red border, `#ff6e84` title color
- Save button: gradient primary
- Delete button: error color, ghost style

- [ ] **Step 3: Build and run full test suite**

Run: `npm run build && npm test -- --no-watch`
Expected: Build succeeds, all 704+ tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/app/features/dashboard/dashboard.ts src/app/features/profile/profile.ts
git commit -m "feat: Neon Nocturne dashboard and profile pages"
```

---

### Task 8: Final Verification & Cleanup

- [ ] **Step 1: Run full build**

Run: `npm run build`
Expected: Build succeeds with no errors.

- [ ] **Step 2: Run full test suite**

Run: `npm test -- --no-watch`
Expected: All tests pass.

- [ ] **Step 3: Run lint and format**

Run: `npm run lint && npm run format:check`
Expected: No lint errors, no formatting issues.

- [ ] **Step 4: Fix any formatting issues**

Run: `npm run format`

Then commit if changes were made:

```bash
git add -u
git commit -m "chore: format and lint fixes"
```
