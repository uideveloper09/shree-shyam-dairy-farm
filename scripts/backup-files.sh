#!/usr/bin/env bash
# Backup local storage / uploaded files
set -euo pipefail

STORAGE_DIR="${STORAGE_DIR:-./storage}"
BACKUP_DIR="${BACKUP_DIR:-./backups/files}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
ARCHIVE="$BACKUP_DIR/ssd_files_${TIMESTAMP}.tar.gz"

mkdir -p "$BACKUP_DIR"

if [ ! -d "$STORAGE_DIR" ]; then
  echo "No local storage directory — skipping"
  exit 0
fi

tar -czf "$ARCHIVE" -C "$(dirname "$STORAGE_DIR")" "$(basename "$STORAGE_DIR")"
echo "File backup: $ARCHIVE"

find "$BACKUP_DIR" -name "ssd_files_*.tar.gz" -mtime +"$RETENTION_DAYS" -delete
