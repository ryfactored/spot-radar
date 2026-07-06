#!/usr/bin/env bash
#
# supabase-bootstrap.sh — stand up a fresh Supabase project for spot-radar and
# provision everything the app needs: migrations, edge functions, function
# secrets, exposed schema, Spotify OAuth, and the frontend's local credentials.
#
# Free-tier projects pause/expire; this rebuilds one in a couple of minutes
# instead of clicking through the dashboard each time.
#
# Usage:
#   cp .env.supabase.example .env.supabase   # fill it in once
#   ./scripts/supabase-bootstrap.sh          # create a new project + provision
#   ./scripts/supabase-bootstrap.sh --ref <existing-project-ref>   # provision an existing one
#   ./scripts/supabase-bootstrap.sh --skip-create   # provision the project in .env.supabase
#
# Prereqs: supabase CLI (https://supabase.com/docs/guides/cli), jq, and a prior
# `supabase login`.
set -euo pipefail

# ── Locate repo root so the script works from anywhere ──────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT_DIR"

ENV_FILE="$ROOT_DIR/.env.supabase"

bold() { printf '\033[1m%s\033[0m\n' "$*"; }
info() { printf '  %s\n' "$*"; }
ok()   { printf '\033[32m✓\033[0m %s\n' "$*"; }
warn() { printf '\033[33m!\033[0m %s\n' "$*"; }
die()  { printf '\033[31m✗ %s\033[0m\n' "$*" >&2; exit 1; }

# ── Parse args ──────────────────────────────────────────────────────────────
REF_OVERRIDE=""
SKIP_CREATE="false"
while [ $# -gt 0 ]; do
  case "$1" in
    --ref) REF_OVERRIDE="${2:-}"; shift 2 ;;
    --skip-create) SKIP_CREATE="true"; shift ;;
    -h|--help) grep '^#' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) die "Unknown argument: $1" ;;
  esac
done

# ── Preflight ───────────────────────────────────────────────────────────────
bold "1/8  Checking prerequisites"
command -v supabase >/dev/null 2>&1 || die "supabase CLI not found. Install: https://supabase.com/docs/guides/cli"
command -v jq >/dev/null 2>&1 || die "jq not found. Install jq (e.g. 'brew install jq' or 'apt-get install jq')."
[ -f "$ENV_FILE" ] || die "Missing $ENV_FILE — copy .env.supabase.example to .env.supabase and fill it in."
# Confirm we're authenticated (this call fails if not logged in).
supabase projects list >/dev/null 2>&1 || die "Not logged in. Run 'supabase login' first."
ok "supabase CLI, jq, and login present"

# shellcheck disable=SC1090
set -a; . "$ENV_FILE"; set +a

: "${SPOTIFY_CLIENT_ID:?Set SPOTIFY_CLIENT_ID in .env.supabase}"
: "${SPOTIFY_CLIENT_SECRET:?Set SPOTIFY_CLIENT_SECRET in .env.supabase}"
: "${CRON_SECRET:?Set CRON_SECRET in .env.supabase}"

# ── Resolve the target project ref (create one if needed) ───────────────────
bold "2/8  Resolving target project"
REF="$REF_OVERRIDE"
[ -z "$REF" ] && [ "$SKIP_CREATE" = "true" ] && REF="${SUPABASE_PROJECT_REF:-}"

if [ -z "$REF" ]; then
  : "${SUPABASE_ORG_ID:?Set SUPABASE_ORG_ID (or pass --ref / --skip-create). See: supabase orgs list}"
  : "${SUPABASE_DB_PASSWORD:?Set SUPABASE_DB_PASSWORD in .env.supabase}"
  REGION="${SUPABASE_REGION:-us-east-1}"
  NAME="${SUPABASE_PROJECT_NAME:-spot-radar}-$(date +%Y%m%d-%H%M%S)"
  info "Creating project '$NAME' in $REGION ..."
  supabase projects create "$NAME" \
    --org-id "$SUPABASE_ORG_ID" \
    --region "$REGION" \
    --db-password "$SUPABASE_DB_PASSWORD" >/dev/null
  # The create output format varies; look the ref up by name to be safe.
  REF="$(supabase projects list -o json | jq -r --arg n "$NAME" '.[] | select(.name==$n) | .id' | head -n1)"
  [ -n "$REF" ] || die "Created project but could not resolve its ref. Check 'supabase projects list'."
  ok "Created project $NAME ($REF)"
else
  ok "Using existing project ref $REF"
fi

# Everything below needs the DB password (link, db push). Require it now.
: "${SUPABASE_DB_PASSWORD:?Set SUPABASE_DB_PASSWORD in .env.supabase (needed to connect to the database)}"
export SUPABASE_DB_PASSWORD

# ── Wait until the project is provisioned (API keys become available) ───────
bold "3/8  Waiting for the project to be ready"
API_KEYS_JSON=""
for attempt in $(seq 1 30); do
  if API_KEYS_JSON="$(supabase projects api-keys --project-ref "$REF" -o json 2>/dev/null)" \
     && [ "$(echo "$API_KEYS_JSON" | jq 'length')" -gt 0 ]; then
    ok "Project is ready"
    break
  fi
  info "not ready yet (attempt $attempt/30) — waiting 10s ..."
  sleep 10
