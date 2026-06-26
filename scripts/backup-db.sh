#!/usr/bin/env bash
# Database backup — PostgreSQL pg_dump with retention
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-./backups/db}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
FILENAME="ssd_db_${TIMESTAMP}.sql.gz"

if [ -z "${DATABASE_URL:-}" ]; then
  echo "ERROR: DATABASE_URL not set"
  exit 1
fi

mkdir -p "$BACKUP_DIR"

echo "Starting backup: $FILENAME"
pg_dump "$DATABASE_URL" | gzip > "$BACKUP_DIR/$FILENAME"
echo "Backup saved: $BACKUP_DIR/$FILENAME"

# Retention
find "$BACKUP_DIR" -name "ssd_db_*.sql.gz" -mtime +"$RETENTION_DAYS" -delete
echo "Cleaned backups older than $RETENTION_DAYS days"
