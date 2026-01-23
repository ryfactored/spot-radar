# Angular 21 Starter Template - Iteration Guide

---

## Iteration 0: Prerequisites & Environment Setup

**Why this matters:**
Before writing code, we ensure all tools are installed and accounts are ready. Skipping this leads to frustrating errors mid-development. This iteration is about setting up a solid foundation.

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

### 0.5 VS Code Extensions
Install these extensions for the best Angular development experience.

**Essential:**
| Extension | Purpose |
|-----------|---------|
| Angular Language Service | Autocomplete, errors in templates, go-to-definition |
| ESLint | Linting and code quality |
| Prettier | Consistent code formatting |

**Highly Recommended:**
| Extension | Purpose |
|-----------|---------|
| TypeScript Importer | Auto-imports when you type class names |
| Auto Rename Tag | Rename opening tag, closing tag updates too |
| GitLens | Blame annotations, history, powerful git features |
| Error Lens | Shows errors inline instead of just underlines |

**Nice to Have:**
| Extension | Purpose |
|-----------|---------|
| Material Icon Theme | Better file icons (recognizes Angular files) |
| Path Intellisense | Autocomplete for file paths |
| Todo Tree | Finds all TODOs/FIXMEs in codebase |

**Angular Language Service is the must-have** - without it, you get no help in templates.

---

## Iteration 1: Project Foundation

**What we're building:**
A fresh Angular 21 application with routing enabled and SCSS for styling. We'll deploy it immediately to establish a CI/CD pipeline from day one - every push auto-deploys. This "always deployable" approach catches issues early.

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

**What we're building:**
The visual foundation of the app. Angular Material provides pre-built, accessible UI components following Material Design. We'll create a "shell" layout (sidebar + toolbar) that wraps authenticated pages. This establishes the look and feel users will interact with throughout the app.

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

**Note on Angular 21 naming:**
- **Filenames** are simplified: `shell.ts` instead of `shell.component.ts`
- **Class names** can still be descriptive: `ShellComponent`, `Profile`


**shell.ts:**
```typescript
import { Component } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
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
    RouterLink,      // Required for routerLink directives in template
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

**What we're building:**
The backend connection. Supabase is a "Backend as a Service" that provides a PostgreSQL database, authentication, and real-time subscriptions out of the box. Instead of building our own server, we connect directly from Angular to Supabase's APIs. This dramatically speeds up development.

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

### 3.5 Create Supabase Error Constants
- [ ] Create `src/app/core/supabase-errors.ts`

**Why constants?**
Avoid hardcoded strings scattered throughout the codebase. Named constants are self-documenting, easier to find, and prevent typos.

**supabase-errors.ts:**
```typescript
export const SUPABASE_ERRORS = {
  NO_ROWS_FOUND: 'PGRST116',
  DUPLICATE_KEY: '23505',
  FOREIGN_KEY_VIOLATION: '23503',
  // Add more as needed
} as const;
```

### 3.6 Create Supabase Service
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

**What we're building:**
User authentication - the ability to sign up, log in, and log out. Supabase Auth handles the heavy lifting (password hashing, session tokens, OAuth flows). We create an Angular service to wrap Supabase's auth methods, plus guards to protect routes. By the end, only logged-in users can access the dashboard.

### 4.1 Create Auth Service
- [ ] Run `ng generate service core/auth`
- [ ] Implement signup, login, logout, and session methods

**What this service does:**
A centralized place for all authentication logic. Uses Angular signals (`currentUser`, `loading`) for reactive state - components automatically update when auth state changes. Wraps Supabase auth methods so the rest of the app doesn't need to know about Supabase directly.

**auth.ts:**
```typescript
import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService } from './supabase';
import { User } from '@supabase/supabase-js';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private supabase = inject(SupabaseService);
  private router = inject(Router);

  currentUser = signal<User | null>(null);
  loading = signal(true);

  constructor() {
    this.loadUser();
    this.supabase.client.auth.onAuthStateChange((event, session) => {
      this.currentUser.set(session?.user ?? null);
      this.loading.set(false);

      // Auto-redirect on sign out - centralizes logout behavior
      if (event === 'SIGNED_OUT') {
        this.router.navigate(['/login']);
      }
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

**What guards do:**
Guards are functions that run before a route loads. They decide "can this user access this page?" The authGuard checks if the user is logged in - if not, it redirects to /login. This protects dashboard and other authenticated pages.

**RxJS Operators used in guards:**

| Operator | What it does |
|----------|--------------|
| `toObservable()` | Converts an Angular signal to an RxJS observable stream |
| `filter(fn)` | Only passes values that match condition (like Array.filter) |
| `take(1)` | Takes first matching value then auto-unsubscribes |
| `map(fn)` | Transforms the value into something else (like Array.map) |

**How the guard flow works:**
```
Signal: loading = true → false
                         ↓
filter(!loading) ──────→ passes "false" through
                         ↓
take(1) ───────────────→ grabs it, stops listening
                         ↓
map() ─────────────────→ returns true (allow) or redirect URL
```

Without `take(1)`, the observable keeps listening forever. With it, we get a one-time auth check that cleans itself up.

**auth-guard.ts:**
```typescript
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, map, take } from 'rxjs';
import { AuthService } from './auth';

export const authGuard = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // Wait for auth to finish loading before checking user
  // This prevents race conditions on OAuth redirects
  return toObservable(auth.loading).pipe(
    filter(loading => !loading),
    take(1),
    map(() => {
      if (auth.currentUser()) {
        return true;
      }
      return router.parseUrl('/login');
    })
  );
};
```

### 4.4 Create Guest Guard
- [ ] Redirect logged-in users away from auth pages

**Why a guest guard?**
The opposite of authGuard. If a user is already logged in and tries to visit /login or /register, redirect them to /dashboard. No point showing login forms to someone already authenticated.

**guest-guard.ts:**
```typescript
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, map, take } from 'rxjs';
import { AuthService } from './auth';

export const guestGuard = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // Wait for auth to finish loading before checking user
  return toObservable(auth.loading).pipe(
    filter(loading => !loading),
    take(1),
    map(() => {
      if (!auth.currentUser()) {
        return true;
      }
      return router.parseUrl('/dashboard');
    })
  );
};
```

### 4.5 Test Auth Service
- [ ] Inject AuthService into Dashboard
- [ ] Add temporary signup/login buttons for testing
- [ ] Configure Supabase redirect URLs
- [ ] Verify auth flow works

**Configure Supabase Redirect URLs:**

OAuth flow: Your app → Google → Supabase callback → **back to your app**

Supabase needs to know where to redirect after auth completes.

1. Go to Supabase Dashboard → **Authentication** → **URL Configuration**
2. Set **Site URL** to your production URL:
   ```
   https://your-app.vercel.app
   ```
3. Add to **Redirect URLs** list:
   ```
   http://localhost:4200
   https://your-app.vercel.app
   ```
4. Save

The `window.location.origin` in AuthService automatically uses the correct URL for dev vs production:
```typescript
options: { redirectTo: window.location.origin }
```

### 4.6 Push & Deploy
- [ ] Run `git add .`
- [ ] Run `git commit -m "Add authentication service and guards"`
- [ ] Run `git push`
- [ ] Verify deployment

## Iteration 5: Auth UI

**What we're building:**
The user-facing authentication pages. We've built the auth service (backend logic) - now we need the login and register forms users actually interact with. We'll create a separate "auth layout" (simple centered card) distinct from the main shell layout, plus proper routing with guards applied.

### 5.1 Create Auth Layout
- [ ] Run `ng generate component layouts/auth-layout --standalone`
- [ ] Simple centered layout for auth pages (no sidebar)

**Why a separate layout?**
The shell layout (sidebar + toolbar) is for authenticated users. Auth pages (login/register) need a simpler, centered design - no navigation since the user isn't logged in yet. Having two layouts lets us swap between them based on auth state.

**auth-layout.ts:**
```typescript
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <div class="auth-container">
      <div class="auth-card">
        <h1 class="app-title">Angular Starter</h1>
        <router-outlet />
      </div>
    </div>
  `,
  styles: `
    .auth-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f5f5f5;
    }
    .auth-card {
      background: white;
      padding: 40px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      width: 100%;
      max-width: 400px;
    }
    .app-title {
      text-align: center;
      margin-bottom: 24px;
      color: #3f51b5;
    }
  `
})
export class AuthLayout {}
```

### 5.2 Create Login Page
- [ ] Run `ng generate component features/auth/login --standalone`
- [ ] Add email/password form with validation
- [ ] Add Google sign-in button
- [ ] Add link to register page

**What this page does:**
The login page is the entry point for returning users. It provides two auth methods:
1. Email/password - traditional form-based login
2. Google OAuth - one-click sign in (configured in Iteration 4)

We use Angular Reactive Forms for validation (required fields, email format) and Material components for consistent styling.

**login.ts:**
```typescript
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '../../../core/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
  ],
  template: `
    <h2>Sign In</h2>

    <form [formGroup]="form" (ngSubmit)="onSubmit()">
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Email</mat-label>
        <input matInput formControlName="email" type="email">
        @if (form.controls.email.hasError('required')) {
          <mat-error>Email is required</mat-error>
        }
        @if (form.controls.email.hasError('email')) {
          <mat-error>Invalid email format</mat-error>
        }
      </mat-form-field>

      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Password</mat-label>
        <input matInput formControlName="password" type="password">
        @if (form.controls.password.hasError('required')) {
          <mat-error>Password is required</mat-error>
        }
      </mat-form-field>

      @if (error) {
        <p class="error">{{ error }}</p>
      }

      <button mat-raised-button color="primary" class="full-width" type="submit" [disabled]="loading">
        {{ loading ? 'Signing in...' : 'Sign In' }}
      </button>
    </form>

    <mat-divider class="divider"></mat-divider>

    <button mat-stroked-button class="full-width google-btn" (click)="loginWithGoogle()">
      <mat-icon>login</mat-icon>
      Continue with Google
    </button>

    <p class="footer">
      Don't have an account? <a routerLink="/register">Sign up</a>
    </p>
  `,
  styles: `
    h2 { text-align: center; margin-bottom: 24px; }
    .full-width { width: 100%; }
    mat-form-field { margin-bottom: 16px; }
    .divider { margin: 24px 0; }
    .google-btn { margin-bottom: 16px; }
    .google-btn mat-icon { margin-right: 8px; }
    .footer { text-align: center; margin-top: 16px; }
    .error { color: #f44336; text-align: center; }
  `
})
export class Login {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  loading = false;
  error = '';

