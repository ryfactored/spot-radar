# Angular Starter - Phase 7: Code Simplification & Cleanup

**Goal**: Audit the full codebase for bugs, dead code, duplication, inconsistencies, and over-engineering. Simplify and tighten the code without changing behavior.

**Status at start of Phase 7**: Iterations 60-65 complete. 360 unit tests, 30 E2E tests. Build 1.55 MB. v1.0.0 ready.

**Current status**: Planning. No code changes yet.

---

## Iteration 66 — Fix zoneless signal bugs

Four components have state that doesn't trigger change detection in the zoneless (no zone.js) architecture. These are functional bugs, not style issues.

### 66a. `chat-room.ts:204-206` — `sending` is not a signal

**Problem:** `sending` is defined as a plain function `sending = () => false` and then reassigned at runtime (`this.sending = () => true`, `this.sending = () => false`). A parallel `_sending` boolean on line 206 tracks the same state. In a zoneless app, reassigning a function reference does not trigger change detection. The template binding `[disabled]="!newMessage.trim() || sending()"` will not reactively update when the function is swapped.

**Plan:** Replace with `sending = signal(false)` and use `.set(true)` / `.set(false)`. Remove the `_sending` plain property.

### 66b. `social-login-button.ts:108-117` — `providerLabel` getter is not reactive

**Problem:** `providerLabel` is a plain TypeScript getter used directly in the template via `{{ providerLabel }}`. In zoneless mode, getters are not tracked by the change detection system. The label will render on initial load but won't update if the `provider()` input signal changes after initialization.

**Plan:** Convert `providerLabel` to a `computed()` signal.

### 66c. `search-input.ts:72` — Plain `value` property with `[(ngModel)]`

**Problem:** `value` is a plain string property bound via `[(ngModel)]`. While `FormsModule` may internally trigger updates in some cases, plain properties are not tracked by zoneless change detection. This is inconsistent with the signal-first architecture and may cause missed UI updates.

**Plan:** Convert `value` to a signal or use a reactive forms approach consistent with the rest of the app.

### 66d. `http-error-interceptor.ts` + `global-error-handler.ts` — Duplicate toasts

**Problem:** The HTTP interceptor catches errors, shows a toast via `ToastService`, then rethrows the error. The `GlobalErrorHandler` catches the rethrown error and shows another toast. This results in duplicate toast notifications for HTTP errors.

**Plan:** Have the interceptor mark errors as already handled (e.g., set a property on the error object), and have the `GlobalErrorHandler` skip toasts for already-handled errors. Alternatively, remove the toast from the interceptor and let the global handler be the single source of user-facing error messages.

---

## Iteration 67 — Remove dead code

Remove unused methods, exports, and computed signals. Update tests that depend on removed legacy APIs.

### 67a. `preferences.ts` — Legacy/unused methods

| Line    | Method               | Reason                                                                                              |
| ------- | -------------------- | --------------------------------------------------------------------------------------------------- |
| 96      | `setDarkMode()`      | Zero usages in production code. All consumers use `toggleDarkMode()`.                               |
| 111-113 | `toggleTheme()`      | Only used in test files. Marked "Legacy method for compatibility". Delegates to `toggleDarkMode()`. |
| 116     | `setSidenavOpened()` | Zero usages in production or test code.                                                             |
| 46-47   | `theme()` accessor   | Only consumed in test files. Marked "Legacy support".                                               |

**Plan:** Remove all four. Update any tests that reference `toggleTheme()` or `theme()` to use `toggleDarkMode()` and `darkMode()` directly.

### 67b. `data-table.ts:211` — `clearSelection()` never called externally

**Problem:** `clearSelection()` is defined as a public method but no component or service ever calls it.

**Plan:** Remove the method.

### 67c. `search-input.ts:98-101` — `setValue()` never called externally

**Problem:** `setValue()` is a public method with zero external callers.

**Plan:** Remove the method.

### 67d. `shared/index.ts` — Unused barrel exports

| Line | Export                                    | Reason                                                                                                                   |
| ---- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| 12   | `PageEvent` re-export                     | The only consumer (`notes-list.ts`) imports `PageEvent` directly from `@angular/material/paginator`, not from `@shared`. |
| 15   | `StrengthLevel`, `PasswordStrengthResult` | Never imported externally — only referenced in the barrel itself and the defining file.                                  |

