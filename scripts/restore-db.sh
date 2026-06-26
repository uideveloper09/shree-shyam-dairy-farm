#!/usr/bin/env bash
# Restore database from gzipped pg_dump
set -euo pipefail

FILE="${1:-}"
if [ -z "$FILE" ] || [ ! -f "$FILE" ]; then
  echo "Usage: ./scripts/restore-db.sh backups/db/ssd_db_YYYYMMDD_HHMMSS.sql.gz"
  exit 1
fi

if [ -z "${DATABASE_URL:-}" ]; then
  echo "ERROR: DATABASE_URL not set"
  exit 1
fi

echo "WARNING: This will overwrite the target database."
read -r -p "Type RESTORE to continue: " confirm
if [ "$confirm" != "RESTORE" ]; then
  echo "Aborted."
  exit 1
fi

gunzip -c "$FILE" | psql "$DATABASE_URL"
echo "Restore complete."
