---
name: repo-review
description: Review pending code changes against this repo's architecture, conventions, and Angular Material best practices. Use when evaluating staged/unstaged changes, new components, or refactored code before committing.
allowed-tools: Read, Grep, Glob, Bash
---

# Code Review

Review pending code changes for this Angular 21 zoneless starter repo. Evaluate against established architecture, conventions, and Angular Material best practices.

## Process

1. **Gather changes** — Run `git diff` and `git diff --cached` to see unstaged and staged changes. If a specific file or feature is mentioned, focus there.
2. **Understand context** — Read surrounding code and related files to understand how the changes fit into the existing codebase.
3. **Evaluate against repo patterns** — Check every item in the review checklist below.
4. **Report findings** — Organize by severity (Blocker, Warning, Nit) with file paths, line references, and concrete fix suggestions.

## Review Checklist

### Zoneless Change Detection

- All reactive component state uses `signal()`, `computed()`, or signal primitives — never plain property assignments after async operations.
- `[(ngModel)]` with signals uses the split binding pattern: `[ngModel]="value()" (ngModelChange)="value.set($event)"`.
- No imports or references to `zone.js` or `NgZone` (except in `GlobalErrorHandler` which requires `NgZone.run()`).

### Three-Layer State Pattern

- **Service** — Pure data access only. Async methods calling Supabase, returning data. No signals, no state.
- **Store** — `providedIn: 'root'` injectable with signals. Exposes readonly signals and mutation methods. Never calls services or makes network requests.
- **Component** — Orchestrator. Injects service + store, calls service, pushes results into store. Templates bind to store signals. Transient UI flags (`saving`, `uploading`, `deleting`) stay as local component signals.
- Verify new features follow this separation. Flag any service that holds signals or any store that makes HTTP/Supabase calls.

### Store Signal Hygiene

- Internal signals are private, exposed via `.asReadonly()` (e.g., `readonly allNotes = this.notes.asReadonly()`).
- Derived state uses `computed()` (e.g., `isEmpty`, `isStale`).
- TTL cache invalidation via `isStale` computed that checks `lastFetch` against `environment.cacheTtlMinutes`.
- Mutation methods use `.set()` or `.update()` — no direct external signal writes.

### Dependency Injection

- All injection uses `inject()` function — never constructor parameter injection.
- Signal-based inputs use `input()` / `input.required()` — not the `@Input()` decorator.
- Outputs use `output()` where applicable — not the `@Output()` decorator.

### Component Conventions

- Standalone components only — no NgModules. `standalone: true` is omitted (Angular 19+ default).
- `ChangeDetectionStrategy.OnPush` on all components (set as default in angular.json, but verify if explicitly declared).
- Inline templates and styles using backticks.
- Selector prefix: `app-`, kebab-case.
- Class names: PascalCase matching the feature (e.g., `NotesList`, not `NotesListComponent`).
- File names: kebab-case, `.ts` extension (not `.component.ts`). Services use `-service.ts`, stores use `-store.ts`.

### Forms

- Reactive forms with `fb.nonNullable.group()`.
- Custom validators in `shared/validators/`.
- Proper validation feedback in the template.
- Form components that navigate away implement `HasUnsavedChanges` interface for the unsaved-changes guard.

### Destructive Actions

- Destructive operations (delete, remove, etc.) prompt the user via `confirmDialog.confirm()` before proceeding.
- Use optimistic updates: apply the change to the store immediately, then refetch on error to restore correct state.

### Error Handling

- Supabase results use `unwrap()` / `unwrapWithCount()` helpers.
- Catch blocks use `extractErrorMessage(err, fallback)` — never raw `err.message`.
- HTTP errors handled by `httpErrorInterceptor`; no duplicate handling in components.

### Loading States

- List/grid views use skeleton card components (e.g., `NoteCardSkeleton`) — 6 rendered in the same grid container.
- Forms and pre-filled content use `[appSkeletonOverlay]="loading()"`.
- `LoadingSpinner` only for edge cases (e.g., streaming).

### Theming & Styles

