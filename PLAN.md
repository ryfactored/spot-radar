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

### 2.1 Install Angular Material
- [ ] Run `ng add @angular/material`
- [ ] Select: Theme → Custom
- [ ] Select: Typography → Yes
- [ ] Select: Animations → Yes

### 2.2 Configure Custom Theme
- [ ] Edit `src/styles.scss` with custom light/dark theme
- [ ] Define primary palette (indigo)
- [ ] Define accent palette (pink)
- [ ] Add `.dark-theme` class for dark mode

### 2.3 Create Project Structure
- [ ] Create `src/app/core/` folder
- [ ] Create `src/app/shared/` folder
- [ ] Create `src/app/features/` folder
- [ ] Create `src/app/layouts/` folder

**Folder purposes:**
| Folder | Purpose |
|--------|---------|
| `core/` | Singleton services, guards, interceptors (loaded once) |
| `shared/` | Reusable components, directives, pipes (imported many times) |
| `features/` | Feature modules like dashboard, profile, etc. (lazy-loaded) |
| `layouts/` | Page layouts (shell with sidebar, auth layout, etc.) |

### 2.4 Create Shell Layout Component
- [ ] Run `ng generate component layouts/shell --standalone`
- [ ] Add Material imports (Toolbar, Sidenav, List, Icon, Button)
- [ ] Create shell template with sidebar and toolbar
- [ ] Add shell styles

**What is a shell layout?**
The "shell" is the main app wrapper that stays constant while inner content changes. It contains:
- **Toolbar**: Top bar with menu button, app title, user actions
- **Sidenav**: Collapsible sidebar for navigation
- **Content area**: Where routed pages render via `<router-outlet>`

**Note:** Angular 21 uses simplified filenames (e.g., `shell.ts` instead of `shell.component.ts`).

**shell.ts:**
```typescript
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    RouterOutlet,
    MatToolbarModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
  ],
  templateUrl: './shell.html',
  styleUrl: './shell.scss'
})
export class Shell {
  sidenavOpened = true;
}
```

**shell.html:**
```html
<mat-sidenav-container class="shell-container">
  <mat-sidenav #sidenav mode="side" [opened]="sidenavOpened">
    <mat-nav-list>
      <a mat-list-item routerLink="/dashboard">
        <mat-icon matListItemIcon>dashboard</mat-icon>
        <span matListItemTitle>Dashboard</span>
      </a>
      <a mat-list-item routerLink="/profile">
        <mat-icon matListItemIcon>person</mat-icon>
        <span matListItemTitle>Profile</span>
      </a>
    </mat-nav-list>
  </mat-sidenav>

  <mat-sidenav-content>
    <mat-toolbar color="primary">
      <button mat-icon-button (click)="sidenav.toggle()">
        <mat-icon>menu</mat-icon>
      </button>
      <span>Angular Starter</span>
      <span class="spacer"></span>
      <button mat-icon-button>
        <mat-icon>account_circle</mat-icon>
      </button>
    </mat-toolbar>

    <main class="content">
      <router-outlet />
    </main>
  </mat-sidenav-content>
</mat-sidenav-container>
```

**shell.scss:**
```scss
.shell-container {
  height: 100vh;
}

mat-sidenav {
  width: 250px;
}

.spacer {
  flex: 1 1 auto;
}

.content {
  padding: 20px;
}
```

**Why these choices:**
- `mode="side"` keeps sidenav always visible on desktop (vs `over` which overlays)
- `#sidenav` template reference lets the toolbar button toggle it
- `routerLink` for navigation (will work once routing is set up)
- `.spacer` with `flex: 1 1 auto` pushes the user icon to the right

### 2.5 Create Dashboard Placeholder
- [ ] Run `ng generate component features/dashboard --standalone`

### 2.6 Update Routing
- [ ] Edit `src/app/app.routes.ts`
- [ ] Add ShellComponent as parent route
- [ ] Add lazy-loaded dashboard child route

### 2.7 Verify Locally
- [ ] Run `ng serve`
- [ ] Open http://localhost:4200
- [ ] Confirm shell layout displays (sidebar + toolbar)
- [ ] Test sidebar toggle button

### 2.8 Push & Deploy
- [ ] Run `git add .`
- [ ] Run `git commit -m "Add Angular Material and shell layout"`
- [ ] Run `git push`
- [ ] Verify Vercel auto-deploys
- [ ] Check preview URL

## Iteration 3: Supabase Setup

### 3.1 Create Supabase Project
- [ ] Go to https://supabase.com
- [ ] Sign in / create account
- [ ] Click "New Project"
- [ ] Enter project name (e.g., "angular-starter")
- [ ] Set a database password (save this somewhere safe)
- [ ] Select region closest to you
- [ ] Click "Create new project"
- [ ] Wait for project to provision (~2 minutes)

### 3.2 Get API Credentials
- [ ] Go to Project Settings → API
- [ ] Copy the **Project URL** (e.g., `https://xxxxx.supabase.co`)
- [ ] Copy the **anon public** key (safe to expose in frontend)

### 3.3 Install Supabase JS Client
- [ ] Run `npm install @supabase/supabase-js`

### 3.4 Configure Environment Variables
- [ ] Create `src/environments/environment.ts`
- [ ] Create `src/environments/environment.prod.ts`
- [ ] Add Supabase URL and anon key to both