done
[ -n "$API_KEYS_JSON" ] || die "Project did not become ready in time. Re-run with --ref $REF once it is up."

ANON_KEY="$(echo "$API_KEYS_JSON" | jq -r '.[] | select(.name=="anon") | .api_key')"
[ -n "$ANON_KEY" ] && [ "$ANON_KEY" != "null" ] || die "Could not read the anon key."
PROJECT_URL="https://${REF}.supabase.co"

# ── Link the repo to the project ────────────────────────────────────────────
bold "4/8  Linking repo to project"
supabase link --project-ref "$REF" >/dev/null
ok "Linked ($REF)"

# ── Push migrations ─────────────────────────────────────────────────────────
bold "5/8  Applying database migrations"
supabase db push
ok "Migrations applied"

# ── Push config (exposed schemas + auth providers/redirects) ────────────────
bold "6/8  Pushing project config (exposed schema, Spotify OAuth, redirect URLs)"
# config.toml reads these via env() substitution for the OAuth provider.
export SUPABASE_AUTH_EXTERNAL_SPOTIFY_CLIENT_ID="$SPOTIFY_CLIENT_ID"
export SUPABASE_AUTH_EXTERNAL_SPOTIFY_SECRET="$SPOTIFY_CLIENT_SECRET"
if supabase config push 2>/dev/null; then
  ok "Config pushed (spot_radar schema exposed, Spotify provider enabled)"
  CONFIG_PUSHED="true"
else
  CONFIG_PUSHED="false"
  warn "'supabase config push' unavailable/failed — do these manually in the dashboard:"
  info "  • Settings → API → Exposed schemas: add 'spot_radar'"
  info "  • Authentication → Providers → Spotify: enable, paste the client id/secret"
  info "  • Authentication → URL Configuration: set the Site URL + redirect URLs"
fi

# ── Set edge-function secrets and deploy the functions ──────────────────────
bold "7/8  Setting function secrets and deploying edge functions"
# SUPABASE_URL/ANON_KEY/SERVICE_ROLE_KEY are injected by the platform and are
# reserved — never set them here. Only app secrets go in.
TMP_SECRETS="$(mktemp)"
trap 'rm -f "$TMP_SECRETS"' EXIT
{
  echo "SPOTIFY_CLIENT_ID=$SPOTIFY_CLIENT_ID"
  echo "SPOTIFY_CLIENT_SECRET=$SPOTIFY_CLIENT_SECRET"
  echo "CRON_SECRET=$CRON_SECRET"
} > "$TMP_SECRETS"
supabase secrets set --project-ref "$REF" --env-file "$TMP_SECRETS" >/dev/null
ok "Function secrets set (SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, CRON_SECRET)"

# Deploy every function in supabase/functions/. Functions marked
# `verify_jwt = false` in config.toml are deployed with --no-verify-jwt so the
# gateway matches their in-code auth.
for fn_dir in supabase/functions/*/; do
  [ -f "${fn_dir}index.ts" ] || continue
  fn="$(basename "$fn_dir")"
  no_verify=""
  if awk -v f="[functions.$fn]" '
        $0==f {inblk=1; next}
        /^\[/ {inblk=0}
        inblk && /verify_jwt[[:space:]]*=[[:space:]]*false/ {found=1}
        END {exit !found}' supabase/config.toml; then
    no_verify="--no-verify-jwt"
  fi
  info "deploying $fn ${no_verify}"
  supabase functions deploy "$fn" --project-ref "$REF" $no_verify >/dev/null
done
ok "Edge functions deployed"

# ── Write the frontend's local credentials ──────────────────────────────────
bold "8/8  Writing src/environments/environment.local.ts"
cat > src/environments/environment.local.ts <<EOF
import { Environment } from './environment.interface';

// Generated by scripts/supabase-bootstrap.sh — gitignored, safe to overwrite.
export const localOverrides: Partial<Environment> = {
  supabaseUrl: '${PROJECT_URL}',
  supabaseAnonKey: '${ANON_KEY}',
};
EOF
ok "Wrote environment.local.ts ($PROJECT_URL)"

# ── Final report + the one unavoidable manual step ──────────────────────────
CALLBACK_URL="${PROJECT_URL}/auth/v1/callback"
echo
bold "Done. Project $REF is provisioned."
echo
bold "One manual step (per new project) — Spotify won't accept a login until this is set:"
info "In the Spotify app at https://developer.spotify.com/dashboard → Edit settings →"
info "Redirect URIs, add:"
printf '    \033[1m%s\033[0m\n' "$CALLBACK_URL"
echo
if [ "${CONFIG_PUSHED}" != "true" ]; then
  warn "config push didn't run — also complete the dashboard steps listed above."
fi
bold "Optional: schedule the release refresh cron"
info "Create a scheduled job (Supabase Dashboard → Integrations → Cron, or pg_cron)"
info "that POSTs to ${PROJECT_URL}/functions/v1/refresh-releases with header"
info "'x-cron-secret: <your CRON_SECRET>' on your preferred cadence."
echo
info "Frontend is ready: run 'npm start' (dev) or 'npm run build' (prod picks up the"
info "same values via SUPABASE_URL/SUPABASE_ANON_KEY env in CI)."
