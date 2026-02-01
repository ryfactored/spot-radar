# Clone & Setup Guide

How to go from `git clone` to a running app connected to your own Supabase project.

---

## Prerequisites

- **Node.js 20+**
- **npm 10+**
- A free [Supabase](https://supabase.com) account

---

## 1. Clone and install

```bash
git clone <repository-url> my-app
cd my-app
npm install
```

---

## 2. Create a Supabase project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) and create a new project.
2. Once the project is ready, go to **Settings > API** and copy:
   - **Project URL** (e.g. `https://abcdefgh.supabase.co`)
   - **anon / public** key (starts with `eyJ...`)

---

## 3. Configure environment files

Open `src/environments/environment.ts` (dev) and `src/environments/environment.prod.ts` (production) and replace the placeholder Supabase credentials:

```ts
supabaseUrl: 'https://YOUR_PROJECT.supabase.co',
supabaseAnonKey: 'YOUR_ANON_KEY',
```

Update `siteUrl` in each file:

```ts
// environment.ts (dev)
siteUrl: 'http://localhost:4200',

// environment.prod.ts (production)
siteUrl: 'https://your-domain.com',
```

`siteUrl` is used for email redirect links (password reset, email verification, OAuth callbacks).

---

## 4. Set up the database

The SQL migrations live in `supabase/migrations/`. Run them in your Supabase **SQL Editor** (Dashboard > SQL Editor > New query).

### Core schema (required)

Run [`supabase/migrations/001_initial_schema.sql`](../supabase/migrations/001_initial_schema.sql). This creates:

- `profiles` table with RLS policies
- Auto-create trigger (new profile row on every sign-up)
- `avatars` storage bucket for profile pictures

### Example feature tables (optional)

Run [`supabase/migrations/002_example_features.sql`](../supabase/migrations/002_example_features.sql) if you're keeping the example features (Notes, Chat, Files). Skip it entirely or comment out individual sections for features you don't need. See [feature-removal.md](./feature-removal.md) for details.

After running 002, enable Realtime for the Chat feature:

1. Go to **Database > Replication** in the Supabase dashboard.
2. Toggle on Realtime for the `messages` table.

---

## 5. Configure authentication

### Email/password (enabled by default)

Works out of the box. Supabase's free tier limits auth emails (confirmation, password reset) to **2 per hour**. To avoid hitting this during development, configure a custom SMTP provider:

1. Go to **Authentication > SMTP Settings** in the Supabase dashboard.
2. Use a provider like [Resend](https://resend.com) (free tier: 100 emails/day):
   - Host: `smtp.resend.com`
   - Port: `465`
   - Username: `resend`
   - Password: your Resend API key
   - Sender: an address on your verified domain

### OAuth providers (optional)

To enable social login (Google, GitHub, Spotify, Apple, Discord):

1. Go to **Authentication > Providers** in the Supabase dashboard.
2. Enable the providers you want and add the required OAuth credentials from each provider's developer console.
3. Go to **Authentication > URL Configuration** and add redirect URLs:
   - `http://localhost:4200/**` (local development)
   - `https://your-domain.com/**` (production)
4. Update the `socialProviders` array in both environment files to match:

```ts
// Only list providers you've configured
socialProviders: ['google', 'github'] as const,
```

---

## 6. Start the dev server

```bash
npm start
```

Open [http://localhost:4200](http://localhost:4200). Register an account, confirm your email, and sign in.

---

## Customization checklist

When cloning this template for a new project, update these values:

### Environment files (`src/environments/environment.ts` + `environment.prod.ts`)

| Field                     | What it does                                                                 |
| ------------------------- | ---------------------------------------------------------------------------- |
| `appName`                 | Namespace for localStorage keys (e.g. `angular-starter:preferences:userId`). |
| `supabaseUrl`             | Your Supabase project URL.                                                   |
| `supabaseAnonKey`         | Your Supabase anon/public key.                                               |
| `socialProviders`         | Which OAuth buttons appear on the login/register pages.                      |
| `siteUrl`                 | Base URL for email redirect links (password reset, email verification).      |
| `siteTitle`               | Shown in the toolbar and browser tab.                                        |
| `siteDescription`         | Used for SEO meta tags.                                                      |
| `toastDuration`           | How long toast notifications stay visible (ms).                              |
| `upload`                  | Max file sizes for avatar and attachment uploads (MB).                       |
| `passwordMinLength`       | Must match your Supabase auth settings.                                      |
| `defaults`                | Default theme, dark mode, and sidenav state for new users.                   |
| `cacheTtlMinutes`         | How long signal stores cache data before refetching.                         |
| `pagination`              | Default page size and page size options for lists.                           |
| `chatMessageLimit`        | Number of recent messages loaded in Chat.                                    |
| `signedUrlExpirationSecs` | How long signed storage URLs are valid.                                      |
| `storageBuckets`          | Bucket names (must match what you created in Supabase).                      |
| `searchDebounceMs`        | Delay before search input triggers a query.                                  |
| `loadingBarDelayMs`       | Minimum visible duration for the route loading bar.                          |

### Branding

- **Site title**: `siteTitle` in environment files + `<title>` in `src/index.html`.
- **Favicon**: Replace `public/favicon.ico`.
- **Font**: The app uses Inter via Google Fonts. Change the `<link>` tag in `src/index.html` if desired.
- **Theme colors**: See [docs/theming.md](./theming.md) for how to customize the three built-in color themes or add new ones.

### localStorage key

The `appName` field (default: `angular-starter`) is used as a prefix for all localStorage keys:

- `{appName}:preferences:{userId}` — user preferences (theme, sidenav)
- `{appName}:theme` — theme snapshot for flash prevention

Change `appName` to your project name to avoid collisions if multiple apps run on the same domain.

---

## Deployment

### Vercel (recommended)

This app uses SSR with Express. Vercel auto-detects Angular SSR projects.

1. Push your code to GitHub/GitLab.
2. Import the repository in [Vercel](https://vercel.com).
3. Vercel should auto-detect the framework. If not, set:
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist/angular-starter`
4. No environment variables needed in Vercel — credentials are baked into `environment.prod.ts` via Angular's file replacement at build time.
5. After deploying, update Supabase:
   - **Authentication > URL Configuration > Site URL**: set to your Vercel domain.
   - **Authentication > URL Configuration > Redirect URLs**: add `https://your-domain.vercel.app/**`.
   - Update `siteUrl` in `environment.prod.ts` to match.

### SSR production server

To run the SSR server yourself (e.g. on a VPS, Docker, or cloud VM):

```bash
npm run build
node dist/angular-starter/server/server.mjs
```

The server listens on the `PORT` environment variable (default: `4200`).

### Static hosting (no SSR)

If you don't need SSR, change `outputMode` in `angular.json` from `"server"` to `"static"`, remove the `ssr` config, and deploy `dist/angular-starter/browser` to any static host (Netlify, Firebase Hosting, S3, etc.). You'll need to configure a fallback to `index.html` for client-side routing.

---

## Available commands

| Command                        | Description                         |
| ------------------------------ | ----------------------------------- |
| `npm start`                    | Dev server at http://localhost:4200 |
| `npm run build`                | Production build                    |
| `npm test`                     | Unit tests (Vitest, watch mode)     |
| `npm test -- --no-watch`       | Unit tests, single run              |
| `npm run e2e`                  | Playwright E2E tests (headless)     |
| `npm run e2e:ui`               | Playwright with interactive UI      |
| `npm run e2e:update-snapshots` | Update visual regression snapshots  |
| `npm run lint`                 | ESLint                              |
| `npm run format`               | Prettier (write)                    |
| `npm run format:check`         | Prettier (check only)               |
| `npm run serve:ssr`            | Run SSR production server locally   |
| `npm run serve:ssr:dev`        | Build dev + run SSR server          |

---

## Security headers

When deploying to production, configure these HTTP response headers on your web server or hosting provider. The exact values depend on your CDNs, analytics services, and third-party integrations.

### Recommended headers

| Header                      | Recommended Value                          | Notes                       |
| --------------------------- | ------------------------------------------ | --------------------------- |
| `Content-Security-Policy`   | See example below                          | Restrict resource origins   |
| `X-Frame-Options`           | `DENY`                                     | Prevent clickjacking        |
| `X-Content-Type-Options`    | `nosniff`                                  | Prevent MIME-type sniffing  |
| `Referrer-Policy`           | `strict-origin-when-cross-origin`          | Limit referrer information  |
| `Permissions-Policy`        | `camera=(), microphone=(), geolocation=()` | Disable unused browser APIs |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains`      | Enforce HTTPS (HSTS)        |

### Example CSP

Adjust the domains to match your Supabase project and any third-party services:

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self';
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' data: https://*.supabase.co;
  connect-src 'self' https://*.supabase.co wss://*.supabase.co;
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';
```

> **Note**: `'unsafe-inline'` is required for styles because Angular Material injects inline styles. If you use a nonce-based CSP strategy, configure Angular's `CSP_NONCE` injection token.

### Where to set headers

- **Vercel**: Add a `vercel.json` with a `headers` array.
- **Netlify**: Add a `_headers` file in the publish directory.
- **Express SSR**: Use the [helmet](https://www.npmjs.com/package/helmet) middleware in `server.ts`.
- **Nginx/Apache**: Set headers in your server configuration.

---

## Further reading

- [Feature Removal Guide](./feature-removal.md) — how to strip example features you don't need
- [Theming Guide](./theming.md) — how to customize colors and add new themes
- [Accessibility Notes](./accessibility.md) — accessibility audit results and patterns used
