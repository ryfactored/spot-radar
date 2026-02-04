# Angular Starter - Phase 9

**Goal**: Miscellaneous housekeeping and improvements.

---

## Iteration 84 — Normalize git author names

The git history contains 4 different author names for the same person:

| Author Name | Commits |
| ----------- | ------- |
| Ryan        | 54      |
| ryherring48 | 20      |
| ry          | 12      |
| ryfactored  | 1       |

### Plan

Use `git filter-repo` to rewrite all commits so the author name is consistently `ry`. This rewrites commit hashes for every affected commit (effectively the entire history).

**Command:**

```bash
git filter-repo --name-callback 'return b"ry"' --force
```

This replaces the author name **and** committer name on every commit with `ry`, regardless of the original value. Email addresses are left unchanged.

**Post-rewrite steps:**

1. Verify with `git log --format="%an" | sort | uniq -c`
2. Re-add the remote origin (filter-repo removes it as a safety measure)
3. Force push: `git push --force`

### Caveats

- **All commit hashes change.** Anyone with an existing clone must re-clone.
- `git filter-repo` must be installed (`pip install git-filter-repo`).
- The remote origin is automatically removed by `git filter-repo` and must be re-added manually.

---

## Iteration 85 — Reorganize `core/` into domain sub-folders

The `core/` directory had 15 implementation files (+ 14 spec files) in a flat structure. As the number of files grew, the flat layout made it harder to see which files belong together.

### Plan

Move files into three domain sub-folders (`auth/`, `errors/`, `supabase/`) while keeping four standalone files at the root. The root `index.ts` barrel absorbs all path changes so every `@core` import across the codebase remains unchanged.

**Target structure:**

```
core/
├── index.ts                        ← updated re-exports (only file external consumers use)
├── auth/
│   ├── auth.ts                     ← AuthService
│   ├── auth.spec.ts
│   ├── auth-guard.ts               ← authGuard, guestGuard
│   ├── auth-guard.spec.ts
│   ├── role-guard.ts               ← roleGuard, UserRole
│   └── role-guard.spec.ts
├── errors/
│   ├── error-mapper.ts             ← mapError, mapToError, unwrap, unwrapWithCount
│   ├── error-mapper.spec.ts
│   ├── global-error-handler.ts     ← GlobalErrorHandler
│   ├── global-error-handler.spec.ts
│   ├── http-error-interceptor.ts   ← httpErrorInterceptor
│   ├── http-error-interceptor.spec.ts
│   ├── extract-error-message.ts    ← extractErrorMessage
│   ├── extract-error-message.spec.ts
│   └── supabase-errors.ts          ← SUPABASE_ERRORS constants
├── supabase/
│   ├── supabase.ts                 ← SupabaseService
│   ├── supabase.spec.ts
│   ├── storage.ts                  ← StorageService
│   ├── storage.spec.ts
│   ├── realtime.ts                 ← RealtimeService
│   └── realtime.spec.ts
├── preferences.ts                  ← PreferencesService (root)
├── preferences.spec.ts
├── feature-flags.ts                ← FeatureFlags (root)
├── feature-flags.spec.ts
├── feature-flag-guard.ts           ← featureFlagGuard (root)
├── feature-flag-guard.spec.ts
├── unsaved-changes-guard.ts        ← unsavedChangesGuard (root)
└── unsaved-changes-guard.spec.ts
```

### Changes

1. **Moved 21 files** via `git mv` into `auth/`, `errors/`, and `supabase/` sub-folders.
2. **Updated cross-folder imports** in 6 implementation/spec files (`auth.ts`, `role-guard.ts`, `storage.ts`, `preferences.ts`, `auth.spec.ts`, `role-guard.spec.ts`).
3. **Updated `core/index.ts`** — all 20 export paths rewritten with domain grouping comments.
4. **Fixed `app.spec.ts`** — changed direct `./core/preferences` import to `@core`.

### What did NOT change

- All `@core` imports across `features/`, `shared/`, `layouts/` — the barrel absorbed the restructuring.
- The `tsconfig` path alias — `@core` still points to `src/app/core`.
- No sub-barrel files were added — the root `index.ts` imports directly from sub-folders.

### Verification

- `npm run build` — passes
- `npm test -- --no-watch` — all 370 tests pass
- `npm run lint` — clean

---

## Summary

| Iteration | Name                                       | Category     | Items | Status |
| --------- | ------------------------------------------ | ------------ | ----- | ------ |
| 84        | Normalize git author names                 | Housekeeping | 1     | Done   |
| 85        | Reorganize `core/` into domain sub-folders | Housekeeping | 4     | Done   |

**Total iterations**: 2 (84–85).