**Plan:** Remove unused re-exports from the barrel.

### 67e. `notes-store.ts:31` — `noteCount` computed is never used

**Problem:** The `noteCount` computed signal is defined but no component reads it.

**Plan:** Remove it. If needed later, it can be re-added.

---

## Iteration 68 — Consolidate duplicated patterns

Extract shared helpers and eliminate copy-paste code across components.

### 68a. Password value subscription — 3 files

**Files:** `register.ts:186`, `reset-password.ts:153`, `profile.ts:279`

**Problem:** All three contain identical code:

```ts
this.form.controls.password.valueChanges
  .pipe(takeUntilDestroyed(this.destroyRef))
  .subscribe((value) => this.passwordValue.set(value));
```

**Plan:** Extract a reusable helper function, e.g. `syncControlToSignal(control, signal, destroyRef?)`, that wires up a form control's `valueChanges` to a signal. Place it in `shared/` or alongside the validators.

### 68b. Unnecessary explicit `inject(DestroyRef)` — 3 files

**Files:** `register.ts:164`, `reset-password.ts:134`, `profile.ts:250`

**Problem:** When `takeUntilDestroyed()` is called inside a constructor, Angular automatically infers the `DestroyRef` from the injection context. The explicit `inject(DestroyRef)` and parameter pass are unnecessary boilerplate.

**Plan:** Remove the explicit `inject(DestroyRef)` calls and the parameter from `takeUntilDestroyed()`. This also means the helper from 68a won't need a `destroyRef` parameter if called from constructors.

### 68c. Auth form styles — 4 files

**Files:** `login.ts`, `register.ts`, `forgot-password.ts`, `reset-password.ts`

**Problem:** All four auth components contain near-identical inline SCSS blocks: h2 centering, `.full-width`, `mat-form-field` margin, `.footer` styles, `.error` color. Each component duplicates ~20-30 lines of styles.

**Plan:** Move shared auth form styles into the `AuthLayout` component or a shared SCSS partial that all auth components inherit from. Keep component-specific styles inline.

### 68d. Social provider login method — 2 files

**Files:** `login.ts:160-170`, `register.ts:207-217`

**Problem:** Nearly identical `loginWithProvider` / `signUpWithProvider` methods that call `auth.signInWithProvider()`.

**Plan:** Extract a shared method or move social login logic into `AuthService` so both components call a single entry point.

### 68e. `as unknown as SocialProvider[]` double cast — 2 files

**Files:** `login.ts:142`, `register.ts:183`

**Problem:** The environment's `socialProviders` property type doesn't match `SocialProvider[]`, forcing a double cast through `unknown`. The root cause is the environment type definition.

**Plan:** Update `environment.interface.ts` to type `socialProviders` as `SocialProvider[]` (importing the type from the auth module). Remove the casts from both components.

### 68f. Error message extraction — ~15 occurrences

**Problem:** The pattern `err instanceof Error ? err.message : 'Fallback message'` appears in nearly every `catch` block across the codebase.

**Plan:** Create a shared utility `extractErrorMessage(err: unknown, fallback?: string): string` in `@shared` or `@core`. Replace all inline occurrences.

### 68g. `authGuard` + `guestGuard` — identical structure, inverted condition

**Files:** `auth-guard.ts`, `guest-guard.ts`

**Problem:** Both guards share the exact same RxJS pattern (wait for `loading` to be false, `take(1)`, `map`). The only difference is the condition is inverted and the redirect target differs (`/login` vs `/dashboard`).

**Plan:** Create a single parameterized factory:

```ts
function createAuthGuard(requireAuth: boolean) { ... }
export const authGuard = createAuthGuard(true);
export const guestGuard = createAuthGuard(false);
```

Both guards can live in a single file or remain separate — the factory eliminates the logic duplication either way.

### 68h. Environment files — near-identical

**Files:** `environment.ts`, `environment.prod.ts`

**Problem:** ~39 lines each, sharing ~30 identical lines. Only `production`, `socialProviders`, `siteUrl`, and `toastDuration` differ.

**Plan:** Create a shared `environment.base.ts` with common values. Each environment file spreads the base and overrides the differences.

---

## Iteration 69 — Fix import path inconsistencies