  async onSubmit() {
    if (this.form.invalid) return;

    this.loading = true;
    this.error = '';

    try {
      await this.auth.signIn(this.form.value.email!, this.form.value.password!);
      this.router.navigate(['/dashboard']);
    } catch (err: any) {
      this.error = err.message || 'Login failed';
    } finally {
      this.loading = false;
    }
  }

  async loginWithGoogle() {
    await this.auth.signInWithGoogle();
  }
}
```

### 5.3 Create Register Page
- [ ] Run `ng generate component features/auth/register --standalone`
- [ ] Add email/password form with confirm password
- [ ] Add link to login page

**What this page does:**
The register page lets new users create an account with email/password. It includes:
- Confirm password field to prevent typos
- Password length validation (Supabase requires 6+ characters)
- Success message telling users to check email (Supabase sends confirmation emails by default)

After registration, Supabase handles email verification automatically.

**register.ts:**
```typescript
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../../core/auth';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  template: `
    <h2>Create Account</h2>

    <form [formGroup]="form" (ngSubmit)="onSubmit()">
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Email</mat-label>
        <input matInput formControlName="email" type="email">
        @if (form.controls.email.hasError('required')) {
          <mat-error>Email is required</mat-error>
        }
        @if (form.controls.email.hasError('email')) {
          <mat-error>Invalid email format</mat-error>
        }
      </mat-form-field>

      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Password</mat-label>
        <input matInput formControlName="password" type="password">
        @if (form.controls.password.hasError('required')) {
          <mat-error>Password is required</mat-error>
        }
        @if (form.controls.password.hasError('minlength')) {
          <mat-error>Password must be at least 6 characters</mat-error>
        }
      </mat-form-field>

      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Confirm Password</mat-label>
        <input matInput formControlName="confirmPassword" type="password">
        @if (form.controls.confirmPassword.hasError('required')) {
          <mat-error>Please confirm your password</mat-error>
        }
      </mat-form-field>

      @if (error) {
        <p class="error">{{ error }}</p>
      }

      @if (success) {
        <p class="success">{{ success }}</p>
      }

      <button mat-raised-button color="primary" class="full-width" type="submit" [disabled]="loading">
        {{ loading ? 'Creating account...' : 'Sign Up' }}
      </button>
    </form>

    <p class="footer">
      Already have an account? <a routerLink="/login">Sign in</a>
    </p>
  `,
  styles: `
    h2 { text-align: center; margin-bottom: 24px; }
    .full-width { width: 100%; }
    mat-form-field { margin-bottom: 16px; }
    .footer { text-align: center; margin-top: 16px; }
    .error { color: #f44336; text-align: center; }
    .success { color: #4caf50; text-align: center; }
  `
})
export class Register {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', Validators.required],
  });

  loading = false;
  error = '';
  success = '';

  async onSubmit() {
    if (this.form.invalid) return;

    if (this.form.value.password !== this.form.value.confirmPassword) {
      this.error = 'Passwords do not match';
      return;
    }

    this.loading = true;
    this.error = '';

    try {
      await this.auth.signUp(this.form.value.email!, this.form.value.password!);
      this.success = 'Account created! Check your email to confirm.';
    } catch (err: any) {
      this.error = err.message || 'Registration failed';
    } finally {
      this.loading = false;
    }
  }
}
```

### 5.4 Update Routing
- [ ] Add auth layout with login/register routes
- [ ] Apply guards to routes

**What we're configuring:**
The routing ties everything together:
- Shell layout (with authGuard) wraps protected pages - only accessible when logged in
- Auth layout (with guestGuard) wraps login/register - only accessible when logged out
- Guards automatically redirect users to the right place based on auth state

This creates a seamless flow: unauthenticated users always land on /login, and logging in takes them to /dashboard.

**Updated app.routes.ts:**
```typescript
import { Routes } from '@angular/router';
import { Shell } from './layouts/shell/shell';
import { AuthLayout } from './layouts/auth-layout/auth-layout';
import { authGuard } from './core/auth-guard';
import { guestGuard } from './core/guest-guard';

export const routes: Routes = [
  {
    path: '',
    component: Shell,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard').then(m => m.Dashboard)
      }
    ]
  },
  {
    path: '',
    component: AuthLayout,
    canActivate: [guestGuard],
    children: [
      {
        path: 'login',
        loadComponent: () => import('./features/auth/login/login').then(m => m.Login)
      },
      {
        path: 'register',
        loadComponent: () => import('./features/auth/register/register').then(m => m.Register)
      }
    ]
  }
];
```

### 5.5 Test Auth Flow
- [ ] Run `ng serve`
- [ ] Verify redirect to /login when not authenticated
- [ ] Test login with Google
- [ ] Test login with email/password
- [ ] Verify redirect to /dashboard after login
- [ ] Test logout redirects to /login

### 5.6 Push & Deploy
- [ ] Run `git add .`
- [ ] Run `git commit -m "Add auth UI with login and register pages"`
- [ ] Run `git push`
- [ ] Verify deployment

## Iteration 6: User Profile

**What we're building:**
A user profile system. Supabase Auth gives us basic user info (email, id), but we need a `profiles` table to store additional data (display name, avatar, bio). We'll create the database table, a profile service, and UI pages to view/edit profile info.

### 6.1 Create Profiles Table in Supabase
- [ ] Go to Supabase Dashboard → SQL Editor
- [ ] Run SQL to create profiles table
- [ ] Set up Row Level Security (RLS) policies

**Why a separate profiles table?**
Supabase Auth stores authentication data (email, password hash, tokens). Custom user data (name, avatar, preferences) belongs in your own table, linked by user ID.

**How Row Level Security (RLS) works:**

RLS makes the database check permissions on every row, not just the table.

Without RLS:
```
Anyone with the anon key can: SELECT * FROM profiles
→ Gets ALL users' data 😱
```

With RLS:
```
Same query, but database checks each row against policy
→ Only returns rows where auth.uid() = id (your data only) ✅
```

**Policy breakdown:**
```sql
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);
```

| Part | Meaning |
|------|---------|
| `FOR SELECT` | This policy applies to read operations |
| `USING (...)` | Condition that must be true for each row |
| `auth.uid()` | Supabase function returning current user's ID (from JWT) |
| `= id` | Compare to the `id` column in profiles table |

**Visual example:**
```
profiles table:
┌──────────────────────────┬─────────────┐
│ id                       │ display_name│
├──────────────────────────┼─────────────┤
│ abc-123 (you)            │ You         │ ← auth.uid() = id ✅ returned
│ def-456 (someone else)   │ User B      │ ← auth.uid() ≠ id ❌ hidden
│ ghi-789 (someone else)   │ User C      │ ← auth.uid() ≠ id ❌ hidden
└──────────────────────────┴─────────────┘
```

The anon key is safe because RLS ensures users only see their own data.

**Run this SQL in Supabase:**
```sql
-- Create profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Policy: Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Auto-create profile when user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call function on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

### 6.2 Create Profile Service
- [ ] Run `ng generate service core/profile`
- [ ] Add methods to get and update profile

**profile.ts:**
```typescript
import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase';
import { AuthService } from './auth';
import { SUPABASE_ERRORS } from './supabase-errors';

export interface Profile {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private supabase = inject(SupabaseService);
  private auth = inject(AuthService);

  async getProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await this.supabase.client
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    // If no profile exists, create one
    if (error?.code === SUPABASE_ERRORS.NO_ROWS_FOUND) {
      return this.createProfile(userId);
    }

    if (error) throw error;
    return data;
  }

  private async createProfile(userId: string): Promise<Profile> {
    const user = this.auth.currentUser();
    const email = user?.email || '';
    const displayName = user?.user_metadata?.['full_name'] || email;

    const { data, error } = await this.supabase.client
      .from('profiles')
      .insert({
        id: userId,
        email: email,
        display_name: displayName,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateProfile(userId: string, updates: Partial<Profile>): Promise<Profile> {
    const { data, error } = await this.supabase.client
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}
```

**What changed:**
- `getProfile` now checks for error code `PGRST116` (no rows found)
- If no profile exists, it auto-creates one using data from the auth user
- This handles users who signed up before the trigger was created

### 6.3 Create Profile Page
- [ ] Run `ng generate component features/profile --standalone`
- [ ] Display current user profile info
- [ ] Add edit form

**What this page does:**
Displays the user's profile with an editable form. Loads profile data on init, allows updates, and shows loading/error states.

**profile.ts:**
```typescript
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../core/auth';
import { ProfileService, Profile as UserProfile } from '../../core/profile';
// ↑ Alias import avoids conflict between Profile interface and Profile class

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <h1>Profile</h1>

    @if (loading()) {
      <mat-spinner diameter="40"></mat-spinner>
    } @else if (error()) {
      <p class="error">{{ error() }}</p>
    } @else {
      <mat-card>
        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="onSubmit()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Email</mat-label>
              <input matInput formControlName="email" readonly>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Display Name</mat-label>
              <input matInput formControlName="display_name">
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Bio</mat-label>
              <textarea matInput formControlName="bio" rows="3"></textarea>
            </mat-form-field>

            @if (successMessage()) {
              <p class="success">{{ successMessage() }}</p>
            }

            <button mat-raised-button color="primary" type="submit" [disabled]="saving()">
              {{ saving() ? 'Saving...' : 'Save Changes' }}
            </button>
          </form>
        </mat-card-content>
      </mat-card>
    }
  `,
  styles: `
    .full-width { width: 100%; }
    mat-form-field { margin-bottom: 16px; }
    mat-card { max-width: 500px; }
    .error { color: #f44336; }
    .success { color: #4caf50; }
  `
})
export class Profile implements OnInit {
  private auth = inject(AuthService);
  private profileService = inject(ProfileService);
  private fb = inject(FormBuilder);

  loading = signal(true);
  saving = signal(false);
  error = signal('');
  successMessage = signal('');

  form = this.fb.nonNullable.group({
    email: [{ value: '', disabled: true }],
    display_name: [''],
    bio: [''],
  });

  async ngOnInit() {
    const user = this.auth.currentUser();
    if (!user) return;

    try {
      const profile = await this.profileService.getProfile(user.id);
      if (profile) {
        this.form.patchValue({
          email: profile.email,
          display_name: profile.display_name || '',
          bio: profile.bio || '',
        });
      }
    } catch (err: any) {
      this.error.set(err.message || 'Failed to load profile');
    } finally {
      this.loading.set(false);
    }
  }

  async onSubmit() {
    const user = this.auth.currentUser();
    if (!user) return;

    this.saving.set(true);
    this.successMessage.set('');

    try {
      await this.profileService.updateProfile(user.id, {
        display_name: this.form.value.display_name,
        bio: this.form.value.bio,
      });
      this.successMessage.set('Profile updated!');
    } catch (err: any) {
      this.error.set(err.message || 'Failed to save profile');
    } finally {
      this.saving.set(false);
    }
  }
}
```

### 6.4 Add Profile Route
- [ ] Add profile route to shell children
- [ ] Update sidebar link

**What we're doing:**
Adding /profile as a protected route inside the shell layout, so logged-in users can access it from the sidebar.

**Update app.routes.ts** - add profile to the shell children:
```typescript
{
  path: '',
  component: Shell,
  canActivate: [authGuard],
  children: [
    { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    {
      path: 'dashboard',
      loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.Dashboard)
    },
    {
      path: 'profile',
      loadComponent: () => import('./features/profile/profile').then((m) => m.Profile)
    }
  ]
}
```

**Note:** Class names use descriptive suffixes (`Profile`) to avoid conflicts with interfaces (`Profile`).

The sidebar already has a profile link from when we created the shell - it should work now.

### 6.5 Test Profile Flow
- [ ] Login and navigate to /profile
- [ ] Verify profile loads
- [ ] Test updating display name and bio
- [ ] Check data persists in Supabase

### 6.6 Push & Deploy
- [ ] Run `git add .`
- [ ] Run `git commit -m "Add user profile feature"`
- [ ] Run `git push`
- [ ] Verify deployment

## Iteration 7: Shared Components

**What we're building:**
Reusable UI components that wrap Angular Material with app-specific defaults. Instead of repeating Material imports and configurations everywhere, we create thin wrappers that enforce consistency. Also includes utility services for common UX patterns like dialogs and toasts.

### 7.1 Create Confirm Dialog Service
- [ ] Create a reusable confirmation dialog for destructive actions

**Why a dialog service?**
Instead of importing MatDialog and configuring it everywhere, we create a service that provides a simple API: `confirm('Delete this?')` returns a promise.

**Run:** `ng generate service shared/confirm-dialog`

**confirm-dialog.ts:**
```typescript
import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialog } from './confirm-dialog/confirm-dialog';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ConfirmDialogService {
  private dialog = inject(MatDialog);

  confirm(data: ConfirmDialogData): Promise<boolean> {
    const dialogRef = this.dialog.open(ConfirmDialog, {
      width: '400px',
      data: {
        title: data.title,
        message: data.message,
        confirmText: data.confirmText || 'Confirm',
        cancelText: data.cancelText || 'Cancel',
      }
    });

    return new Promise((resolve) => {
      dialogRef.afterClosed().subscribe((result) => {
        resolve(result === true);
      });
    });
  }
}
```

### 7.2 Create Confirm Dialog Component
- [ ] Run `ng generate component shared/confirm-dialog --standalone`

**confirm-dialog.component.ts:**
```typescript
import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { ConfirmDialogData } from '../confirm-dialog';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <mat-dialog-content>
      <p>{{ data.message }}</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">{{ data.cancelText }}</button>
      <button mat-raised-button color="warn" (click)="onConfirm()">{{ data.confirmText }}</button>
    </mat-dialog-actions>
  `
})
export class ConfirmDialog {
  data = inject<ConfirmDialogData>(MAT_DIALOG_DATA);
  private dialogRef = inject(MatDialogRef<ConfirmDialog>);

  onCancel() {
    this.dialogRef.close(false);
  }

  onConfirm() {
    this.dialogRef.close(true);
  }
}
```

### 7.3 Create Toast/Snackbar Service
- [ ] Create a simple notification service for success/error messages

**Why a toast service?**
Wraps MatSnackBar with sensible defaults. Instead of configuring duration and position everywhere, just call `toast.success('Saved!')`.

**Run:** `ng generate service shared/toast`

**toast.ts:**
```typescript
import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private snackBar = inject(MatSnackBar);

  success(message: string) {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: ['toast-success'],
      horizontalPosition: 'end',
      verticalPosition: 'top',
    });
  }

  error(message: string) {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['toast-error'],
      horizontalPosition: 'end',
      verticalPosition: 'top',
    });
  }

  info(message: string) {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
    });
  }
}
```

**Add toast styles to `src/styles.scss`:**

Note: CSS variables alone don't reliably override Angular Material's MDC snackbar styles. Direct class targeting with `!important` is required:

```scss
.toast-success .mdc-snackbar__surface {
  background-color: #4caf50 !important;
  color: white !important;
}
.toast-success .mat-mdc-button {
  color: white !important;
}

