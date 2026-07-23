#!/usr/bin/env bash
set -Eeuo pipefail

# STAB-001 test-data baseline: create an unencrypted logical MySQL backup.
# This mode is only appropriate while the database contains no production data.
# Usage: scripts/stab001-create-backup.sh LABEL OUTPUT_DIR

if [[ $# -ne 2 ]]; then
  echo "Usage: $0 LABEL OUTPUT_DIR" >&2
  exit 64
fi

label="$1"
output_dir="$2"

if [[ ! "$label" =~ ^[a-zA-Z0-9_-]+$ ]]; then
  echo "Backup label may contain only letters, numbers, underscore, and hyphen." >&2
  exit 64
fi

for command_name in docker sha256sum; do
  command -v "$command_name" >/dev/null || {
    echo "Required command not found: $command_name" >&2
    exit 69
  }
done

umask 077
mkdir -p "$output_dir"
timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
backup_path="$output_dir/persofi-${label}-${timestamp}.sql"
checksum_path="$backup_path.sha256"

docker compose exec -T mysql mysqldump \
  --user=root \
  --single-transaction \
  --quick \
  --routines \
  --triggers \
  --events \
  --hex-blob \
  --set-gtid-purged=OFF \
  --no-tablespaces \
  --databases persofi > "$backup_path"

test -s "$backup_path"
(cd "$output_dir" && sha256sum "$(basename "$backup_path")") > "$checksum_path"
chmod 600 "$backup_path" "$checksum_path"

echo "$backup_path"
