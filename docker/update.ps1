<#
.SYNOPSIS
    Update Angular app on NAS (without regenerating API keys)
.DESCRIPTION
    Builds the app and copies dist to NAS. Use this for code-only updates.
    For fresh deployments, use deploy.ps1 instead.
.PARAMETER NasIp
    IP address of your NAS (e.g., 192.168.1.50)
.PARAMETER NasShare
    Network share path (default: docker\angular-starter)
.EXAMPLE
    .\docker\update.ps1 -NasIp 192.168.1.50
#>

param(
    [Parameter(Mandatory=$true)]
    [string]$NasIp,

    [string]$NasShare = "docker\angular-starter"
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot

Write-Host "`n=== Angular App Update ===" -ForegroundColor Cyan

# Step 1: Clean build cache
Write-Host "`n[1/3] Cleaning build cache..." -ForegroundColor Yellow
Push-Location $ProjectRoot
if (Test-Path ".angular") { Remove-Item -Recurse -Force .angular }
if (Test-Path "dist") { Remove-Item -Recurse -Force dist }

# Step 2: Build the app
Write-Host "`n[2/3] Building app..." -ForegroundColor Yellow
npm run build -- --configuration=docker
if ($LASTEXITCODE -ne 0) { throw "Build failed" }

# Step 3: Copy dist to NAS
Write-Host "`n[3/3] Copying dist to NAS..." -ForegroundColor Yellow
$NasPath = "\\$NasIp\$NasShare"
Copy-Item -Recurse -Force -Path dist -Destination $NasPath

Pop-Location

Write-Host "`n=== Build Copied ===" -ForegroundColor Green
Write-Host @"

SSH into your NAS and run:

  cd /volume1/docker/angular-starter/docker
  sudo docker-compose build --no-cache app
  sudo docker-compose up -d app

"@