.toast-error .mdc-snackbar__surface {
  background-color: #f44336 !important;
  color: white !important;
}
.toast-error .mat-mdc-button {
  color: white !important;
}

.toast-info .mdc-snackbar__surface {
  background-color: #2196f3 !important;
  color: white !important;
}
.toast-info .mat-mdc-button {
  color: white !important;
}
```

### 7.4 Create Loading Spinner Component
- [ ] Run `ng generate component shared/loading-spinner --standalone`

**A reusable loading indicator with optional message.**

**loading-spinner.ts:**
```typescript
import { Component, input } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [MatProgressSpinnerModule],
  template: `
    <div class="loading-container">
      <mat-spinner [diameter]="diameter()"></mat-spinner>
      @if (message()) {
        <p>{{ message() }}</p>
      }
    </div>
  `,
  styles: `
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      padding: 24px;
    }
  `
})
export class LoadingSpinner {
  diameter = input(40);
  message = input<string>('');
}
```

### 7.5 Create Empty State Component
- [ ] Run `ng generate component shared/empty-state --standalone`

**Displays a friendly message when lists are empty.**

**empty-state.ts:**
```typescript
import { Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [MatIconModule],
  template: `
    <div class="empty-state">
      <mat-icon>{{ icon() }}</mat-icon>
      <h3>{{ title() }}</h3>
      @if (message()) {
        <p>{{ message() }}</p>
      }
      <ng-content></ng-content>
    </div>
  `,
  styles: `
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 48px 24px;
      text-align: center;
      color: #666;
    }
    mat-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      margin-bottom: 16px;
      opacity: 0.5;
    }
    h3 { margin: 0 0 8px; }
    p { margin: 0; }
  `
})
export class EmptyState {
  icon = input('inbox');
  title = input('No items');
  message = input('');
}
```

### 7.6 Create Component Test Page
- [ ] Create dedicated page to test and showcase shared components
- [ ] Add route at `/components`
- [ ] Add sidebar link

**Why a separate test page?**
Keep the dashboard clean for actual app functionality. A dedicated component test page serves as both a testing ground and a living style guide for the shared components.

**Run:** `ng generate component features/component-test --standalone`

**component-test.ts:**
```typescript
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { ConfirmDialogService } from '../../shared/confirm-dialog';
import { ToastService } from '../../shared/toast';
import { LoadingSpinner } from '../../shared/loading-spinner/loading-spinner';
import { EmptyState } from '../../shared/empty-state/empty-state';

