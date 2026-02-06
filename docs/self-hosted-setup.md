# Self-Hosted Supabase Lite Setup

Deploy a minimal Supabase stack on your Synology NAS or any Docker-capable server. This "lite" setup includes only authentication and database - no realtime, storage, or studio services.

## Prerequisites

### On Your Synology NAS

- DSM 7.0 or later
- Docker package installed (Package Center → Docker)
- SSH enabled (Control Panel → Terminal & SNMP → Enable SSH service)

### On Your PC

- Node.js installed (for running the setup script)
- Network access to NAS (shared folder like `\\192.168.1.50\docker` or via SSH)
- SSH client (Windows Terminal, PuTTY, or built-in `ssh` command)

## Features

| Feature             | Status      | Notes                     |
| ------------------- | ----------- | ------------------------- |
| Profile (name, bio) | ✅ Enabled  | No avatar upload          |
| Notes               | ✅ Enabled  | Full CRUD                 |
| Admin (user list)   | ✅ Enabled  | First user is auto-admin  |
| Chat                | ❌ Disabled | Requires Realtime service |
| Files               | ❌ Disabled | Requires Storage service  |

## Resource Requirements

| Service       | Purpose        | RAM    |
| ------------- | -------------- | ------ |
| PostgreSQL 15 | Database       | ~200MB |
| PostgREST     | REST API       | ~50MB  |
| GoTrue        | Authentication | ~50MB  |
| Kong          | API Gateway    | ~100MB |
| Angular App   | Frontend       | ~100MB |

**Total: ~500MB RAM** (compared to 2-4GB for full Supabase stack)

## Quick Start

### Option A: Automated (Recommended)

**On your PC (PowerShell):**

```powershell
.\docker\deploy.ps1 -NasIp 192.168.1.50
```

**On your NAS (SSH):**

```bash
cd /volume1/docker/angular-starter/docker
sudo ./start.sh --fresh
```

That's it! Open http://192.168.1.50:4200 and register.

### Available Scripts

| Script        | Location | Purpose                                            |
| ------------- | -------- | -------------------------------------------------- |
| `deploy.ps1`  | PC       | Full deploy: setup, build, copy (regenerates keys) |
| `update.ps1`  | PC       | App update only: build, copy (keeps existing keys) |
| `start.sh`    | NAS      | Starts all containers (`--fresh` to wipe DB)       |
| `teardown.sh` | NAS      | Stops containers (`--all` to also wipe DB)         |
| `finalize.sh` | NAS      | Creates auth triggers (called by start.sh)         |

---

### Option B: Manual Steps

<details>
<summary>Click to expand manual instructions</summary>

#### 1. Run Setup Script

The setup script generates all secrets and configures `.env`, `environment.docker.ts`, and `kong.yml`:

```bash
node docker/setup.js 192.168.1.50
```

This configures:

- `docker/.env` - Database passwords, JWT secrets, API keys
- `src/environments/environment.docker.ts` - Angular app configuration
- `docker/volumes/kong/kong.yml` - API gateway authentication keys

#### 2. Build the App

Build the Angular app locally with the docker configuration:

```bash
npm run build -- --configuration=docker
```

This creates pre-built artifacts in the `dist/` folder, avoiding slow builds on the NAS.

#### 3. Copy Files to Your NAS

Copy only the necessary files (not the entire source):

```bash
# Standard SSH port (22)
scp -r dist docker package.json package-lock.json .dockerignore user@192.168.1.50:/volume1/docker/angular-starter/

# Custom SSH port (e.g., 49165)
scp -P 49165 -r dist docker package.json package-lock.json .dockerignore user@192.168.1.50:/volume1/docker/angular-starter/
```

Or on Windows via network share:

```powershell
# Create destination folder
New-Item -ItemType Directory -Force -Path "\\192.168.1.50\docker\angular-starter"

# Copy only what's needed
Copy-Item -Recurse -Force -Path dist -Destination "\\192.168.1.50\docker\angular-starter\"
Copy-Item -Recurse -Force -Path docker -Destination "\\192.168.1.50\docker\angular-starter\"
Copy-Item -Force -Path package.json, package-lock.json, .dockerignore -Destination "\\192.168.1.50\docker\angular-starter\"
```

