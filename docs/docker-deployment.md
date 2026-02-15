# Docker Deployment Guide

Deploy the Angular app container to a NAS or any Docker host. The Supabase infrastructure (Postgres, GoTrue, Kong, etc.) is managed separately — this repo only builds and runs the Angular SSR application.

## 1. Configure credentials

Copy `src/environments/environment.docker.local.example.ts` to `src/environments/environment.docker.local.ts` (gitignored) and fill in your NAS Supabase credentials:

```ts
import { Environment } from './environment.interface';

export const dockerLocalOverrides: Partial<Environment> = {
  supabaseUrl: 'http://YOUR_NAS_IP:8001', // Kong gateway URL
  supabaseAnonKey: 'YOUR_ANON_KEY', // from your Supabase infra
  siteUrl: 'http://YOUR_NAS_IP:4200', // where the Angular app will be served
};
```

This is separate from `environment.local.ts` (used for local dev), so your local dev environment stays pointed at your cloud Supabase.

These are **compile-time** values baked into the JS bundle — they must exist before building.

## 2. Build the Angular app

```bash
npm run build -- --configuration=docker
```

Uses the `docker` config in `angular.json` which swaps in `environment.docker.ts`, spreading `environmentBase` with your `localOverrides`.

## 3. Apply app-specific SQL migrations

Base infrastructure (roles, auth schema, extensions, GoTrue) is handled by the `supabase-shared` repo. This repo only ships app-specific tables and policies:

1. `docker/volumes/db/01-app.sql` — profiles/notes tables, RLS policies, grants
2. `docker/finalize.sh` — auth trigger + FK constraints (run after GoTrue has created `auth.users`)

## 4. Deploy the container

From the project root on your Docker host:

```bash
docker compose -f docker/docker-compose.yml up -d --build
```

`Dockerfile.app` copies the pre-built `dist/` artifacts into a Node 20 Alpine container and runs the SSR server on port 4200.

To use a different port:

```bash
APP_PORT=3000 docker compose -f docker/docker-compose.yml up -d --build
```

## 5. Verify

- Visit `http://YOUR_NAS_IP:4200`
- Log in — should authenticate against your Supabase instance
- Check the browser network tab — API calls should go to your `supabaseUrl`

## Key points

- **Credentials are compile-time** — changing `supabaseUrl` or `supabaseAnonKey` requires a rebuild.
- **Build before deploy** — `Dockerfile.app` expects `dist/` to already exist.
- **SQL files are app-specific only** — base Supabase infrastructure is managed by `supabase-shared`.
- **Database schema** — App tables live in the `angular_starter` schema (not `public`). PostgREST in `supabase-shared` must expose this schema: set `PGRST_DB_SCHEMAS: "public,angular_starter"` on the PostgREST service. Realtime replication must also be enabled for the `angular_starter` schema.