@Component({
  selector: 'app-component-test',
  standalone: true,
  imports: [MatButtonModule, MatCardModule, LoadingSpinner, EmptyState],
  template: `
    <h1>Shared Components</h1>
    <p class="subtitle">Test page for shared UI components</p>

    <mat-card class="section">
      <mat-card-header>
        <mat-card-title>Toast Notifications</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <p>Display temporary notifications for user feedback.</p>
        <div class="button-row">
          <button mat-raised-button color="primary" (click)="showSuccess()">Success</button>
          <button mat-raised-button color="warn" (click)="showError()">Error</button>
          <button mat-raised-button (click)="showInfo()">Info</button>
        </div>
      </mat-card-content>
    </mat-card>

    <mat-card class="section">
      <mat-card-header>
        <mat-card-title>Confirm Dialog</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <p>Modal dialog for confirming destructive actions.</p>
        <button mat-raised-button color="warn" (click)="showConfirm()">Delete Something</button>
      </mat-card-content>
    </mat-card>

    <mat-card class="section">
      <mat-card-header>
        <mat-card-title>Loading Spinner</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <app-loading-spinner message="Loading data..." />
      </mat-card-content>
    </mat-card>

    <mat-card class="section">
      <mat-card-header>
        <mat-card-title>Empty State</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <app-empty-state
          icon="folder_open"
          title="No projects yet"
          message="Create your first project to get started">
        </app-empty-state>
      </mat-card-content>
    </mat-card>
  `,
  styles: `
    .subtitle { color: #666; margin-bottom: 24px; }
    .section { margin-bottom: 24px; max-width: 600px; }
    .button-row { display: flex; gap: 12px; margin-top: 16px; }
  `
})
export class ComponentTest {
  private confirmDialog = inject(ConfirmDialogService);
  private toast = inject(ToastService);

  showSuccess() {
    this.toast.success('Operation completed successfully!');
  }

  showError() {
    this.toast.error('Something went wrong. Please try again.');
  }

  showInfo() {
    this.toast.info('This is an informational message.');
  }

  async showConfirm() {
    const confirmed = await this.confirmDialog.confirm({
      title: 'Delete Item',
      message: 'Are you sure you want to delete this item? This cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel'
    });

    if (confirmed) {
      this.toast.success('Item deleted!');
    } else {
      this.toast.info('Cancelled');
    }
  }
}
```

**Add route to app.routes.ts** (inside Shell children):
```typescript
{
  path: 'components',
  loadComponent: () => import('./features/component-test/component-test').then((m) => m.ComponentTest),
}
```

**Add sidebar link to shell.html:**
```html
<a mat-list-item routerLink="/components">
  <mat-icon matListItemIcon>widgets</mat-icon>
  <span matListItemTitle>Components</span>
</a>
```

**Test checklist:**
- [ ] Run `ng serve`
- [ ] Navigate to `/components` from sidebar
- [ ] Click "Success" → green notification appears top-right
- [ ] Click "Error" → red notification appears top-right
- [ ] Click "Info" → neutral notification appears
- [ ] Click "Delete Something" → confirm dialog opens
- [ ] Loading spinner displays with message
- [ ] Empty state displays with icon, title, and message

### 7.7 Push & Deploy
- [ ] Run `git add .`
- [ ] Run `git commit -m "Add shared components and services"`
- [ ] Run `git push`
- [ ] Verify deployment

## Iteration 8: CRUD Example Feature

**What we're building:**
A complete notes feature demonstrating all CRUD operations (Create, Read, Update, Delete). This serves as a reference pattern for any data-driven feature in the app. We'll use the shared components from Iteration 7 (toast notifications, confirm dialog, loading spinner, empty state) to create a polished user experience.

### 8.1 Create Notes Table in Supabase
- [ ] Go to Supabase Dashboard → SQL Editor
- [ ] Run SQL to create notes table with RLS policies

**Why notes?**
Notes are simple enough to understand quickly but complex enough to demonstrate real patterns: user ownership, timestamps, text content, and ordering.

**Run this SQL in Supabase:**
```sql
-- Create notes table
CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster user queries
CREATE INDEX notes_user_id_idx ON notes(user_id);

-- Enable Row Level Security
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only read their own notes
CREATE POLICY "Users can read own notes"
  ON notes FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own notes
CREATE POLICY "Users can insert own notes"
  ON notes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own notes
CREATE POLICY "Users can update own notes"
  ON notes FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own notes
CREATE POLICY "Users can delete own notes"
  ON notes FOR DELETE
  USING (auth.uid() = user_id);
```

### 8.2 Create Notes Service
- [ ] Run `ng generate service core/notes`
- [ ] Implement CRUD methods with pagination and search

**What this service does:**
Encapsulates all notes data operations. Returns typed data, handles errors, and provides pagination support. The `list` method supports both pagination and search filtering.

**notes.ts:**
```typescript
import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase';
import { AuthService } from './auth';

export interface Note {
  id: string;
  user_id: string;
  title: string;
  content: string | null;
  created_at: string;
  updated_at: string;
}

