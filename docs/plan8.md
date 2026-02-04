# Angular Starter - Phase 8: Angular 21 Best Practices Alignment

**Goal**: Align the codebase with the latest Angular 21 APIs and best practices identified via the official Angular documentation. Adopt `provideZonelessChangeDetection()`, `ChangeDetectionStrategy.OnPush`, signal-based queries, `resource()` API, `linkedSignal()`, and ES private fields.

**Status at start of Phase 8**: Iterations 66-74 complete.

**Current status**: Planning. No code changes yet.

---

## Iteration 75 — Enable zoneless change detection provider

The app is described as zoneless and uses signals throughout, but the `provideZonelessChangeDetection()` provider is missing from `app.config.ts`. Without it, Angular falls back to the default change detection scheduler which expects Zone.js.

### 75a. `app.config.ts` — Add `provideZonelessChangeDetection()`

**Problem:** `app.config.ts:10-18` configures providers but does not include `provideZonelessChangeDetection()`. This is the essential provider that tells Angular to schedule change detection based on signal notifications instead of Zone.js.

**Plan:** Add `provideZonelessChangeDetection()` to the providers array. Verify the app still works correctly — all reactive state should already be signal-based from Phase 7 work.

---

## Iteration 76 — Add `ChangeDetectionStrategy.OnPush` to all components

Zero components in the codebase declare a change detection strategy. The Angular docs recommend `OnPush` for signal-based components — it prevents unnecessary change detection cycles by only checking when signals or inputs change.

### 76a. Add `ChangeDetectionStrategy.OnPush` to all components

**Problem:** No component uses `ChangeDetectionStrategy.OnPush`. In a zoneless signal-based app, OnPush is the recommended default per Angular v20+ guidelines. It ensures components only re-check when their signals change, not on every application tick.

**Files affected:** All component files across `features/`, `shared/`, and `layouts/`.

**Plan:** Add `changeDetection: ChangeDetectionStrategy.OnPush` to every `@Component` decorator. Run the full test suite after to catch any regressions from components that may still depend on default change detection.

---

## Iteration 77 — Migrate `@ViewChild` to signal-based `viewChild()`

Five instances of the decorator-based `@ViewChild` remain. The signal-based `viewChild()` is the current recommended API — it returns a signal, eliminating non-null assertions (`!`) and enabling reactive composition.

### 77a. `shell.ts:39-40` — Sidenav and sidenav content

**Problem:** `@ViewChild('sidenav') sidenav!: MatSidenav` and `@ViewChild(MatSidenavContent) sidenavContent!: MatSidenavContent` use decorator-based queries with non-null assertions.

**Plan:** Migrate to `sidenav = viewChild<MatSidenav>('sidenav')` and `sidenavContent = viewChild(MatSidenavContent)`. Update usages in the class to call the signal (e.g., `this.sidenav()?.close()`).

### 77b. `data-table.ts:129-130` — Sort and paginator

**Problem:** `@ViewChild(MatSort) sort!: MatSort` and `@ViewChild(MatPaginator) paginator!: MatPaginator` use decorator-based queries. The component also implements `AfterViewInit` solely to wire these up.

**Plan:** Migrate to `sort = viewChild(MatSort)` and `paginator = viewChild(MatPaginator)`. Replace the `ngAfterViewInit` hook with an `effect()` that wires up `dataSource.sort` and `dataSource.paginator` when the signals resolve, eliminating the lifecycle hook.

### 77c. `chat-room.ts:198` — Messages container ref

**Problem:** `@ViewChild('messagesContainer') private messagesContainer!: ElementRef<HTMLDivElement>` uses the decorator pattern.

**Plan:** Migrate to `messagesContainer = viewChild<ElementRef<HTMLDivElement>>('messagesContainer')`. Update scroll-to-bottom logic to use the signal.

---

## Iteration 78 — Adopt `resource()` for async data loading

The codebase manually manages `loading`, `error`, and data signals for every async operation with repetitive `try/catch/finally` blocks. Angular 21 provides the `resource()` API which handles loading states, error states, and request cancellation automatically.

### ~~78a. `notes-list.ts`~~ — Skipped

Skipped: The `NotesStore` is a shared cache with TTL, optimistic mutations, and pagination state. `resource()` manages its own value/loading state, which conflicts with the store as source of truth.

### 78b. `shell.ts:89-101` — Replace `ngOnInit` role loading with `resource()`

**Problem:** `Shell.ngOnInit()` calls `loadUserRole()` which fetches the user profile to get the role. This is an imperative async call inside a lifecycle hook.

**Plan:** Replace with a `resource()` that loads the user role reactively based on `auth.currentUser()`. When the user changes, the resource automatically re-fetches. Remove the `ngOnInit` lifecycle hook.

### ~~78c. `note-form.ts`~~ — Skipped