Standardize all imports to use path aliases (`@core`, `@shared`, `@layouts`, `@features/*`, `@env`) and fix the missing barrel export.

### 69a. Relative imports into `@shared` from core files

**Problem:** Several core files use relative imports to reach into `@shared`, while others correctly use the barrel alias.

| File                          | Current Import                              | Should Be                            |
| ----------------------------- | ------------------------------------------- | ------------------------------------ |
| `global-error-handler.ts:3`   | `'../shared/toast'`                         | `'@shared'`                          |
| `http-error-interceptor.ts:5` | `'../shared/toast'`                         | `'@shared'`                          |
| `role-guard.ts:5`             | `'../shared/toast'`                         | `'@shared'`                          |
| `app.ts`                      | `'./core/preferences'`                      | `'@core'`                            |
| `shell.ts:16`                 | `'../../shared/animations/route-animation'` | `'@shared'` (after adding to barrel) |
| `auth-layout.ts:5`            | `'../../shared/animations/route-animation'` | `'@shared'` (after adding to barrel) |

**Plan:** Fix all imports to use path aliases. Add `routeAnimation` to the `@shared` barrel export.

### 69b. `error-mapper.ts` vs `supabase-errors.ts` — duplicated error codes

**Problem:** `error-mapper.ts:30` hardcodes the string `'PGRST116'` while `supabase-errors.ts` defines `SUPABASE_ERRORS.NO_ROWS_FOUND = 'PGRST116'`. Two sources of truth for the same constant.

**Plan:** Have `error-mapper.ts` import and reference `SUPABASE_ERRORS.NO_ROWS_FOUND` instead of hardcoding the string.

---

## Iteration 70 — Simplify core services

Reduce unnecessary complexity in auth, supabase, preferences, and error handling services.

### 70a. `auth.ts:33-48` — Dual initialization race condition

**Problem:** The constructor calls `loadUser()` (fetches session, sets signals) and also registers `onAuthStateChange` (which fires immediately with `INITIAL_SESSION` and sets the same signals). Both paths set `loading` to false and `currentUser` to the session user, creating a race where signals are set twice in quick succession.

**Plan:** Remove `loadUser()` and rely solely on `onAuthStateChange` for initial session establishment. The `INITIAL_SESSION` event in modern Supabase SDKs covers this case.

### 70b. `auth.ts:89-102` — Redundant cleanup in `signOut()`

**Problem:** `signOut()` manually sets `currentUser.set(null)` and calls `router.navigate(['/login'])`, but the `onAuthStateChange` listener already handles the `SIGNED_OUT` event by doing both of these things. The manual calls are defensive duplicates that cause double navigation.

**Plan:** Remove the explicit `currentUser.set(null)` and `router.navigate` from `signOut()`, relying on the auth state change listener. Add a comment explaining the flow.

### 70c. `error-mapper.ts:13-38` — Over-segmented error maps

**Problem:** Three separate maps (`AUTH_ERRORS`, `RATE_LIMIT_ERRORS`, `DATA_ERRORS`) are created and immediately merged into `ERROR_MAP`. The intermediate maps serve no runtime purpose — they exist only for organization.

**Plan:** Collapse into a single `ERROR_MAP` with inline comments for categorization.

### 70d. `supabase.ts:16-17,26` — `isPlatformBrowser()` called 3 times

**Problem:** `isPlatformBrowser(this.platformId)` is evaluated in the constructor (twice, lines 16-17) and again in the `isBrowser` getter (line 26). The platform ID never changes at runtime.

**Plan:** Compute once in the constructor: `private readonly isBrowser = isPlatformBrowser(this.platformId)`. Use the stored value everywhere.

### 70e. `preferences.ts:42-44` — Arrow functions instead of `computed()`

**Problem:** The readonly accessors (`colorTheme`, `darkMode`, `sidenavOpened`) are plain arrow functions, not `computed()` signals. They work as signal-like callables (calling them tracks the dependency on `this.preferences`), but they lack memoization and are not true signals compatible with `toObservable()` or Angular's signal debugging tools.

**Plan:** Convert to `computed()` signals for memoization and tooling support.

### 70f. `feature-flags.ts:18` — Unnecessary defensive copy

**Problem:** `{ ...environment.featureFlags }` creates a shallow copy of the environment flags. Since `environment` is a constant module-level object and `FeatureFlags` only reads from `flags`, the spread is unnecessary.