export interface NotesResponse {
  data: Note[];
  count: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotesService {
  private supabase = inject(SupabaseService);
  private auth = inject(AuthService);

  async list(page = 1, pageSize = 10, search = ''): Promise<NotesResponse> {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = this.supabase.client
      .from('notes')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (search) {
      query = query.ilike('title', `%${search}%`);
    }

    const { data, error, count } = await query;
    if (error) throw error;
    return { data: data || [], count: count || 0 };
  }

  async get(id: string): Promise<Note | null> {
    const { data, error } = await this.supabase.client
      .from('notes')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async create(note: { title: string; content?: string }): Promise<Note> {
    const user = this.auth.currentUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await this.supabase.client
      .from('notes')
      .insert({
        user_id: user.id,
        title: note.title,
        content: note.content || null,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async update(id: string, updates: { title?: string; content?: string }): Promise<Note> {
    const { data, error } = await this.supabase.client
      .from('notes')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase.client
      .from('notes')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}
```

### 8.3 Create Notes List Component
- [ ] Run `ng generate component features/notes/notes-list --standalone`
- [ ] Display notes in a list/card layout
- [ ] Add pagination controls
- [ ] Add search input
- [ ] Use empty state when no notes exist

**What this component does:**
The main notes page. Loads and displays notes with pagination, provides search filtering, and links to create/edit forms. Uses signals for reactive state management.

**notes-list.ts:**
```typescript
import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { NotesService, Note } from '../../../core/notes';
import { ToastService } from '../../../shared/toast';
import { ConfirmDialogService } from '../../../shared/confirm-dialog';
import { LoadingSpinner } from '../../../shared/loading-spinner/loading-spinner';
import { EmptyState } from '../../../shared/empty-state/empty-state';

@Component({
  selector: 'app-notes-list',
  standalone: true,
  imports: [
    DatePipe,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatPaginatorModule,
    LoadingSpinner,
    EmptyState,
  ],
  template: `
    <div class="header">
      <h1>Notes</h1>
      <button mat-raised-button color="primary" (click)="createNote()">
        <mat-icon>add</mat-icon>
        New Note
      </button>
    </div>

    <mat-form-field appearance="outline" class="search-field">
      <mat-label>Search notes</mat-label>
      <input matInput [(ngModel)]="searchQuery" (keyup.enter)="search()" placeholder="Search by title...">
      <button mat-icon-button matSuffix (click)="search()">
        <mat-icon>search</mat-icon>
      </button>
    </mat-form-field>

    @if (loading()) {
      <app-loading-spinner message="Loading notes..." />
    } @else if (notes().length === 0) {
      <app-empty-state
        icon="note"
        title="No notes yet"
        message="Create your first note to get started">
        <button mat-raised-button color="primary" (click)="createNote()">
          Create Note
        </button>
      </app-empty-state>
    } @else {
      <div class="notes-grid">
        @for (note of notes(); track note.id) {
          <mat-card class="note-card">
            <mat-card-header>
              <mat-card-title>{{ note.title }}</mat-card-title>
              <mat-card-subtitle>{{ note.created_at | date:'medium' }}</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <p>{{ note.content || 'No content' }}</p>
            </mat-card-content>
            <mat-card-actions align="end">
              <button mat-button (click)="editNote(note.id)">
                <mat-icon>edit</mat-icon>
                Edit
              </button>
              <button mat-button color="warn" (click)="deleteNote(note)">
                <mat-icon>delete</mat-icon>
                Delete
              </button>
            </mat-card-actions>
          </mat-card>
        }
      </div>

      <mat-paginator
        [length]="totalCount()"
        [pageSize]="pageSize"
        [pageIndex]="currentPage() - 1"
        [pageSizeOptions]="[5, 10, 25]"
        (page)="onPageChange($event)"
        showFirstLastButtons>
      </mat-paginator>
    }
  `,
  styles: `
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }
    .search-field {
      width: 100%;
      max-width: 400px;
      margin-bottom: 24px;
    }
    .notes-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }
    .note-card {
      cursor: pointer;
    }
    .note-card mat-card-content p {
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
    }
  `
})
export class NotesList implements OnInit {
  private notesService = inject(NotesService);
  private router = inject(Router);
  private toast = inject(ToastService);
  private confirmDialog = inject(ConfirmDialogService);

  notes = signal<Note[]>([]);
  loading = signal(true);
  totalCount = signal(0);
  currentPage = signal(1);
  pageSize = 10;
  searchQuery = '';

  async ngOnInit() {
    await this.loadNotes();
  }

  async loadNotes() {
    this.loading.set(true);
    try {
      const response = await this.notesService.list(
        this.currentPage(),
        this.pageSize,
        this.searchQuery
      );
      this.notes.set(response.data);
      this.totalCount.set(response.count);
    } catch (err: any) {
      this.toast.error(err.message || 'Failed to load notes');
    } finally {
      this.loading.set(false);
    }
  }

  search() {
    this.currentPage.set(1);
    this.loadNotes();
  }

  onPageChange(event: PageEvent) {
    this.currentPage.set(event.pageIndex + 1);
    this.pageSize = event.pageSize;
    this.loadNotes();
  }

  createNote() {
    this.router.navigate(['/notes/new']);
  }

  editNote(id: string) {
    this.router.navigate(['/notes', id, 'edit']);
  }

  async deleteNote(note: Note) {
    const confirmed = await this.confirmDialog.confirm({
      title: 'Delete Note',
      message: `Are you sure you want to delete "${note.title}"? This cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel'
    });

    if (confirmed) {
      try {
        await this.notesService.delete(note.id);
        this.toast.success('Note deleted');
        this.loadNotes();
      } catch (err: any) {
        this.toast.error(err.message || 'Failed to delete note');
      }
    }
  }
}
```

### 8.4 Create Note Form Component
- [ ] Run `ng generate component features/notes/note-form --standalone`
- [ ] Handle both create and edit modes
- [ ] Load existing note data for edit mode

**What this component does:**
A single form component that handles both creating new notes and editing existing ones. The route parameter determines the mode - if there's an `id`, it's edit mode.

**note-form.ts:**
```typescript
import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { NotesService } from '../../../core/notes';
import { ToastService } from '../../../shared/toast';
import { LoadingSpinner } from '../../../shared/loading-spinner/loading-spinner';

@Component({
  selector: 'app-note-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    LoadingSpinner,
  ],
  template: `
    <h1>{{ isEditMode() ? 'Edit Note' : 'New Note' }}</h1>

    @if (loading()) {
      <app-loading-spinner message="Loading..." />
    } @else {
      <mat-card class="form-card">
        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="onSubmit()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Title</mat-label>
              <input matInput formControlName="title" placeholder="Enter note title">
              @if (form.controls.title.hasError('required')) {
                <mat-error>Title is required</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Content</mat-label>
              <textarea matInput formControlName="content" rows="6" placeholder="Enter note content"></textarea>
            </mat-form-field>

            <div class="actions">
              <button mat-button type="button" (click)="cancel()">Cancel</button>
              <button mat-raised-button color="primary" type="submit" [disabled]="saving()">
                {{ saving() ? 'Saving...' : (isEditMode() ? 'Update' : 'Create') }}
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>
    }
  `,
  styles: `
    .form-card { max-width: 600px; }
    .full-width { width: 100%; }
    mat-form-field { margin-bottom: 16px; }
    .actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      margin-top: 16px;
    }
  `
})
export class NoteForm implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private notesService = inject(NotesService);
  private toast = inject(ToastService);

  loading = signal(false);
  saving = signal(false);
  isEditMode = signal(false);
  noteId: string | null = null;

  form = this.fb.nonNullable.group({
    title: ['', Validators.required],
    content: [''],
  });

  async ngOnInit() {
    this.noteId = this.route.snapshot.paramMap.get('id');

    if (this.noteId) {
      this.isEditMode.set(true);
      await this.loadNote(this.noteId);
    }
  }

  async loadNote(id: string) {
    this.loading.set(true);
    try {
      const note = await this.notesService.get(id);
      if (note) {
        this.form.patchValue({
          title: note.title,
          content: note.content || '',
        });
      }
    } catch (err: any) {
      this.toast.error(err.message || 'Failed to load note');
      this.router.navigate(['/notes']);
    } finally {
      this.loading.set(false);
    }
  }

  async onSubmit() {
    if (this.form.invalid) return;

    this.saving.set(true);
    try {
      if (this.isEditMode() && this.noteId) {
        await this.notesService.update(this.noteId, this.form.getRawValue());
        this.toast.success('Note updated');
      } else {
        await this.notesService.create(this.form.getRawValue());
        this.toast.success('Note created');
      }
      this.router.navigate(['/notes']);
    } catch (err: any) {
      this.toast.error(err.message || 'Failed to save note');
    } finally {
      this.saving.set(false);
    }
  }

  cancel() {
    this.router.navigate(['/notes']);
  }
}
```

### 8.5 Add Notes Routes
- [ ] Add notes routes to app.routes.ts
- [ ] Add notes link to shell sidebar

**Update app.routes.ts** - add to Shell children:
```typescript
{
  path: 'notes',
  loadComponent: () => import('./features/notes/notes-list/notes-list').then(m => m.NotesList)
},
{
  path: 'notes/new',
  loadComponent: () => import('./features/notes/note-form/note-form').then(m => m.NoteForm)
},
{
  path: 'notes/:id/edit',
  loadComponent: () => import('./features/notes/note-form/note-form').then(m => m.NoteForm)
},
```

**Add sidebar link to shell.html:**
```html
<a mat-list-item routerLink="/notes">
  <mat-icon matListItemIcon>note</mat-icon>
  <span matListItemTitle>Notes</span>
</a>
```

### 8.6 Test CRUD Flow
- [ ] Run `ng serve`
- [ ] Navigate to `/notes` from sidebar
- [ ] Verify empty state displays when no notes exist
- [ ] Click "New Note" → create a note
- [ ] Verify note appears in list
- [ ] Click "Edit" → update the note
- [ ] Verify changes persist
- [ ] Click "Delete" → confirm deletion
- [ ] Verify note is removed
- [ ] Test search functionality
- [ ] Test pagination (create 10+ notes)

### 8.7 Push & Deploy
- [ ] Run `git add .`
- [ ] Run `git commit -m "Add notes CRUD feature"`
- [ ] Run `git push`
- [ ] Verify deployment

## Iteration 9: State Management

**What we're building:**
A structured approach to managing application state using Angular signals. We already use signals in AuthService - now we'll formalize the pattern with a preferences store that persists to localStorage. This gives users a consistent experience across sessions (theme preference, sidebar state, etc.).

### 9.1 Create Preferences Service
- [ ] Run `ng generate service core/preferences`
- [ ] Store user preferences with localStorage persistence

**What this service does:**
Manages user preferences that should persist across sessions. Uses signals for reactivity and localStorage for persistence. The `effect()` function auto-saves to localStorage whenever preferences change.

**preferences.ts:**
```typescript
import { Injectable, signal, effect } from '@angular/core';

export interface UserPreferences {
  theme: 'light' | 'dark';
  sidenavOpened: boolean;
}

const STORAGE_KEY = 'user_preferences';

const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'light',
  sidenavOpened: true,
};

@Injectable({
  providedIn: 'root'
})
export class PreferencesService {
  private preferences = signal<UserPreferences>(this.loadFromStorage());

  // Expose individual preferences as readonly signals
  readonly theme = () => this.preferences().theme;
  readonly sidenavOpened = () => this.preferences().sidenavOpened;

  constructor() {
    // Auto-save to localStorage whenever preferences change
    effect(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.preferences()));
    });
  }

  private loadFromStorage(): UserPreferences {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) };
      }
    } catch {
      // Invalid JSON, use defaults
    }
    return DEFAULT_PREFERENCES;
  }

  setTheme(theme: 'light' | 'dark') {
    this.preferences.update(prefs => ({ ...prefs, theme }));
  }

  toggleTheme() {
    this.preferences.update(prefs => ({
      ...prefs,
      theme: prefs.theme === 'light' ? 'dark' : 'light'
    }));
  }

  setSidenavOpened(opened: boolean) {
    this.preferences.update(prefs => ({ ...prefs, sidenavOpened: opened }));
  }

  toggleSidenav() {
    this.preferences.update(prefs => ({
      ...prefs,
      sidenavOpened: !prefs.sidenavOpened
    }));
  }
}
```

**Key concepts:**
| Concept | Purpose |
|---------|---------|
| `signal()` | Creates reactive state that components can subscribe to |
| `effect()` | Runs side effects when signals change (here: save to localStorage) |
| `update()` | Updates signal value based on previous value (immutable pattern) |

### 9.2 Apply Theme to Application
- [ ] Update `app.component.ts` to apply theme class to body
- [ ] Use the dark-theme class we defined in Iteration 2

**What this does:**
Watches the theme preference and applies the appropriate CSS class to the document body. The `effect()` runs whenever the theme signal changes.

**Update app.component.ts:**
```typescript
import { Component, inject, effect } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PreferencesService } from './core/preferences';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet />`,
})
export class AppComponent {
  private preferences = inject(PreferencesService);

  constructor() {
    // Apply theme class to body whenever theme changes
    effect(() => {
      const theme = this.preferences.theme();
      document.body.classList.toggle('dark-theme', theme === 'dark');
    });
  }
}
```

### 9.3 Update Shell to Use Preferences
- [ ] Wire up sidenav state to preferences
- [ ] Add theme toggle button to toolbar

**What this does:**
The shell now remembers sidenav state across page reloads and provides a theme toggle button in the toolbar.

**Update shell.ts:**
```typescript
import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PreferencesService } from '../../core/preferences';
import { AuthService } from '../../core/auth';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    MatToolbarModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
  ],
  templateUrl: './shell.html',
  styleUrl: './shell.scss'
})
export class Shell {
  preferences = inject(PreferencesService);
  private auth = inject(AuthService);

  toggleSidenav() {
    this.preferences.toggleSidenav();
  }

  toggleTheme() {
    this.preferences.toggleTheme();
  }

  async logout() {
    await this.auth.signOut();
  }
}
```

**Update shell.html:**
```html
<mat-sidenav-container class="shell-container">
  <mat-sidenav #sidenav mode="side" [opened]="preferences.sidenavOpened()">
    <mat-nav-list>
      <a mat-list-item routerLink="/dashboard">
        <mat-icon matListItemIcon>dashboard</mat-icon>
        <span matListItemTitle>Dashboard</span>
      </a>
      <a mat-list-item routerLink="/notes">
        <mat-icon matListItemIcon>note</mat-icon>
        <span matListItemTitle>Notes</span>
      </a>
      <a mat-list-item routerLink="/profile">
        <mat-icon matListItemIcon>person</mat-icon>
        <span matListItemTitle>Profile</span>
      </a>
      <a mat-list-item routerLink="/components">
        <mat-icon matListItemIcon>widgets</mat-icon>
        <span matListItemTitle>Components</span>
      </a>
    </mat-nav-list>
  </mat-sidenav>

  <mat-sidenav-content>
    <mat-toolbar color="primary">
      <button mat-icon-button (click)="toggleSidenav()">
        <mat-icon>menu</mat-icon>
      </button>
      <span>Angular Starter</span>
      <span class="spacer"></span>
      <button mat-icon-button (click)="toggleTheme()" [matTooltip]="preferences.theme() === 'light' ? 'Dark mode' : 'Light mode'">
        <mat-icon>{{ preferences.theme() === 'light' ? 'dark_mode' : 'light_mode' }}</mat-icon>
      </button>
      <button mat-icon-button (click)="logout()" matTooltip="Logout">
        <mat-icon>logout</mat-icon>
      </button>
    </mat-toolbar>

    <main class="content">
      <router-outlet />
    </main>
  </mat-sidenav-content>
</mat-sidenav-container>
```

### 9.4 Create Notes Store (Optional Enhancement)
- [ ] Create a store for caching notes data
- [ ] Reduce API calls when navigating

**What this does:**
Caches notes in memory so navigating away and back doesn't require a new API call. This is optional but demonstrates the store pattern for feature-specific state.

**features/notes/notes-store.ts:**
```typescript
import { Injectable, signal, computed } from '@angular/core';
import { Note } from '../../core/notes';

@Injectable({
  providedIn: 'root'
})
export class NotesStore {
  private notes = signal<Note[]>([]);
  private loading = signal(false);
  private lastFetch = signal<Date | null>(null);
  private totalCount = signal(0);
  private pageSize = signal(10);
  private page = signal(1);

  // Public readonly access
  readonly allNotes = this.notes.asReadonly();
  readonly isLoading = this.loading.asReadonly();
  readonly total = this.totalCount.asReadonly();
  readonly currentPageSize = this.pageSize.asReadonly();
  readonly currentPage = this.page.asReadonly();

  // Computed values
  readonly isEmpty = computed(() => this.notes().length === 0);

  // Check if cache is stale (older than 5 minutes)
  readonly isStale = computed(() => {
    const last = this.lastFetch();
    if (!last) return true;
    const fiveMinutes = 5 * 60 * 1000;
    return Date.now() - last.getTime() > fiveMinutes;
  });

  setNotes(notes: Note[], total: number, pageSize: number, page: number) {
    this.notes.set(notes);
    this.totalCount.set(total);
    this.pageSize.set(pageSize);
    this.page.set(page);
    this.lastFetch.set(new Date());
  }

  addNote(note: Note) {
    this.notes.update(notes => [note, ...notes]);
    this.totalCount.update(count => count + 1);
  }

  updateNote(updated: Note) {
    this.notes.update(notes =>
      notes.map(n => n.id === updated.id ? updated : n)
    );
  }

  removeNote(id: string) {
    this.notes.update(notes => notes.filter(n => n.id !== id));
    this.totalCount.update(count => count - 1);
  }

  setLoading(loading: boolean) {
    this.loading.set(loading);
  }

  clear() {
    this.notes.set([]);
    this.lastFetch.set(null);
  }
}
```

**Integration with notes-list.ts:**

```typescript
// Add import
import { NotesStore } from '../notes-store';

// Inject store
private store = inject(NotesStore);

// Delegate to store instead of local signals
notes = this.store.allNotes;
loading = this.store.isLoading;
totalCount = this.store.total;

// Cache check in ngOnInit
async ngOnInit() {
  if (!this.store.isEmpty() && !this.store.isStale() && !this.searchQuery) {
    this.pageSize = this.store.currentPageSize();
    this.currentPage.set(this.store.currentPage());
    return; // Use cached data
  }
  await this.loadNotes();
}

// Update loadNotes to use store
async loadNotes() {
  this.store.setLoading(true);
  try {
    const response = await this.notesService.list(
      this.currentPage(),
      this.pageSize,
      this.searchQuery
    );
    this.store.setNotes(response.data, response.count, this.pageSize, this.currentPage());
  } catch (err: any) {
    this.toast.error(err.message || 'Failed to load notes');
  } finally {
    this.store.setLoading(false);
  }
}

// Update deleteNote for optimistic update
async deleteNote(note: Note) {
  // ... confirm dialog ...
  if (confirmed) {
    try {
      await this.notesService.delete(note.id);
      this.store.removeNote(note.id);
      this.toast.success('Note deleted');
    } catch (err: any) {
      this.toast.error(err.message || 'Failed to delete note');
      this.loadNotes(); // Refetch on error
    }
  }
}
```

**Integration with note-form.ts:**

```typescript
// Add import
import { NotesStore } from '../notes-store';

// Inject store
private store = inject(NotesStore);

// Update onSubmit to sync with store
async onSubmit() {
  // ... validation ...
  try {
    if (this.isEditMode() && this.noteId) {
      const updated = await this.notesService.update(this.noteId, this.form.getRawValue());
      this.store.updateNote(updated);
      this.toast.success('Note updated');
    } else {
      const created = await this.notesService.create(this.form.getRawValue());
      this.store.addNote(created);
      this.toast.success('Note created');
    }
    this.router.navigate(['/notes']);
  } catch (err: any) {
    this.toast.error(err.message || 'Failed to save note');
  }
}
```

### 9.5 Test State Persistence
- [ ] Run `ng serve`
- [ ] Toggle dark mode → verify theme persists after refresh
- [ ] Close sidenav → verify state persists after refresh
- [ ] Check localStorage in DevTools (Application tab)

### 9.6 Push & Deploy
- [ ] Run `git add .`
- [ ] Run `git commit -m "Add state management with preferences"`
- [ ] Run `git push`
- [ ] Verify deployment

## Iteration 10: Error Handling & UX

**What we're building:**
A polished error handling system that catches unexpected errors and displays user-friendly messages. We'll also add loading skeletons for a smoother perceived loading experience (instead of just spinners).

### 10.1 Create Global Error Handler
- [ ] Create custom ErrorHandler service
- [ ] Display errors via toast notifications
- [ ] Log errors for debugging

**What this does:**
Angular's ErrorHandler catches all uncaught exceptions. We override it to show a toast notification and log the error. This prevents the app from silently failing.

**Run:** `ng generate service core/global-error-handler`

**global-error-handler.ts:**
```typescript
import { ErrorHandler, Injectable, inject, NgZone } from '@angular/core';
import { ToastService } from '../shared/toast';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private toast = inject(ToastService);
  private zone = inject(NgZone);

  handleError(error: unknown): void {
    // Log error for debugging
    console.error('Global error:', error);

    // Extract message
    let message = 'An unexpected error occurred';
    if (error instanceof Error) {
      message = error.message;
    }

    // Show toast (must run in Angular zone)
    this.zone.run(() => {
      this.toast.error(message);
    });
  }
}
```

**Register in app.config.ts:**
```typescript
import { ErrorHandler } from '@angular/core';
import { GlobalErrorHandler } from './core/global-error-handler';

export const appConfig: ApplicationConfig = {
  providers: [
    // ... existing providers
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
  ]
};
```

**Why NgZone?**
Errors might occur outside Angular's change detection zone. `zone.run()` ensures the toast triggers UI updates properly.

### 10.2 Create HTTP Error Interceptor
- [ ] Create interceptor to handle HTTP errors consistently
- [ ] Transform error responses into user-friendly messages

**What this does:**
Catches HTTP errors (401, 403, 404, 500, etc.) and transforms them into consistent error messages. Also handles auth expiration by redirecting to login.

**Run:** `ng generate interceptor core/http-error --functional`

**http-error.interceptor.ts:**
```typescript
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '../shared/toast';

export const httpErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(ToastService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let message = 'An error occurred';

      switch (error.status) {
        case 0:
          message = 'Unable to connect to server';
          break;
        case 401:
          message = 'Session expired. Please log in again.';
          router.navigate(['/login']);
          break;
        case 403:
          message = 'You do not have permission to perform this action';
          break;
        case 404:
          message = 'The requested resource was not found';
          break;
        case 422:
          message = error.error?.message || 'Validation error';
          break;
        case 500:
          message = 'Server error. Please try again later.';
          break;
        default:
          message = error.error?.message || error.message || message;
      }

      toast.error(message);
      return throwError(() => new Error(message));
    })
  );
};
```

**Register in app.config.ts:**
```typescript
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { httpErrorInterceptor } from './core/http-error.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(withInterceptors([httpErrorInterceptor])),
    // ... other providers
  ]
};
```

### 10.3 Create Skeleton Loader Component
- [ ] Run `ng generate component shared/skeleton --standalone`
- [ ] Create flexible skeleton for text, cards, and avatars

**What this does:**
Skeleton loaders show placeholder shapes while content loads. They're better than spinners because they hint at the layout, reducing perceived load time.

**skeleton.ts:**
```typescript
import { Component, input } from '@angular/core';
import { NgStyle } from '@angular/common';