**environment.ts:**
```typescript
export const environment = {
  production: false,
  supabaseUrl: 'YOUR_PROJECT_URL',
  supabaseAnonKey: 'YOUR_ANON_KEY'
};
```

### 3.5 Create Supabase Service
- [ ] Run `ng generate service core/supabase`
- [ ] Initialize Supabase client in service

**supabase.service.ts (or supabase.ts):**
```typescript
import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseAnonKey
    );
  }

  get client(): SupabaseClient {
    return this.supabase;
  }
}
```

### 3.6 Test Connection
- [ ] Inject SupabaseService into Dashboard component
- [ ] Log client to console to verify initialization
- [ ] Run `ng serve` and check browser console

### 3.7 Push & Deploy
- [ ] Run `git add .`
- [ ] Run `git commit -m "Add Supabase integration"`
- [ ] Run `git push`
- [ ] Add environment variables to Vercel (Settings → Environment Variables)
- [ ] Verify deployment

## Iteration 4: Authentication

### 4.1 Create Auth Service
- [ ] Run `ng generate service core/auth`
- [ ] Implement signup, login, logout, and session methods

**auth.ts:**
```typescript
import { Injectable, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase';
import { User } from '@supabase/supabase-js';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private supabase = inject(SupabaseService);

  currentUser = signal<User | null>(null);
  loading = signal(true);

  constructor() {
    this.loadUser();
    this.supabase.client.auth.onAuthStateChange((event, session) => {
      this.currentUser.set(session?.user ?? null);
      this.loading.set(false);
    });
  }

  private async loadUser() {
    const { data } = await this.supabase.client.auth.getSession();
    this.currentUser.set(data.session?.user ?? null);
    this.loading.set(false);
  }

  async signUp(email: string, password: string) {
    const { data, error } = await this.supabase.client.auth.signUp({
      email,
      password
    });
    if (error) throw error;
    return data;
  }

  async signIn(email: string, password: string) {
    const { data, error } = await this.supabase.client.auth.signInWithPassword({
      email,
      password
    });
    if (error) throw error;
    return data;
  }

  async signInWithGoogle() {
    const { data, error } = await this.supabase.client.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    });
    if (error) throw error;
    return data;
  }

  async signInWithGithub() {
    const { data, error } = await this.supabase.client.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: window.location.origin }
    });
    if (error) throw error;
    return data;
  }

  async signOut() {
    const { error } = await this.supabase.client.auth.signOut();
    if (error) throw error;
  }
}
```

### 4.2 Enable Auth Providers in Supabase
- [ ] Go to Supabase Dashboard → Authentication → Providers
- [ ] Email is enabled by default
- [ ] Enable Google (requires Google Cloud OAuth credentials)
- [ ] Enable GitHub (requires GitHub OAuth App)

**For Google:**

1. Go to https://console.cloud.google.com
2. Create a new project (or select existing)
   - Name it something generic like "my-apps" if you plan to reuse for multiple apps
3. Go to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth client ID**
5. If prompted, configure the **OAuth consent screen** first:
   - User type: **External**
   - App name: your app name (users see this on sign-in screen)
   - Support email: your email
   - Developer contact email: your email
   - Save (skip optional fields)
6. Back to Credentials → **Create Credentials** → **OAuth client ID**
7. Application type: **Web application**
8. Name: anything (e.g., "Angular Starter")
9. Authorized redirect URIs - add:
   ```
   https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback
   ```
   (Find YOUR_PROJECT_ID in your Supabase project URL)
10. Click **Create**
11. Copy the **Client ID** and **Client Secret**
12. Go to Supabase Dashboard → **Authentication** → **Providers**
13. Find **Google** and enable it
14. Paste your Client ID and Client Secret
15. Save

**For GitHub:**

1. Go to https://github.com/settings/developers
2. Click **OAuth Apps** → **New OAuth App**
3. Fill in:
   - Application name: your app name
   - Homepage URL: your app URL (or `http://localhost:4200` for now)
   - Authorization callback URL:
     ```
     https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback
     ```
4. Click **Register application**
5. Copy the **Client ID**
6. Click **Generate a new client secret** and copy it
7. Go to Supabase Dashboard → **Authentication** → **Providers**
8. Find **GitHub** and enable it
9. Paste your Client ID and Client Secret
10. Save

### 4.3 Create Auth Guard
- [ ] Run `ng generate guard core/auth --functional`
- [ ] Protect routes that require authentication

**auth.guard.ts:**
```typescript
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth';

export const authGuard = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.currentUser()) {
    return true;
  }
  return router.parseUrl('/login');
};
```

### 4.4 Create Guest Guard
- [ ] Redirect logged-in users away from auth pages

**guest.guard.ts:**
```typescript
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth';

export const guestGuard = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.currentUser()) {
    return true;
  }
  return router.parseUrl('/dashboard');
};
```

### 4.5 Test Auth Service
- [ ] Inject AuthService into Dashboard
- [ ] Add temporary signup/login buttons for testing
- [ ] Verify auth flow works

### 4.6 Push & Deploy
- [ ] Run `git add .`
- [ ] Run `git commit -m "Add authentication service and guards"`
- [ ] Run `git push`
- [ ] Verify deployment

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