**Plan:** Use `environment.featureFlags` directly without spreading.

### 70g. `profile-service.ts:49,59` — Redundant non-null assertions

**Problem:** `unwrap(...)!` uses the non-null assertion after `unwrap`. If `unwrap` throws on error, the return value is guaranteed non-null, making `!` redundant. If `unwrap` can return null, the assertion hides a potential bug.

**Plan:** Remove the `!` assertions — `unwrap` already guarantees non-null on success.

---

## Iteration 71 — Simplify shared components

Clean up shared UI components — replace legacy patterns with modern Angular equivalents.

### 71a. `data-table.ts:181` — `ngOnChanges` instead of `effect()`

**Problem:** The component uses `input()` signals for all its inputs but then uses the old `ngOnChanges` lifecycle hook to watch the `data` input for changes. This is inconsistent with the signal-based architecture.

**Plan:** Replace `ngOnChanges` with an `effect()` that reacts to `this.data()`. Remove the `OnChanges` import.

### 71b. `confirm-dialog-service.ts:29-33` — Manual Promise wrapping

**Problem:** The `afterClosed()` Observable is manually wrapped in `new Promise()`. RxJS provides `firstValueFrom()` for exactly this purpose.

**Plan:** Replace with:

```ts
const result = await firstValueFrom(dialogRef.afterClosed());
return result === true;
```

### 71c. `confirm-dialog.ts:25-31` — Wrapper methods replaceable by directives

**Problem:** `onCancel()` and `onConfirm()` each just call `this.dialogRef.close(value)`. These can be replaced with `[mat-dialog-close]="false"` and `[mat-dialog-close]="true"` directives directly in the template.

**Plan:** Use `[mat-dialog-close]` directives, remove both methods, and remove the `MatDialogRef` injection if no longer needed.

### 71d. `toast.ts:12-40` — Three near-identical methods

**Problem:** `success()`, `error()`, and `info()` share four identical options (`horizontalPosition`, `verticalPosition`, action text `'Close'`). Only `duration`, `panelClass`, and `politeness` differ.

**Plan:** Extract a private `show()` helper and have the three public methods delegate to it.

### 71e. `time-ago.pipe.ts:16-17` — Redundant checks

**Problem:** `if (seconds < 0) return 'just now'` is redundant because the next check `if (seconds < 60) return 'just now'` already covers it. Also, `pure: true` is the default for Angular pipes — specifying it is redundant.

**Plan:** Remove the `seconds < 0` check. Remove `pure: true` from the decorator.

### 71f. `connection-indicator.ts:71-81` — Duplicate switch cases

**Problem:** `'connected'` and `'connecting'` both return `'wifi'`; `'reconnecting'` and `'disconnected'` both return `'wifi_off'`. Cases can be collapsed using fall-through.

**Plan:** Collapse duplicate cases.

### 71g. `password-strength.ts:107` — Nested ternary violates conventions

**Problem:** Score calculation uses chained ternaries (`len >= 15 ? 4 : len >= 12 ? 3 : len >= min ? 2 : 1`). CLAUDE.md conventions discourage nested ternaries.

**Plan:** Replace with an `if/else` chain or a helper function.

---

## Iteration 72 — Fix inconsistent patterns

Align host binding approaches, dark mode strategy, and signal vs plain property usage across the codebase.

### 72a. Dark mode strategy — mixed approaches

**Problem:** Some components use `:host-context(.dark-mode)` with hardcoded colors (`data-table.ts`, `theme-picker.ts`, `social-login-button.ts`, `skeleton.ts`), while others use CSS custom properties (`var(--mat-sys-*)`) that auto-adapt to the theme. The hardcoded approach breaks if theme colors change.

**Files affected:** `data-table.ts:121`, `theme-picker.ts:100-108`, `social-login-button.ts:78-94`, `skeleton.ts:34`

**Plan:** Migrate `:host-context(.dark-mode)` blocks to use CSS custom properties where possible. This brings these components in line with the rest of the app's theming strategy.

### 72b. Host binding style — `@HostBinding` vs `host` metadata

**Problem:** `avatar.ts` uses the modern `host` metadata property in `@Component`, while `skeleton-overlay.ts:17-25` uses the older `@HostBinding` decorator. Both patterns work but should be consistent.