@Component({
  selector: 'app-skeleton',
  standalone: true,
  imports: [NgStyle],
  template: `
    <div
      class="skeleton"
      [ngStyle]="{
        width: width(),
        height: height(),
        borderRadius: variant() === 'circle' ? '50%' : radius()
      }">
    </div>
  `,
  styles: `
    .skeleton {
      background: linear-gradient(90deg, #e0e0e0 25%, #f0f0f0 50%, #e0e0e0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
    }

    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    :host-context(.dark-theme) .skeleton {
      background: linear-gradient(90deg, #333 25%, #444 50%, #333 75%);
      background-size: 200% 100%;
    }
  `
})
export class Skeleton {
  width = input('100%');
  height = input('1rem');
  variant = input<'text' | 'rect' | 'circle'>('text');
  radius = input('4px');
}
```

**Usage examples:**
```html
<!-- Text line -->
<app-skeleton width="80%" height="1rem" />

<!-- Card placeholder -->
<app-skeleton width="100%" height="200px" radius="8px" />

<!-- Avatar -->
<app-skeleton width="48px" height="48px" variant="circle" />
```

### 10.4 Create Note Card Skeleton
- [ ] Run `ng generate component shared/note-card-skeleton --standalone`
- [ ] Match the layout of actual note cards

**note-card-skeleton.ts:**
```typescript
import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { Skeleton } from '../skeleton/skeleton';