**What gets copied:**

- `dist/` - Pre-built Angular app
- `docker/` - Docker Compose files, Kong config, DB init scripts
- `package.json`, `package-lock.json` - For installing production dependencies
- `.dockerignore` - Tells Docker which files to include in the build

**Not needed on NAS:** `src/`, `node_modules/`, `e2e/`, config files

#### 4. Start Services

SSH into your NAS and start Docker:

```bash
# Standard port
ssh user@192.168.1.50

# Custom port
ssh -p 49165 user@192.168.1.50

cd /volume1/docker/angular-starter/docker
sudo docker-compose up -d --build
```

The `--build` flag ensures Docker builds the app image with your files (not cached).

#### 5. Run Finalize Script

Wait for all containers to be healthy (~30 seconds), then run the finalize script to set up the profile trigger:

```bash
# Wait for services to be ready
sleep 30

# Run finalize script (creates auth trigger for auto-creating profiles)
chmod +x finalize.sh
sudo ./finalize.sh
```

This creates a trigger on `auth.users` that automatically creates a profile when a user registers. The first registered user is automatically made an admin.

</details>

### 6. Register

1. Open http://192.168.1.50:4200
2. Register with email/password
3. **First registered user automatically becomes admin**

That's it! You're ready to use the app.

## Customizing Secrets (Optional)

The setup script auto-generates secure secrets. If you prefer to use your own:

### Generate Secrets Manually

**Linux/Mac:**

```bash
# PostgreSQL password
openssl rand -base64 32

# JWT secret (at least 32 characters)
openssl rand -base64 32
```

**Windows (PowerShell):**

```powershell
# PostgreSQL password
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }) -as [byte[]])

# JWT secret
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }) -as [byte[]])
```

### Generate API Keys