**Plan:** Migrate `skeleton-overlay.ts` to use the `host` metadata pattern.

### 72c. Signal vs plain property — inconsistent state primitives

| File            | Line    | Property                                       | Issue                                            |
| --------------- | ------- | ---------------------------------------------- | ------------------------------------------------ |
| `notes-list.ts` | 139-140 | `currentPage` is a signal, `pageSize` is plain | Inconsistent                                     |
| `note-form.ts`  | 93      | `noteId`                                       | Plain property, should be signal for consistency |
| `chat-room.ts`  | 204     | `newMessage`                                   | Plain property with `[(ngModel)]`                |

**Plan:** Convert to signals for consistency with the zoneless architecture. For `[(ngModel)]` bindings, evaluate whether to use reactive forms or signal-based two-way binding.

### 72d. `realtime.ts:94` — Minor race condition in `connectionStatus`

**Problem:** `connectionStatus.set('connecting')` is called after `.subscribe()`, but the subscribe callback may have already fired (setting `'connected'`) by the time line 94 executes, potentially overwriting `'connected'` with `'connecting'`.

**Plan:** Move `connectionStatus.set('connecting')` before the `.subscribe()` call.

---

## Iteration 73 — Landing page CSS cleanup

Address the largest inline style block in the codebase.

### 73a. `landing.ts:109-360` — Excessive `!important` overrides and large inline CSS

**Problem:** 10 `!important` overrides fighting Angular Material defaults, and ~250 lines of inline CSS — the largest inline style block in the codebase. Hardcoded dark-theme-only colors (`#121215`, `#1e1e22`, `#262336`) that will clash in light mode.

**Plan:** Refactor styles to use proper Material theming instead of `!important`. Consider extracting to an external SCSS file given the size. Address hardcoded colors with CSS custom properties.

---

## Iteration 74 — Low-priority cleanup

Minor improvements that reduce noise without changing behavior.

### 74a. `standalone: true` is redundant on Angular 19+

All components declare `standalone: true`, but since Angular 19 this is the default. This is boilerplate across every component file.

**Plan:** Remove `standalone: true` from all component decorators.

### 74b. Verbose JSDoc comments restating obvious code

**Files:** `auth-guard.ts`, `global-error-handler.ts`, `app.config.ts`, `app.routes.ts`, `connection-indicator.ts`, `notes-store.ts:6-18`

**Problem:** Block comments that describe what the code does ("Functional style, no class needed", "This replaces the traditional NgModule-based app.module.ts") rather than why. The code is self-documenting.

**Plan:** Remove or trim to only non-obvious information (e.g., keep the `NgZone.run()` note in global-error-handler, remove the rest).

### 74c. `role-guard.ts:9` — `UserRole` type vs JSDoc mismatch

**Problem:** `UserRole` is defined as `'user' | 'admin'`, but the JSDoc mentions `roleGuard('admin', 'moderator')` as example usage. `'moderator'` is not a valid `UserRole`.

**Plan:** Fix the JSDoc example to only reference valid `UserRole` values.

### 74d. `component-test.ts:258-269` — Auth check performed twice

**Problem:** Auth is checked in `ngOnInit` (line 260) and again at the top of `loadNotes` (line 267). The guard in `loadNotes` is redundant since `ngOnInit` already gates the call.

**Plan:** Remove the redundant check in `loadNotes`.

---

## Summary

| Iteration | Name                            | Category       | Items | Status  |
| --------- | ------------------------------- | -------------- | ----- | ------- |
| 66        | Fix zoneless signal bugs        | Bugs           | 4     | Pending |
| 67        | Remove dead code                | Dead Code      | 5     | Pending |
| 68        | Consolidate duplicated patterns | Duplication    | 8     | Pending |
| 69        | Fix import path inconsistencies | Consistency    | 2     | Pending |
| 70        | Simplify core services          | Simplification | 7     | Pending |
| 71        | Simplify shared components      | Simplification | 7     | Pending |
| 72        | Fix inconsistent patterns       | Consistency    | 4     | Pending |
| 73        | Landing page CSS cleanup        | Styles         | 1     | Pending |
| 74        | Low-priority cleanup            | Cleanup        | 4     | Pending |

**Total iterations**: 9 (66-74). **Total items**: 42.