@Component({
  selector: 'app-note-card-skeleton',
  standalone: true,
  imports: [MatCardModule, Skeleton],
  template: `
    <mat-card class="skeleton-card">
      <mat-card-header>
        <app-skeleton width="60%" height="1.25rem" />
        <app-skeleton width="40%" height="0.875rem" />
      </mat-card-header>
      <mat-card-content>
        <app-skeleton width="100%" height="0.875rem" />
        <app-skeleton width="90%" height="0.875rem" />
        <app-skeleton width="70%" height="0.875rem" />
      </mat-card-content>
      <mat-card-actions>
        <app-skeleton width="60px" height="36px" radius="4px" />
        <app-skeleton width="70px" height="36px" radius="4px" />
      </mat-card-actions>
    </mat-card>
  `,
  styles: `
    .skeleton-card {
      mat-card-header { margin-bottom: 16px; }
      mat-card-content app-skeleton { margin-bottom: 8px; }
      mat-card-actions { display: flex; gap: 8px; justify-content: flex-end; }
    }
  `
})
export class NoteCardSkeleton {}
```

### 10.5 Update Notes List to Use Skeleton
- [ ] Replace loading spinner with skeleton cards

**Update notes-list.ts template:**
```html
@if (loading()) {
  <div class="notes-grid">
    @for (i of [1, 2, 3, 4, 5, 6]; track i) {
      <app-note-card-skeleton />
    }
  </div>
} @else if (notes().length === 0) {
  <!-- empty state -->
} @else {
  <!-- actual notes -->
}
```

**Add import:**
```typescript
import { NoteCardSkeleton } from '../../../shared/note-card-skeleton/note-card-skeleton';

