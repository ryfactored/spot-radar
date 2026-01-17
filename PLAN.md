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