- Colors use `var(--mat-sys-*)` CSS custom properties — never hard-coded hex/rgb.
- Material component overrides use `--mdc-*` tokens instead of `!important`.
- Auth form components share styles via `AUTH_FORM_STYLES` constant.
- Snackbar `panelClass` is applied to the overlay pane wrapper — use descendant selectors (`.toast-success .mdc-snackbar__surface`), not combined selectors.
- Component styles must stay under 6kB (warning) / 10kB (error) budget.

### Path Aliases & Imports

- Use `@core`, `@shared`, `@layouts`, `@features/*`, `@env` aliases — never relative paths crossing these boundaries.
- Barrel exports respected — import from the alias, not deep into the directory.
- When adding new exports to `@shared`, update `shared/index.ts` barrel file.

### Accessibility

- Icon-only buttons require `aria-label`.
- Form inputs have associated `<mat-label>` or `aria-label`.
- Error messages use `role="alert"`.
- Status/loading indicators use `aria-busy="true"` or `role="status"` with `aria-live="polite"`.
- Decorative icons use `aria-hidden="true"`.
- Heading hierarchy is correct (h1 → h2 → h3, no skipped levels).
- Interactive elements have `:focus-visible` styling.

### Auth & Routing

- Auth state managed via `onAuthStateChange` — no separate `loadUser()` calls.
- `signOut()` relies on the `SIGNED_OUT` event to clear state and navigate.
- Guards are functional: `authGuard`, `guestGuard` (from `createAuthGuard`), `roleGuard`, `featureFlagGuard`.
- Lazy loading via `loadComponent()`.
- Route data uses `childNavMode`, `showBreadcrumb`, `childNav` where applicable.

### SSR Compatibility

- No direct `window`, `document`, or `localStorage` access without platform checks.
- Landing, login, and register are prerendered — changes to these must not break SSR.

### Realtime Subscriptions

- `RealtimeService.subscribeToTable()` returns an unsubscribe function — it must be called on component destroy.
- Realtime INSERT handlers must deduplicate (check if the item already exists in the store before adding).

### Testing

- Vitest with `vi.fn()` for mocks, `TestBed` for DI, `NoopAnimationsModule` for component tests.
- Every new `.ts` file gets a corresponding `.spec.ts` file in the same directory.
- Tests follow existing patterns in the codebase.

### Configuration & Hardcoded Values

- Lists of allowed values (MIME types, file extensions, provider names, etc.) belong in `environment.base.ts`, not hardcoded in services or components. Validation logic should read from `environment.*` so the values are configurable per-environment without code changes.
- HTML `accept` attributes and similar template-level restrictions must bind to the environment config rather than duplicating the allowed list as a static string.
- Magic numbers (size limits, timeouts, thresholds) should reference `environment.*` constants — not inline literals. Existing environment values: `upload`, `toastDuration`, `cacheTtlMinutes`, `pagination`, `signedUrlExpirationSecs`, `searchDebounceMs`, `loadingBarDelayMs`, `passwordMinLength`.
- When a configurable value is used in an error message, derive the message from the config rather than hardcoding a description that can drift (e.g., say "File type not supported" instead of listing allowed types in the string).

### General Quality

- No over-engineering: no unnecessary abstractions, feature flags, or backward-compat shims.
- No unused imports, variables, or dead code introduced.
- Formatting matches Prettier config (`printWidth: 100`, single quotes, 2-space indent).
- No security vulnerabilities (XSS, injection, etc.).
- RxJS used only where required (route guards via `toObservable()`, breakpoint detection via `toSignal()`). Signals preferred everywhere else.
- Initial bundle stays under 1.65MB (warning) / 2MB (error).

## Output Format

### Summary

One-sentence overview of what the changes do and overall quality assessment.

### Findings

Group by severity:

- **Blockers** — Must fix before merging. Pattern violations, bugs, security issues.
- **Warnings** — Should fix. Inconsistencies, missing tests, suboptimal patterns, hardcoded values that belong in environment config, maintainability concerns.
- **Nits** — Minor style or naming suggestions.

For each finding:

- **File:line** — Where the issue is.
- **Issue** — What's wrong.
- **Fix** — Concrete suggestion or code snippet.

### Verdict

One of: **Approve**, **Approve with nits**, **Request changes**.
