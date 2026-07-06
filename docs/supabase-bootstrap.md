# Rebuilding the Supabase project

Free-tier Supabase projects pause and eventually expire. `scripts/supabase-bootstrap.sh`
rebuilds a fully-provisioned project in a couple of minutes so you don't have to
click through the dashboard each time.

## One-time setup

1. Install the [Supabase CLI](https://supabase.com/docs/guides/cli) and [`jq`](https://jqlang.github.io/jq/), then log in:

   ```bash
   supabase login
   ```

2. Copy the config template and fill it in (it's gitignored):

   ```bash
   cp .env.supabase.example .env.supabase
   ```

   | Variable                                      | Where it comes from                                                                                                               |
   | --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
   | `SPOTIFY_CLIENT_ID` / `SPOTIFY_CLIENT_SECRET` | Your app at [developer.spotify.com/dashboard](https://developer.spotify.com/dashboard) — the same app is reused for every project |
   | `CRON_SECRET`                                 | Any long random string (`openssl rand -hex 32`) — guards the `refresh-releases` function                                          |
   | `SUPABASE_ORG_ID`                             | `supabase orgs list` (only needed when creating a project)                                                                        |
   | `SUPABASE_REGION`                             | e.g. `us-east-1`                                                                                                                  |
   | `SUPABASE_DB_PASSWORD`                        | A strong password for the new project's Postgres database                                                                         |

## Every time a project expires

**macOS / Linux** (needs `jq`):

```bash
npm run supabase:bootstrap
```

**Windows** — use the PowerShell version (no WSL and no `jq` needed; runs in
Windows PowerShell 5.1 or PowerShell 7+):

```powershell
npm run supabase:bootstrap:win
```

> On Windows the Bash script fails with "Windows Subsystem for Linux has no
> installed distributions" because `bash` is routed to WSL. Use the `:win`
> script instead — it's a native PowerShell port with identical behavior.

That single command:

1. Creates a new Supabase project (or targets an existing one — see below).
2. Waits for it to finish provisioning.
3. Links the repo and runs `supabase db push` (all migrations).
4. Runs `supabase config push` — exposes the `spot_radar` schema, enables the
   Spotify OAuth provider, and sets the site/redirect URLs.
5. Sets the edge-function secrets (`SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`,
   `CRON_SECRET`) and deploys every function in `supabase/functions/`
   (`refresh-releases` is deployed `--no-verify-jwt` to match its in-code
   `CRON_SECRET` check).
6. Writes the new project URL + anon key into
   `src/environments/environment.local.ts` (gitignored) so the frontend just works.

> `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are
> injected into edge functions by the platform and are reserved — the script
> never sets them.

### Provision an existing project instead of creating one

```bash
./scripts/supabase-bootstrap.sh --ref <project-ref>
# or set SUPABASE_PROJECT_REF in .env.supabase and:
./scripts/supabase-bootstrap.sh --skip-create
```

## The one manual step

Each new project gets a fresh OAuth callback URL that Spotify must be told about.
The script prints it at the end:

```
https://<project-ref>.supabase.co/auth/v1/callback
```

Add that to your Spotify app's **Redirect URIs** (Spotify Dashboard → your app →
Edit settings). This is the only thing the CLI can't do for you. Spotify logins
fail until it's set.

## Optional: schedule the background refresh

`refresh-releases` is deployed but not scheduled. To keep the shared release data
warm, add a scheduled job (Supabase Dashboard → Integrations → Cron, or `pg_cron`)
that POSTs to `https://<project-ref>.supabase.co/functions/v1/refresh-releases`
with header `x-cron-secret: <your CRON_SECRET>` on your preferred cadence.

## If `supabase config push` isn't supported by your CLI version

The script falls back to printing manual dashboard steps: expose the `spot_radar`
schema (Settings → API), enable the Spotify provider (Authentication → Providers),
and set the site/redirect URLs (Authentication → URL Configuration). Upgrading the
CLI (`supabase upgrade` or reinstall) is the easier fix.
