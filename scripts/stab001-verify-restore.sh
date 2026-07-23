#!/usr/bin/env bash
set -Eeuo pipefail

# STAB-001: restore an unencrypted test-data dump into an isolated MySQL container.
# The source Persofi database is never addressed by this script.
# Usage: scripts/stab001-verify-restore.sh BACKUP EVIDENCE_DIR

if [[ $# -ne 2 ]]; then
  echo "Usage: $0 BACKUP EVIDENCE_DIR" >&2
  exit 64
fi

backup_path="$1"
evidence_dir="$2"
container_name="persofi-stab001-restore"

for command_name in docker sha256sum openssl; do
  command -v "$command_name" >/dev/null || {
    echo "Required command not found: $command_name" >&2
    exit 69
  }
done

[[ -f "$backup_path" ]] || { echo "Backup not found." >&2; exit 66; }
[[ -f "$backup_path.sha256" ]] || { echo "Checksum not found." >&2; exit 66; }

umask 077
mkdir -p "$evidence_dir"
backup_dir="$(cd "$(dirname "$backup_path")" && pwd)"
backup_name="$(basename "$backup_path")"
(cd "$backup_dir" && sha256sum --check "$backup_name.sha256")

restore_password="$(openssl rand -hex 32)"
cleanup() {
  docker rm --force --volumes "$container_name" >/dev/null 2>&1 || true
}
trap cleanup EXIT
cleanup

docker run --detach --name "$container_name" \
  --network none \
  --tmpfs /var/lib/mysql:rw,noexec,nosuid,size=1g \
  --env MYSQL_ROOT_PASSWORD="$restore_password" \
  mysql:8.0.45 >/dev/null

for attempt in $(seq 1 60); do
  if docker exec "$container_name" mysqladmin ping --silent --user=root --password="$restore_password" >/dev/null 2>&1; then
    break
  fi
  if [[ "$attempt" == 60 ]]; then
    echo "Isolated MySQL did not become ready." >&2
    exit 70
  fi
  sleep 1
done

docker exec --interactive "$container_name" mysql --user=root --password="$restore_password" < "$backup_path"

docker exec --interactive "$container_name" mysql \
  --user=root --password="$restore_password" --batch --skip-column-names persofi \
  < scripts/stab001-inventory.sql > "$evidence_dir/restored-inventory.tsv"

chmod 600 "$evidence_dir/restored-inventory.tsv"
echo "$evidence_dir/restored-inventory.tsv"
