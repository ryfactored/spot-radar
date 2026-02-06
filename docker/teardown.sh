#!/bin/bash
# Teardown script for Supabase Lite on NAS
# Usage: sudo ./teardown.sh [--all]
#
# Options:
#   --all    Also remove database data (full reset)

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

REMOVE_DATA=false
if [ "$1" == "--all" ]; then
    REMOVE_DATA=true
fi

echo ""
echo "=== Supabase Lite Teardown ==="
echo ""

# Stop and remove containers, networks, volumes
echo "[1/3] Stopping and removing containers..."
docker-compose down -v 2>/dev/null || true

# Remove any orphaned containers
echo "[2/3] Removing orphaned containers..."
docker rm -f supabase-db supabase-auth supabase-rest supabase-kong angular-app 2>/dev/null || true

# Optionally remove database data
if [ "$REMOVE_DATA" == true ]; then
    echo "[3/3] Removing database data..."
    rm -rf volumes/db/data
    echo ""
    echo "=== Full Teardown Complete ==="
    echo "All containers and data removed."
else
    echo "[3/3] Keeping database data (use --all to remove)"
    echo ""
    echo "=== Teardown Complete ==="
    echo "Containers removed. Database data preserved at volumes/db/data"
fi

echo ""
echo "To redeploy, run: sudo ./start.sh"
echo "To redeploy fresh: sudo ./start.sh --fresh"
echo ""