The `ANON_KEY` and `SERVICE_ROLE_KEY` are JWTs signed with your `JWT_SECRET`. Use the [Supabase JWT Generator](https://supabase.com/docs/guides/self-hosting/docker#generate-api-keys) or create them manually:

**Anon Key payload:**

```json
{
  "role": "anon",
  "iss": "supabase",
  "iat": 1700000000,
  "exp": 1900000000
}
```

**Service Role Key payload:**

```json
{
  "role": "service_role",
  "iss": "supabase",
  "iat": 1700000000,
  "exp": 1900000000
}
```

Sign both with your `JWT_SECRET` using the HS256 algorithm.

### Update Configuration Files

After generating your secrets:

1. Edit `docker/.env` with your values:

   ```env
   POSTGRES_PASSWORD=<your-postgres-password>
   JWT_SECRET=<your-jwt-secret>
   ANON_KEY=<your-anon-key>
   SERVICE_ROLE_KEY=<your-service-role-key>
   ```

2. Edit `src/environments/environment.docker.ts` to match:
   ```typescript
   supabaseUrl: 'http://<your-nas-ip>:8001',
   supabaseAnonKey: '<your-anon-key>',
   siteUrl: 'http://<your-nas-ip>:4200',
   ```

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Synology NAS                      │
│  ┌──────────────┐    ┌───────────────────────────┐  │
│  │  Angular App │    │    Supabase Lite          │  │
│  │   (Docker)   │───▶│  ┌──────┐  ┌──────────┐   │  │
│  │   Port 4200  │    │  │ Kong │  │ Postgres │   │  │
│  └──────────────┘    │  └──┬───┘  └──────────┘   │  │
│                      │     │                      │  │
│                      │  ┌──┴───────────┐         │  │
│                      │  │PostgREST│Auth│         │  │
│                      │  └──────────────┘         │  │
│                      └───────────────────────────┘  │
└─────────────────────────────────────────────────────┘

Port 4200: Angular application
Port 8001: Kong API gateway (routes to auth/rest services)
```

## Manual Admin Promotion

If you need to make an additional user admin:

```bash
docker exec -it supabase-db psql -U postgres -c \
  "UPDATE profiles SET role = 'admin' WHERE email = 'your@email.com';"
```

## Troubleshooting

### Check Service Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f auth
docker-compose logs -f db
docker-compose logs -f kong
```

### Database Connection Issues

If GoTrue can't connect to the database:

```bash
# Check database is healthy
docker-compose ps

# Restart services in order
docker-compose restart db
docker-compose restart auth rest
docker-compose restart kong
```

### CORS Issues

If you see CORS errors in the browser console, ensure:

1. `SITE_URL` in `.env` matches your actual frontend URL
2. Kong is running: `docker-compose ps`
3. Check Kong logs: `docker-compose logs kong`

### Reset Everything

```bash
# Stop and remove containers (keep database data)
sudo ./teardown.sh

# Full reset including database (WARNING: deletes all data)
sudo ./teardown.sh --all

# Start fresh
sudo ./start.sh --fresh
```

## Updating

### Update Angular App Only

**On your PC (PowerShell):**

```powershell
.\docker\update.ps1 -NasIp 192.168.1.50
```

**On your NAS (SSH):**

```bash
cd /volume1/docker/angular-starter/docker
sudo docker-compose build --no-cache app
sudo docker-compose up -d app
```

**Important:** Use `--no-cache` to ensure Docker doesn't use cached layers with old files.

### Update All Services

```bash
docker-compose pull
docker-compose up -d --build
```

## Managing via Synology Docker UI

After initial setup via SSH, you can manage containers through the DSM web interface:

1. Open **Docker** in DSM
2. Go to the **Container** tab
3. You'll see containers: `supabase-db`, `supabase-auth`, `supabase-rest`, `supabase-kong`, `angular-app`
4. Use the UI to:
   - Start/stop containers
   - View real-time logs
   - Monitor resource usage
   - Restart individual services

## Security Considerations

1. **Secrets are auto-generated** - The setup script creates strong, unique secrets
2. **Use HTTPS** - Consider adding Traefik or nginx for SSL termination
3. **Firewall** - Only expose ports 4200 and 8000 if needed externally
4. **Backups** - Regularly backup `volumes/db/data`

### Synology Firewall Configuration

To configure the firewall via DSM:

1. Go to **Control Panel → Security → Firewall**
2. Click **Edit Rules**
3. Add rules to allow:
   - Port **4200** (Angular app) - from your local network
   - Port **8000** (API gateway) - from your local network

Example rule:

- Ports: 4200, 8000
- Source IP: 192.168.1.0/24 (your local network)
- Action: Allow

## Backup

### Database Location

The PostgreSQL data is stored at:

```
/volume1/docker/angular-starter/docker/volumes/db/data/
```

### Hyper Backup Integration

Add this folder to **Hyper Backup** for automated backups:

1. Open **Hyper Backup** in DSM
2. Create a new data backup task
3. Select folders → navigate to `/docker/angular-starter/docker/volumes/`
4. Include the `db/data` directory
5. Set your backup schedule and destination

**Important:** Stop the database container before restoring from backup:

```bash
cd /volume1/docker/angular-starter/docker
docker-compose stop db
# Restore files...
docker-compose start db
```

## Adding HTTPS (Optional)

For production deployments, add a reverse proxy with SSL. Example with Traefik:

```yaml
# Add to docker-compose.yml
services:
  traefik:
    image: traefik:v2.10
    command:
      - '--providers.docker=true'
      - '--entrypoints.websecure.address=:443'
      - '--certificatesresolvers.letsencrypt.acme.tlschallenge=true'
      - '--certificatesresolvers.letsencrypt.acme.email=your@email.com'
      - '--certificatesresolvers.letsencrypt.acme.storage=/letsencrypt/acme.json'
    ports:
      - '443:443'
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - ./letsencrypt:/letsencrypt
```

## Future Enhancements

These are not included in the lite setup but can be added later:

- **Storage API** - For file uploads and avatars
- **Realtime** - For chat functionality
- **Studio** - Database management UI
- **Email verification** - Disable `MAILER_AUTOCONFIRM` and configure SMTP