// Add to imports array
imports: [
  // ... existing
  NoteCardSkeleton,
],
```

### 10.6 Test Error Handling
- [ ] Run `ng serve`
- [ ] Temporarily break an API call (wrong URL) → verify toast appears
- [ ] Test HTTP error scenarios
- [ ] Verify skeletons appear while loading notes

### 10.7 Push & Deploy
- [ ] Run `git add .`
- [ ] Run `git commit -m "Add error handling and skeleton loaders"`
- [ ] Run `git push`
- [ ] Verify deployment

## Iteration 11: Testing

**What we're building:**
A comprehensive test suite covering services, components, and guards. Angular 21 uses the built-in `@angular/build:unit-test` runner with Vitest. We'll also set up Playwright for end-to-end testing.

### 11.1 Understand Current Test Setup
- [x] Run `ng test` to verify tests work
- [x] Review angular.json test configuration
- [x] Install `@angular/animations` if not present (required for `NoopAnimationsModule`)

**Angular 21 testing:**
- Uses `@angular/build:unit-test` builder (replaces Karma)
- Vitest for assertions (NOT Jasmine)
- Tests run via Vitest's test runner

**Important:** The Angular CLI may still generate spec files with Jasmine syntax (`jasmine.createSpyObj`, `done()` callbacks). You must convert these to Vitest syntax:
- `jasmine.createSpyObj()` → `vi.fn()`
- `done()` callbacks → `async/await`
- `jasmine.createSpy()` → `vi.fn()`

**Install animations (if needed):**
```bash
npm install @angular/animations@21.1.0 --save --legacy-peer-deps
```

**Run existing tests:**
```bash
ng test
```

### 11.2 Write Service Tests (NotesService)
- [x] Create `features/notes/notes.spec.ts`
- [x] Mock Supabase client
- [x] Test CRUD operations (15 tests)

**Why test services?**
Services contain business logic. Testing them ensures your data operations work correctly without needing the actual database.

**notes.spec.ts:**
```typescript
import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { NotesService } from './notes';
import { SupabaseService } from '../../core/supabase';
import { AuthService } from '../../core/auth';

describe('NotesService', () => {
  let service: NotesService;

  const mockUser = { id: 'user-123', email: 'test@test.com' };
  const mockNote = {
    id: 'note-1',
    user_id: 'user-123',
    title: 'Test Note',
    content: 'Test content',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  beforeEach(() => {
    // Create mock Supabase client using vi.fn()
    const mockSupabaseClient = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            range: vi.fn().mockResolvedValue({ data: [mockNote], error: null, count: 1 }),
          }),
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockNote, error: null }),
          }),
        }),
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockNote, error: null }),
          }),
        }),
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      }),
    };

    const supabaseMock = { client: mockSupabaseClient };

    const authMock = {
      currentUser: signal(mockUser as any),
    };

    TestBed.configureTestingModule({
      providers: [
        NotesService,
        { provide: SupabaseService, useValue: supabaseMock },
        { provide: AuthService, useValue: authMock },
      ],
    });

    service = TestBed.inject(NotesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should list notes', async () => {
    const result = await service.list(1, 10, '');
    expect(result.data.length).toBe(1);
    expect(result.count).toBe(1);
  });
});
```

### 11.3 Write Component Tests (NotesList)
- [x] Create `features/notes/notes-list/notes-list.spec.ts`
- [x] Test component rendering
- [x] Test user interactions (19 tests)

**Why test components?**
Ensures UI renders correctly and user interactions trigger expected behavior.

**notes-list.spec.ts:**
```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { signal } from '@angular/core';
import { NotesList } from './notes-list';
import { NotesService } from '../notes';
import { NotesStore } from '../notes-store';
import { ToastService } from '../../../shared/toast';
import { ConfirmDialogService } from '../../../shared/confirm-dialog';

describe('NotesList', () => {
  let component: NotesList;
  let fixture: ComponentFixture<NotesList>;

  const mockNotes = [
    { id: '1', user_id: 'u1', title: 'Note 1', content: 'Content 1', created_at: '', updated_at: '' },
    { id: '2', user_id: 'u1', title: 'Note 2', content: 'Content 2', created_at: '', updated_at: '' },
  ];

  beforeEach(async () => {
    const notesServiceMock = {
      list: vi.fn().mockResolvedValue({ data: mockNotes, count: 2 }),
      delete: vi.fn().mockResolvedValue(undefined),
    };

    const storeMock = {
      allNotes: signal(mockNotes),
      isLoading: signal(false),
      total: signal(2),
      currentPageSize: signal(10),
      currentPage: signal(1),
      isEmpty: vi.fn().mockReturnValue(false),
      isStale: vi.fn().mockReturnValue(true),
      setNotes: vi.fn(),
      setLoading: vi.fn(),
      removeNote: vi.fn(),
    };

    const toastMock = {
      success: vi.fn(),
      error: vi.fn(),
    };

    const confirmDialogMock = {
      confirm: vi.fn().mockResolvedValue(true),
    };

    await TestBed.configureTestingModule({
      imports: [NotesList, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        { provide: NotesService, useValue: notesServiceMock },
        { provide: NotesStore, useValue: storeMock },
        { provide: ToastService, useValue: toastMock },
        { provide: ConfirmDialogService, useValue: confirmDialogMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NotesList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display notes', () => {
    const cards = fixture.nativeElement.querySelectorAll('mat-card');
    expect(cards.length).toBe(2);
  });

  it('should show note titles', () => {
    const titles = fixture.nativeElement.querySelectorAll('mat-card-title');
    expect(titles[0].textContent).toContain('Note 1');
    expect(titles[1].textContent).toContain('Note 2');
  });
});
```

### 11.4 Write Guard Tests
- [x] Create `core/auth-guard.spec.ts` (6 tests)
- [x] Create `core/guest-guard.spec.ts` (6 tests)
- [x] Test authenticated and unauthenticated scenarios

**auth-guard.spec.ts:**
```typescript
import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { authGuard } from './auth-guard';
import { AuthService } from './auth';

describe('authGuard', () => {
  function setupGuard(isAuthenticated: boolean) {
    const authMock = {
      currentUser: signal(isAuthenticated ? { id: '123' } as any : null),
      loading: signal(false),
    };

    const routerMock = {
      parseUrl: vi.fn().mockReturnValue({} as UrlTree),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authMock },
        { provide: Router, useValue: routerMock },
      ],
    });

    return { authMock, routerMock };
  }

  it('should allow access when authenticated', async () => {
    setupGuard(true);
    const result$ = TestBed.runInInjectionContext(() => authGuard());

    const result = await firstValueFrom(result$ as any);
    expect(result).toBe(true);
  });

  it('should redirect to login when not authenticated', async () => {
    const { routerMock } = setupGuard(false);

    const result$ = TestBed.runInInjectionContext(() => authGuard());

    await firstValueFrom(result$ as any);
    expect(routerMock.parseUrl).toHaveBeenCalledWith('/login');
  });
});
```

### 11.5 Run and Verify Unit Tests
- [x] Run `ng test`
- [x] Fix any failing tests
- [x] All 72 tests passing

**Useful commands:**
```bash
ng test                    # Run tests in watch mode
ng test --no-watch         # Run once and exit
ng test --code-coverage    # Generate coverage report
```

### 11.6 Set Up Playwright for E2E
- [x] Install Playwright
- [x] Configure for Angular

**Install Playwright:**
```bash
npm init playwright@latest
```

Choose these options:
- TypeScript: Yes
- Tests folder: e2e
- GitHub Actions: No (or Yes if you want CI)
- Install browsers: Yes

**Update playwright.config.ts:**
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:4200',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'ng serve',
    url: 'http://localhost:4200',
    reuseExistingServer: !process.env.CI,
  },
});
```

### 11.7 Write E2E Tests
- [x] Create `e2e/auth.spec.ts` (5 tests)
- [x] Create `e2e/navigation.spec.ts` (5 tests)
- [x] Test auth pages and guard redirects

**e2e/auth.spec.ts** - Tests login/register pages display correctly:
```typescript
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should display login page', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('app-login h2')).toContainText(/sign in/i);
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('should show validation errors for empty form submission', async ({ page }) => {
    await page.goto('/login');
    await page.locator('button[type="submit"]').click();
    await expect(page.locator('mat-error').first()).toBeVisible();
  });
});
```

**e2e/navigation.spec.ts** - Tests route guards redirect correctly:
```typescript
import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('should redirect unauthenticated user from dashboard to login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/login/);
  });

  test('should allow guest access to login page', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveURL(/login/);
  });
});
```

**Run E2E tests:**
```bash
npm run e2e                   # Run all tests (headless)
npm run e2e:ui                # Run with Playwright UI
npx playwright test           # Also works directly
npx playwright show-report    # View HTML test report
```

### 11.8 Push & Deploy
- [ ] Commit changes
- [ ] Push to remote
- [ ] Verify deployment

## Iteration 12: Documentation & Polish
- [ ] Write comprehensive README
- [ ] Add setup instructions
- [ ] Document architecture decisions
- [ ] Add code comments on patterns
- [ ] Final deploy & preview

---

**Pattern**: Each iteration ends with deploy & preview to maintain a working app at all times.