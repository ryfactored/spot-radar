# Angular 21 Starter Template - Iteration Guide

---

## Iteration 0: Prerequisites & Environment Setup

### 0.1 Verify Node.js
- [ ] Run `node --version`
- [ ] Ensure Node.js 20.x or 22.x is installed
- [ ] If not, install from https://nodejs.org

### 0.2 Verify/Install Angular CLI
- [ ] Run `ng version` to check current version
- [ ] If not installed or not v21: `npm install -g @angular/cli@21`
- [ ] Re-run `ng version` to confirm Angular CLI 21.x.x

### 0.3 Verify Git
- [ ] Run `git --version`
- [ ] Ensure git is installed and configured

### 0.4 Accounts Ready
- [ ] GitHub account (you have this - repo exists)
- [ ] Vercel account at https://vercel.com (sign up with GitHub)
- [ ] Supabase account at https://supabase.com (for later iterations)

---

## Iteration 1: Project Foundation

### 1.1 Create Angular App
- [ ] Run `ng new angular-template --directory . --style scss --routing --ssr false`
- [ ] Wait for installation to complete

### 1.2 Verify Locally
- [ ] Run `ng serve`
- [ ] Open http://localhost:4200
- [ ] Confirm Angular welcome page loads
- [ ] Stop server with Ctrl+C

### 1.3 Push to GitHub
- [ ] Run `git add .`
- [ ] Run `git commit -m "Initialize Angular 21 app"`
- [ ] Run `git push`

### 1.4 Deploy to Vercel
- [ ] Go to https://vercel.com
- [ ] Click "Add New Project"
- [ ] Import `angular-template` repository
- [ ] Accept auto-detected settings
- [ ] Click "Deploy"
- [ ] Wait for build to complete

### 1.5 Preview
- [ ] Open Vercel preview URL
- [ ] Confirm Angular welcome page loads
- [ ] Copy URL for reference

## Iteration 2: Styling & Layout
- [ ] Install Angular Material
- [ ] Configure Material theming (light/dark)
- [ ] Create app shell layout (header, sidebar, content)
- [ ] Add responsive navigation
- [ ] Deploy & preview

## Iteration 3: Supabase Setup
- [ ] Create Supabase project
- [ ] Install Supabase JS client
- [ ] Configure environment variables
- [ ] Create Supabase service wrapper
- [ ] Test connection
- [ ] Deploy & preview

## Iteration 4: Authentication
- [ ] Implement AuthService (register, login, logout)
- [ ] Add email/password auth
- [ ] Add Google OAuth
- [ ] Add GitHub OAuth
- [ ] Create auth guards (AuthGuard, GuestGuard)
- [ ] Deploy & preview

## Iteration 5: Auth UI
- [ ] Create auth layout
- [ ] Build login page with form validation
- [ ] Build register page
- [ ] Build forgot password page
- [ ] Handle OAuth callbacks
- [ ] Deploy & preview

## Iteration 6: User Profile
- [ ] Create profiles table in Supabase
- [ ] Build profile view page
- [ ] Build profile edit form
- [ ] Add avatar upload
- [ ] Deploy & preview

## Iteration 7: Shared Components
- [ ] Create button component (variants)
- [ ] Create input component (with validation)
- [ ] Create card component
- [ ] Create modal/dialog service
- [ ] Create toast notification service
- [ ] Deploy & preview

## Iteration 8: CRUD Example Feature
- [ ] Create example table in Supabase (e.g., "notes")
- [ ] Build list view with pagination
- [ ] Build create form
- [ ] Build edit form
- [ ] Add delete with confirmation
- [ ] Add search/filter
- [ ] Deploy & preview

## Iteration 9: State Management
- [ ] Create signals-based auth store
- [ ] Create example feature store
- [ ] Add state persistence to localStorage
- [ ] Deploy & preview

## Iteration 10: Error Handling & UX
- [ ] Add global error handler
- [ ] Create error boundary component
- [ ] Add loading skeletons
- [ ] Add empty state components
- [ ] Deploy & preview

## Iteration 11: Testing
- [ ] Configure Jest
- [ ] Write service tests (AuthService)
- [ ] Write component tests
- [ ] Write guard tests
- [ ] Set up Playwright for E2E
- [ ] Write basic auth flow E2E test

## Iteration 12: Documentation & Polish
- [ ] Write comprehensive README
- [ ] Add setup instructions
- [ ] Document architecture decisions
- [ ] Add code comments on patterns
- [ ] Final deploy & preview

---

**Pattern**: Each iteration ends with deploy & preview to maintain a working app at all times.