Skipped: One-time load with form patching and error-redirect side effects. Using `resource()` would split into three separate pieces (resource, form-patching effect, error effect) — more complexity than the current `loadNote()` method.

---

## Iteration 79 — Use `linkedSignal()` for dependent writable state

`linkedSignal()` creates a writable signal that automatically resets when a source signal changes. This is useful for pagination state that should reset on search, or selection state that should clear on data changes.

### ~~79a. `notes-list.ts:139-173`~~ — Skipped

Skipped: The page reset is triggered by a user action (pressing Enter / clicking search), not by a signal change. `searchQuery` updates on every keystroke via `ngModel`, so linking `currentPage` to it would reset the page on every character typed. The manual `currentPage.set(1)` in `search()` is the correct pattern.

### ~~79b. `data-table.ts:167-168`~~ — Skipped

Skipped: `SelectionModel` is from Angular CDK and is not signal-based. There is no signal to link to. The current `effect()` that clears selection when `data()` changes is already the right approach.

---

## Iteration 80 — Use ES private `#` fields in stores and services

TypeScript `private` is compile-time only. ES private fields (`#`) provide runtime encapsulation. The Angular Tips best practices recommend `#` for store internals to prevent external access even through type assertions.

### 80a. `notes-store.ts` — Migrate to `#` private fields

**Problem:** `notes-store.ts:9-14` uses TypeScript `private` for internal signals (`private notes`, `private loading`, `private lastFetch`, etc.). These are accessible at runtime via type assertions.

**Plan:** Convert all `private` signal fields to ES private `#` fields:

```typescript
#notes = signal<Note[]>([]);
#loading = signal(false);
#lastFetch = signal<Date | null>(null);
```

Update all internal references from `this.notes` to `this.#notes`, etc.

### 80b. `chat-store.ts` — Migrate to `#` private fields

**Problem:** Same pattern as notes-store — internal signals and state use TypeScript `private`.

**Plan:** Convert private fields to `#` prefix. Update internal references.

### 80c. `preferences.ts` — Migrate to `#` private fields

**Problem:** The preferences service uses TypeScript `private` for its internal `preferences` signal and helper methods.

**Plan:** Convert private fields to `#` prefix.

---

## Iteration 81 — Convert remaining plain properties to signals

Several components use plain properties for state that should be signals in a zoneless architecture. Plain property changes don't reliably trigger change detection without Zone.js.

### 81a. `notes-list.ts:142` — `searchQuery` is a plain string

**Problem:** `searchQuery = ''` is a plain string used with `[(ngModel)]`. In a zoneless app, plain property changes are not tracked. This works incidentally because FormsModule fires events, but it's fragile and inconsistent with the signal-first architecture.

**Plan:** Convert to `searchQuery = signal('')` and use the split-binding pattern in the template: `[ngModel]="searchQuery()" (ngModelChange)="searchQuery.set($event)"`.

### 81b. `app.ts:42` — `isBrowser` is a plain boolean

**Problem:** `isBrowser = false` is set to `true` in the constructor. Since it's set before first render, it works, but it's inconsistent with the signal-based architecture.

**Plan:** Convert to a signal or a readonly field initialized from `isPlatformBrowser()` in the field initializer.

---

## Iteration 82 — Verify shared component input/output consistency

Most shared components already use the modern `input()` / `output()` functions. Verify all shared components are consistent and migrate any remaining decorator-based `@Input` / `@Output` instances.

### 82a. Audit and migrate remaining `@Input` / `@Output` decorators

**Problem:** Shared components like `Skeleton`, `EmptyState`, `SearchInput`, and `DataTable` correctly use `input()` / `output()`. However, some components (e.g., `SocialLoginButton`, `Avatar`, `LoadingBar`) need verification.

**Plan:** Audit all shared and feature components for `@Input()` and `@Output()` decorator usage. Migrate any remaining instances to `input()` / `output()` functions for consistency.

---

## Summary

| Iteration | Name                                   | Category      | Items | Status  |
| --------- | -------------------------------------- | ------------- | ----- | ------- |
| 75        | Enable zoneless change detection       | Configuration | 1     | Done    |
| 76        | Add OnPush to all components           | Performance   | 1     | Done    |
| 77        | Migrate @ViewChild to viewChild()      | API Migration | 3     | Done    |
| 78        | Adopt resource() for data loading      | API Migration | 1     | Done    |
| 79        | Use linkedSignal() for dependent state | API Migration | 0     | Skipped |
| 80        | Use ES private # fields in stores      | Encapsulation | 3     | Done    |
| 81        | Convert plain properties to signals    | Consistency   | 2     | Pending |
| 82        | Verify input/output consistency        | Consistency   | 1     | Pending |

**Total iterations**: 8 (75-82). **Total items**: 16.
