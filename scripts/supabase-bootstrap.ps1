<#
.SYNOPSIS
  Windows/PowerShell port of scripts/supabase-bootstrap.sh — stand up a fresh
  Supabase project for spot-radar and provision everything the app needs:
  migrations, edge functions, function secrets, exposed schema, Spotify OAuth,
  and the frontend's local credentials.

  Needs no WSL and no jq (PowerShell parses JSON natively). Works in Windows
  PowerShell 5.1 or PowerShell 7+.

.EXAMPLE
  Copy-Item .env.supabase.example .env.supabase   # fill it in once
  npm run supabase:bootstrap:win                   # create a new project + provision

.EXAMPLE
  .\scripts\supabase-bootstrap.ps1 -Ref <existing-project-ref>   # provision an existing project

.EXAMPLE
  .\scripts\supabase-bootstrap.ps1 -SkipCreate     # provision the project in .env.supabase

.NOTES
  Prereqs: supabase CLI (https://supabase.com/docs/guides/cli) and a prior `supabase login`.
#>
[CmdletBinding()]
param(
  [string]$Ref = '',
  [switch]$SkipCreate
)

$ErrorActionPreference = 'Stop'

# ── Output helpers ──────────────────────────────────────────────────────────
function Write-Bold($m) { Write-Host $m -ForegroundColor White }
function Write-Info($m) { Write-Host "  $m" }
function Write-Ok($m)   { Write-Host "OK  $m" -ForegroundColor Green }
function Write-Warn2($m) { Write-Host "!   $m" -ForegroundColor Yellow }
function Stop-With($m)  { Write-Host "x   $m" -ForegroundColor Red; exit 1 }
function Assert-Ok($what) { if ($LASTEXITCODE -ne 0) { Stop-With "$what failed (exit $LASTEXITCODE)" } }

# ── Locate repo root so the script works from anywhere ──────────────────────
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir   = Split-Path -Parent $ScriptDir
Set-Location $RootDir
$EnvFile = Join-Path $RootDir '.env.supabase'

# ── Preflight ───────────────────────────────────────────────────────────────
Write-Bold '1/8  Checking prerequisites'
if (-not (Get-Command supabase -ErrorAction SilentlyContinue)) {
  Stop-With 'supabase CLI not found. Install: https://supabase.com/docs/guides/cli'
}
if (-not (Test-Path $EnvFile)) {
  Stop-With 'Missing .env.supabase — copy .env.supabase.example to .env.supabase and fill it in.'
}
supabase projects list *> $null
if ($LASTEXITCODE -ne 0) { Stop-With "Not logged in. Run 'supabase login' first." }
Write-Ok 'supabase CLI and login present'

# ── Load .env.supabase into a hashtable ─────────────────────────────────────
$cfg = @{}
foreach ($line in Get-Content $EnvFile) {
  $t = $line.Trim()
  if ($t -eq '' -or $t.StartsWith('#')) { continue }
  $i = $t.IndexOf('=')
  if ($i -lt 1) { continue }
  $cfg[$t.Substring(0, $i).Trim()] = $t.Substring($i + 1).Trim()
}
function Get-Cfg($k) { if ($cfg.ContainsKey($k)) { $cfg[$k] } else { '' } }

$SpotifyId     = Get-Cfg 'SPOTIFY_CLIENT_ID'
$SpotifySecret = Get-Cfg 'SPOTIFY_CLIENT_SECRET'
$CronSecret    = Get-Cfg 'CRON_SECRET'
if (-not $SpotifyId)     { Stop-With 'Set SPOTIFY_CLIENT_ID in .env.supabase' }
if (-not $SpotifySecret) { Stop-With 'Set SPOTIFY_CLIENT_SECRET in .env.supabase' }
if (-not $CronSecret)    { Stop-With 'Set CRON_SECRET in .env.supabase' }

# ── Resolve the target project ref (create one if needed) ───────────────────
Write-Bold '2/8  Resolving target project'
if (-not $Ref -and $SkipCreate) { $Ref = Get-Cfg 'SUPABASE_PROJECT_REF' }

$DbPassword = Get-Cfg 'SUPABASE_DB_PASSWORD'

if (-not $Ref) {
  $OrgId = Get-Cfg 'SUPABASE_ORG_ID'
  if (-not $OrgId)      { Stop-With 'Set SUPABASE_ORG_ID (or pass -Ref / -SkipCreate). See: supabase orgs list' }
  if (-not $DbPassword) { Stop-With 'Set SUPABASE_DB_PASSWORD in .env.supabase' }
  $Region = Get-Cfg 'SUPABASE_REGION'; if (-not $Region) { $Region = 'us-east-1' }
  $Prefix = Get-Cfg 'SUPABASE_PROJECT_NAME'; if (-not $Prefix) { $Prefix = 'spot-radar' }
  $Name = "$Prefix-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
  Write-Info "Creating project '$Name' in $Region ..."
  supabase projects create $Name --org-id $OrgId --region $Region --db-password $DbPassword | Out-Null
  Assert-Ok 'supabase projects create'
  # The create output format varies; look the ref up by name to be safe.
  $projects = supabase projects list -o json | ConvertFrom-Json
  $Ref = ($projects | Where-Object { $_.name -eq $Name } | Select-Object -First 1).id
  if (-not $Ref) { Stop-With "Created project but could not resolve its ref. Check 'supabase projects list'." }
  Write-Ok "Created project $Name ($Ref)"
}
else {
  Write-Ok "Using existing project ref $Ref"
}

if (-not $DbPassword) { Stop-With 'Set SUPABASE_DB_PASSWORD in .env.supabase (needed to connect to the database)' }
$env:SUPABASE_DB_PASSWORD = $DbPassword

# ── Wait until the project is provisioned (API keys become available) ───────
Write-Bold '3/8  Waiting for the project to be ready'
$anonKey = ''
for ($attempt = 1; $attempt -le 30; $attempt++) {
  $raw = supabase projects api-keys --project-ref $Ref -o json 2>$null
  if ($LASTEXITCODE -eq 0 -and $raw) {
    try { $keys = $raw | ConvertFrom-Json } catch { $keys = $null }
    if ($keys) {
      $anonKey = ($keys | Where-Object { $_.name -eq 'anon' } | Select-Object -First 1).api_key
      if ($anonKey) { Write-Ok 'Project is ready'; break }
    }
  }
  Write-Info "not ready yet (attempt $attempt/30) — waiting 10s ..."
  Start-Sleep -Seconds 10
}
if (-not $anonKey) { Stop-With "Project did not become ready in time. Re-run with -Ref $Ref once it is up." }
$ProjectUrl = "https://$Ref.supabase.co"

# ── Link the repo to the project ────────────────────────────────────────────
Write-Bold '4/8  Linking repo to project'
supabase link --project-ref $Ref | Out-Null
Assert-Ok 'supabase link'
Write-Ok "Linked ($Ref)"

# ── Push migrations ─────────────────────────────────────────────────────────
Write-Bold '5/8  Applying database migrations'
supabase db push
Assert-Ok 'supabase db push'
Write-Ok 'Migrations applied'

# ── Push config (exposed schemas + auth providers/redirects) ────────────────
Write-Bold '6/8  Pushing project config (exposed schema, Spotify OAuth, redirect URLs)'
$env:SUPABASE_AUTH_EXTERNAL_SPOTIFY_CLIENT_ID = $SpotifyId
$env:SUPABASE_AUTH_EXTERNAL_SPOTIFY_SECRET    = $SpotifySecret
$configPushed = $false
supabase config push 2>$null
if ($LASTEXITCODE -eq 0) {
  $configPushed = $true
  Write-Ok 'Config pushed (spot_radar schema exposed, Spotify provider enabled)'
}
else {
  Write-Warn2 "'supabase config push' unavailable/failed — do these manually in the dashboard:"
  Write-Info '  - Settings -> API -> Exposed schemas: add ''spot_radar'''
  Write-Info '  - Authentication -> Providers -> Spotify: enable, paste the client id/secret'
  Write-Info '  - Authentication -> URL Configuration: set the Site URL + redirect URLs'
}

# ── Set edge-function secrets and deploy the functions ──────────────────────
Write-Bold '7/8  Setting function secrets and deploying edge functions'
# SUPABASE_URL/ANON_KEY/SERVICE_ROLE_KEY are injected by the platform and are
# reserved — never set them here. Only app secrets go in.
$tmpSecrets = New-TemporaryFile
try {
  @(
    "SPOTIFY_CLIENT_ID=$SpotifyId"
    "SPOTIFY_CLIENT_SECRET=$SpotifySecret"
    "CRON_SECRET=$CronSecret"
  ) | Set-Content -Path $tmpSecrets.FullName -Encoding ascii
  supabase secrets set --project-ref $Ref --env-file $tmpSecrets.FullName | Out-Null
  Assert-Ok 'supabase secrets set'
}
finally {
  Remove-Item $tmpSecrets.FullName -ErrorAction SilentlyContinue
}
Write-Ok 'Function secrets set (SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, CRON_SECRET)'

# Deploy every function in supabase/functions/. Functions marked
# `verify_jwt = false` in config.toml are deployed with --no-verify-jwt so the
# gateway matches their in-code auth.
function Test-NoVerifyJwt($fn) {
  $inBlock = $false
  foreach ($l in Get-Content 'supabase/config.toml') {
    if ($l -match "^\[functions\.$([regex]::Escape($fn))\]") { $inBlock = $true; continue }
    if ($l -match '^\[') { $inBlock = $false }
    if ($inBlock -and $l -match 'verify_jwt\s*=\s*false') { return $true }
  }
  return $false
}

foreach ($dir in Get-ChildItem 'supabase/functions' -Directory) {
  if (-not (Test-Path (Join-Path $dir.FullName 'index.ts'))) { continue }
  $fn = $dir.Name
  if (Test-NoVerifyJwt $fn) {
    Write-Info "deploying $fn --no-verify-jwt"
    supabase functions deploy $fn --project-ref $Ref --no-verify-jwt | Out-Null
  }
  else {
    Write-Info "deploying $fn"
    supabase functions deploy $fn --project-ref $Ref | Out-Null
  }
  Assert-Ok "supabase functions deploy $fn"
}
Write-Ok 'Edge functions deployed'

# ── Write the frontend's local credentials ──────────────────────────────────
Write-Bold '8/8  Writing src/environments/environment.local.ts'
$envLocal = @"
import { Environment } from './environment.interface';

// Generated by scripts/supabase-bootstrap.ps1 — gitignored, safe to overwrite.
export const localOverrides: Partial<Environment> = {
  supabaseUrl: '$ProjectUrl',
  supabaseAnonKey: '$anonKey',
};
"@
Set-Content -Path 'src/environments/environment.local.ts' -Value $envLocal -Encoding utf8
Write-Ok "Wrote environment.local.ts ($ProjectUrl)"

# ── Final report + the one unavoidable manual step ──────────────────────────
$callbackUrl = "$ProjectUrl/auth/v1/callback"
Write-Host ''
Write-Bold "Done. Project $Ref is provisioned."
Write-Host ''
Write-Bold "One manual step (per new project) — Spotify won't accept a login until this is set:"
Write-Info 'In the Spotify app at https://developer.spotify.com/dashboard -> Edit settings ->'
Write-Info 'Redirect URIs, add:'
Write-Host "    $callbackUrl" -ForegroundColor White
Write-Host ''
if (-not $configPushed) {
  Write-Warn2 "config push didn't run — also complete the dashboard steps listed above."
}
Write-Bold 'Optional: schedule the release refresh cron'
Write-Info "Create a scheduled job (Supabase Dashboard -> Integrations -> Cron, or pg_cron)"
Write-Info "that POSTs to $ProjectUrl/functions/v1/refresh-releases with header"
Write-Info "'x-cron-secret: <your CRON_SECRET>' on your preferred cadence."
Write-Host ''
Write-Info "Frontend is ready: run 'npm start' (dev) or 'npm run build' (prod picks up the"
Write-Info 'same values via SUPABASE_URL/SUPABASE_ANON_KEY env in CI).'
