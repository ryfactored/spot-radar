# Angular Template - Next Phases

---

## This PR

### New Shared Components
- **DataTable** - Reusable table with sorting, pagination, row selection, and server-side pagination support
- **SearchInput** - Debounced search input with clear button
- **ThemePicker** - Color theme selector (Default/Ocean/Forest) with dark mode toggle
- **SocialLoginButton** - OAuth provider button with dynamic SVG icons

### New Layouts & Pages
- **PublicLayout** - Layout wrapper for unauthenticated pages
- **Landing** - Public landing page for guests (redirects to dashboard if authenticated)

### Enhancements
- **AuthService** - Consolidated OAuth into single `signInWithProvider()` method supporting Google, GitHub, Spotify, Discord, Apple
- **PreferencesService** - Added color theme support alongside existing dark mode
- **Shell** - Integrated theme picker and improved mobile responsiveness
- **Themes** - Extracted to `src/_themes.scss` partial with three color palettes (Indigo/Pink, Blue/Teal, Green/Amber)

### Test Coverage
- Added unit tests for all new components (DataTable, SearchInput, ThemePicker, SocialLoginButton, Landing, PublicLayout)

---

## Current State

The template includes:

- **Authentication** - Email/password and OAuth (Google, GitHub, Spotify, Discord, Apple) via Supabase
- **Theming** - Three color themes (Default, Ocean, Forest) with light/dark mode support
- **Layouts** - Shell layout for authenticated users, public layout for guests
- **Shared Components** - DataTable, SearchInput, ThemePicker, SocialLoginButton, Toast, ConfirmDialog, LoadingSpinner, EmptyState
- **Test Coverage** - 114 unit tests across 33 test files, 14 E2E tests with Playwright

Build: 1.48 MB initial | Tests: All passing

---

## Completed Iterations

### Iteration 13: Environment Configuration ✅

**Goal:** Move hardcoded configuration to environment files for proper dev/prod separation.

- [x] Create `src/environments/environment.prod.ts` (production)
- [x] Update `angular.json` fileReplacements for production builds

---

### Iteration 14: Form Validation Enhancements ✅

**Goal:** Improve user experience on authentication forms.

- [x] Create `PasswordStrength` component with visual strength bar (weak/fair/good/strong)
- [x] Create `matchValidator` for password confirmation
- [x] Update Register form with password strength indicator, match validation, and visibility toggle
- [x] Update Login form with password visibility toggle
- [x] Add `subscriptSizing="fixed"` to prevent layout shift from validation errors
- [x] Export new components from shared barrel
- [x] All 109 tests passing

**New files:**
- `src/app/shared/password-strength/password-strength.ts`
- `src/app/shared/validators/match.validator.ts`

---

### Iteration 15: Error Handling & User-Friendly Messages ✅

**Goal:** Hide Supabase internals from users. Show helpful, actionable error messages instead of raw database errors.

**Architecture:**
- `mapToError()` function converts raw Supabase/PostgreSQL errors to user-friendly `AppError` objects
- `GlobalErrorHandler` intercepts all uncaught errors and displays sanitized messages via toast
- Services throw mapped errors so UI never sees raw database details

**Error categories handled:**
- **Auth errors** - invalid credentials, email taken, weak password, expired session
- **Database errors** - foreign key violations, unique constraints, not null violations
- **Network errors** - offline, timeout, fetch failures
- **Rate limiting** - too many requests

**Files modified:**
- `src/app/core/auth.ts` - throws mapped errors
- `src/app/core/http-error-interceptor.ts` - hardened default case
- `src/app/core/global-error-handler.ts` - uses mapper before toast
- `src/app/features/notes/notes.ts` - throws mapped errors
- `src/app/features/profile/profile-service.ts` - throws mapped errors

**New files:**
- `src/app/core/error-mapper.ts` - `mapToError()`, `AppError` type, error patterns
- `src/app/core/error-mapper.spec.ts` - 4 unit tests

**Example mappings:**
| Raw Error | User Message |
|-----------|--------------|
| `invalid_credentials` | "Invalid email or password" |
| `23503` foreign key | "This operation could not be completed" |
| `JWT expired` | "Your session has expired. Please sign in again." |
| Network failure | "Unable to connect. Please check your internet connection." |

**Note:** Raw errors remain visible in browser Network tab (inherent to client-side Supabase SDK). For sensitive apps requiring full sanitization, use Supabase Edge Functions as a backend proxy.

**Tests:** 114 unit tests passing, 14 E2E tests passing

---

## Next Iterations

### Iteration 16: Loading States & Skeletons

**Goal:** Improve perceived performance with loading indicators.

- [ ] Create skeleton loader components for common patterns
- [ ] Add loading states to OAuth redirect flows
- [ ] Implement optimistic UI updates for data mutations
- [ ] Add page transition animations
- [ ] Create skeleton variants for cards, tables, and lists

---

### Iteration 17: Accessibility Audit

**Goal:** Ensure the application is accessible to all users.

- [ ] Run Lighthouse accessibility audit
- [ ] Add ARIA labels to all interactive elements
- [ ] Verify keyboard navigation throughout app
- [ ] Test with screen readers (VoiceOver/NVDA)
- [ ] Add skip links for main content
- [ ] Ensure sufficient color contrast in all themes

---

### Iteration 18: Performance Optimization

**Goal:** Optimize bundle size and runtime performance.

- [ ] Implement route-based code splitting for feature modules
- [ ] Add service worker for offline support
- [ ] Review and optimize bundle with webpack-bundle-analyzer
- [ ] Implement virtual scrolling for large lists
- [ ] Add image lazy loading and optimization

---

### Iteration 19: Testing Expansion

**Goal:** Increase test coverage and add E2E tests for critical flows.

- [ ] Increase unit test coverage to 80%+
- [ ] Add E2E tests for complete auth flow (login → dashboard → logout)
- [ ] Add E2E tests for profile update flow
- [ ] Add E2E tests for notes CRUD operations
- [ ] Set up visual regression testing with Playwright

---

### Iteration 20: CI/CD Improvements

**Goal:** Automate quality checks and deployment.

- [ ] Add GitHub Actions workflow for PR checks
- [ ] Run linting on PR
- [ ] Run unit tests on PR
- [ ] Run E2E tests on PR
- [ ] Add automated deployment to staging for PRs
- [ ] Add production deployment on merge to main

---

**Pattern**: Each iteration should end with verification that build passes and tests are green before moving to the next.
