#!/usr/bin/env bash
set -Eeuo pipefail

# Runs backend tests against a new, disposable MySQL database.
# The Compose project and its tmpfs-backed database are removed on every exit.

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
compose_file="$repo_root/compose.test.yaml"
project_name="persofi-tests-$$"

for command_name in docker openssl; do
  command -v "$command_name" >/dev/null || {
    echo "Required command not found: $command_name" >&2
    exit 69
  }
done

docker compose version >/dev/null

export PERSOFI_TEST_DATABASE_PASSWORD
export PERSOFI_TEST_ROOT_PASSWORD
PERSOFI_TEST_DATABASE_PASSWORD="$(openssl rand -hex 24)"
PERSOFI_TEST_ROOT_PASSWORD="$(openssl rand -hex 24)"

cleanup() {
  docker compose \
    --project-name "$project_name" \
    --file "$compose_file" \
    down --volumes --remove-orphans >/dev/null 2>&1 || true
}
trap cleanup EXIT INT TERM

# Remove leftovers from a prior interrupted run with the same process ID,
# then start only this uniquely named, isolated test project.
cleanup

docker compose \
  --project-name "$project_name" \
  --file "$compose_file" \
  up --build --abort-on-container-exit --exit-code-from tests
