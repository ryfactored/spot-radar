#!/bin/bash
set -e

# Set passwords for the roles (POSTGRES_PASSWORD is available from environment)
# The SQL init script (01-init.sql) already ran and created the roles
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    ALTER ROLE authenticator WITH LOGIN PASSWORD '$POSTGRES_PASSWORD';
    ALTER ROLE supabase_auth_admin WITH LOGIN PASSWORD '$POSTGRES_PASSWORD';
EOSQL

echo "Database role passwords set successfully."
