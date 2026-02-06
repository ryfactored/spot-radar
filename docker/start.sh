#!/bin/bash
# Start script for Supabase Lite on NAS
# Usage: sudo ./start.sh [--fresh]
#
# Options:
#   --fresh    Wipe database and start completely fresh

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

FRESH=false
if [ "$1" == "--fresh" ]; then
    FRESH=true
fi

echo ""
echo "=== Supabase Lite Startup ==="
echo ""

# Stop existing containers
echo "[1/4] Stopping existing containers..."
docker-compose down -v 2>/dev/null || true

if [ "$FRESH" == true ]; then
    echo "[1/4] Wiping database (--fresh mode)..."
    rm -rf volumes/db/data
fi

# Ensure data directory exists
mkdir -p volumes/db/data

# Build and start
echo "[2/4] Building and starting containers..."
docker-compose up -d --build

# Wait for services
echo "[3/4] Waiting for services to be healthy..."
sleep 10

# Check if containers are running
if ! docker-compose ps | grep -q "Up"; then
    echo "ERROR: Containers failed to start. Check logs with: docker-compose logs"
    exit 1
fi

# Run finalize script
echo "[4/4] Running finalize script..."
chmod +x finalize.sh
./finalize.sh

echo ""
echo "=== Startup Complete ==="
echo ""
echo "Open your browser to register:"
echo "  http://$(hostname -I | awk '{print $1}'):4200"
echo ""
echo "First registered user becomes admin."
echo ""
