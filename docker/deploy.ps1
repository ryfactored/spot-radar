<#
.SYNOPSIS
    Deploy Angular app to NAS
.DESCRIPTION
    Runs setup, builds the app, and copies files to NAS
.PARAMETER NasIp
    IP address of your NAS (e.g., 192.168.1.50)
.PARAMETER NasShare
    Network share path (default: docker\angular-starter)
.EXAMPLE
    .\docker\deploy.ps1 -NasIp 192.168.1.50
#>

param(
    [Parameter(Mandatory=$true)]
    [string]$NasIp,

    [string]$NasShare = "docker\angular-starter"
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot

Write-Host "`n=== Angular Starter NAS Deployment ===" -ForegroundColor Cyan

# Step 1: Run setup script
Write-Host "`n[1/4] Running setup script..." -ForegroundColor Yellow
Push-Location $ProjectRoot
node docker/setup.js $NasIp
if ($LASTEXITCODE -ne 0) { throw "Setup script failed" }

# Step 2: Build the app (clean cache first)
Write-Host "`n[2/4] Building app..." -ForegroundColor Yellow
if (Test-Path ".angular") { Remove-Item -Recurse -Force .angular }
if (Test-Path "dist") { Remove-Item -Recurse -Force dist }
npm run build -- --configuration=docker
if ($LASTEXITCODE -ne 0) { throw "Build failed" }

# Step 3: Copy to NAS
Write-Host "`n[3/4] Copying files to NAS..." -ForegroundColor Yellow
$NasPath = "\\$NasIp\$NasShare"

# Create destination if needed
if (!(Test-Path $NasPath)) {
    New-Item -ItemType Directory -Force -Path $NasPath | Out-Null
}

Copy-Item -Recurse -Force -Path dist -Destination $NasPath
Copy-Item -Recurse -Force -Path docker -Destination $NasPath
Copy-Item -Force -Path package.json, package-lock.json, .dockerignore -Destination $NasPath

Pop-Location

# Step 4: Instructions
Write-Host "`n[4/4] Files copied!" -ForegroundColor Green
Write-Host "`n=== Next Steps ===" -ForegroundColor Cyan
Write-Host @"

SSH into your NAS and run:

  cd /volume1/docker/angular-starter/docker
  sudo ./start.sh

Then open: http://${NasIp}:4200

"@
