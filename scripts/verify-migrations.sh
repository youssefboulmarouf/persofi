#!/usr/bin/env bash
set -Eeuo pipefail

# Prisma migration baseline verification:
# 1. Apply tracked migrations to an empty disposable MySQL database.
# 2. Restore the clean test-data backup into another disposable database,
#    remove migration metadata on that clone, and baseline it with migrate resolve.
# 3. Confirm schema drift is empty and retained row counts do not change.
#
# Usage:
#   scripts/verify-migrations.sh CLEAN_BASELINE_SQL EVIDENCE_DIR

if [[ $# -ne 2 ]]; then
  echo "Usage: $0 CLEAN_BASELINE_SQL EVIDENCE_DIR" >&2
  exit 64
fi

backup_path="$(cd "$(dirname "$1")" && pwd)/$(basename "$1")"
evidence_dir="$2"
repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
app_dir="$repo_root/app"
migration_name="20260301185544_init"
network_name="persofi-migration-verification-network"
fresh_container="persofi-migration-verification-fresh"
clone_container="persofi-migration-verification-clone"
node_image="node:20-bookworm-slim"
mysql_image="mysql:8.0.45"

for command_name in docker openssl sha256sum diff; do
  command -v "$command_name" >/dev/null || {
    echo "Required command not found: $command_name" >&2
    exit 69
  }
done

[[ -f "$backup_path" ]] || { echo "Baseline backup not found: $backup_path" >&2; exit 66; }
[[ -f "$backup_path.sha256" ]] || { echo "Checksum not found: $backup_path.sha256" >&2; exit 66; }

umask 077
mkdir -p "$evidence_dir"
evidence_dir="$(cd "$evidence_dir" && pwd)"

backup_dir="$(dirname "$backup_path")"
backup_name="$(basename "$backup_path")"
(cd "$backup_dir" && sha256sum --check "$backup_name.sha256")

db_password="$(openssl rand -hex 32)"

cleanup() {
  docker rm --force --volumes "$fresh_container" >/dev/null 2>&1 || true
  docker rm --force --volumes "$clone_container" >/dev/null 2>&1 || true
  docker network rm "$network_name" >/dev/null 2>&1 || true
}
trap cleanup EXIT
cleanup

docker network create "$network_name" >/dev/null

start_mysql() {
  local container_name="$1"
  docker run --detach --name "$container_name" \
    --network "$network_name" \
    --tmpfs /var/lib/mysql:rw,noexec,nosuid,size=1g \
    --env MYSQL_ROOT_PASSWORD="$db_password" \
    --env MYSQL_DATABASE=persofi \
    "$mysql_image" >/dev/null

  for attempt in $(seq 1 60); do
    if docker logs "$container_name" 2>&1 \
      | grep -Fq 'MySQL init process done. Ready for start up.' \
      && docker exec "$container_name" sh -c \
      'mysql --user=root --password="$MYSQL_ROOT_PASSWORD" --silent --skip-column-names --execute="SELECT 1"' \
      >/dev/null 2>&1; then
      return
    fi
    if [[ "$attempt" == 60 ]]; then
      echo "Disposable MySQL did not become ready: $container_name" >&2
      exit 70
    fi
    sleep 1
  done
}

run_prisma() {
  local database_host="$1"
  shift
  docker run --rm \
    --network "$network_name" \
    --volume "$app_dir:/app" \
    --workdir /app \
    --env "DATABASE_URL=mysql://root:${db_password}@${database_host}:3306/persofi" \
    "$node_image" npx prisma "$@"
}

assert_no_drift() {
  local database_host="$1"
  local output_path="$2"
  local diff_status
  set +e
  run_prisma "$database_host" migrate diff \
    --from-schema-datasource prisma/schema.prisma \
    --to-schema-datamodel prisma/schema.prisma > "$output_path"
  diff_status=$?
  set -e
  if ! grep -Fxq 'No difference detected.' "$output_path"; then
    echo "Schema drift check failed for $database_host (exit $diff_status). See $output_path" >&2
    exit 1
  fi
  if [[ "$diff_status" -ne 0 ]]; then
    echo "Prisma returned exit $diff_status after reporting an empty diff; accepted by output assertion." \
      >> "$output_path"
  fi
}

capture_inventory() {
  local container_name="$1"
  local output_path="$2"
  local error_path="${output_path}.stderr"
  if ! docker exec --interactive "$container_name" sh -c \
    'mysql --user=root --password="$MYSQL_ROOT_PASSWORD" --batch --skip-column-names persofi' \
    > "$output_path" 2> "$error_path" <<'SQL'
SELECT 'Account' AS object_name, COUNT(*) AS row_count FROM Account
UNION ALL SELECT 'Balance', COUNT(*) FROM Balance
UNION ALL SELECT 'Brand', COUNT(*) FROM Brand
UNION ALL SELECT 'Category', COUNT(*) FROM Category
UNION ALL SELECT 'Person', COUNT(*) FROM Person
UNION ALL SELECT 'Product', COUNT(*) FROM Product
UNION ALL SELECT 'ProductVariant', COUNT(*) FROM ProductVariant
UNION ALL SELECT 'ProductVariantBrand', COUNT(*) FROM ProductVariantBrand
UNION ALL SELECT 'Store', COUNT(*) FROM Store
UNION ALL SELECT 'Transaction', COUNT(*) FROM Transaction
UNION ALL SELECT 'TransactionItem', COUNT(*) FROM TransactionItem
UNION ALL SELECT '_prisma_migrations', COUNT(*) FROM _prisma_migrations
ORDER BY object_name;

SELECT 'orphan_balance_account' AS check_name, COUNT(*) AS failures FROM Balance b LEFT JOIN Account a ON a.id=b.accountId WHERE a.id IS NULL
UNION ALL SELECT 'orphan_balance_transaction', COUNT(*) FROM Balance b LEFT JOIN Transaction t ON t.id=b.transactionId WHERE t.id IS NULL
UNION ALL SELECT 'orphan_category_parent', COUNT(*) FROM Category c LEFT JOIN Category p ON p.id=c.parentCategoryId WHERE c.parentCategoryId IS NOT NULL AND p.id IS NULL
UNION ALL SELECT 'orphan_product_category', COUNT(*) FROM Product p LEFT JOIN Category c ON c.id=p.categoryId WHERE c.id IS NULL
UNION ALL SELECT 'orphan_variant_product', COUNT(*) FROM ProductVariant v LEFT JOIN Product p ON p.id=v.productId WHERE p.id IS NULL
UNION ALL SELECT 'orphan_pvb_variant', COUNT(*) FROM ProductVariantBrand x LEFT JOIN ProductVariant v ON v.id=x.variantId WHERE v.id IS NULL
UNION ALL SELECT 'orphan_pvb_brand', COUNT(*) FROM ProductVariantBrand x LEFT JOIN Brand b ON b.id=x.brandId WHERE b.id IS NULL
UNION ALL SELECT 'orphan_tx_pay_account', COUNT(*) FROM Transaction t LEFT JOIN Account a ON a.id=t.payAccountId WHERE t.payAccountId IS NOT NULL AND a.id IS NULL
UNION ALL SELECT 'orphan_tx_counterparty', COUNT(*) FROM Transaction t LEFT JOIN Account a ON a.id=t.counterpartyAccountId WHERE t.counterpartyAccountId IS NOT NULL AND a.id IS NULL
UNION ALL SELECT 'orphan_tx_store', COUNT(*) FROM Transaction t LEFT JOIN Store s ON s.id=t.storeId WHERE t.storeId IS NOT NULL AND s.id IS NULL
UNION ALL SELECT 'orphan_tx_person', COUNT(*) FROM Transaction t LEFT JOIN Person p ON p.id=t.personId WHERE t.personId IS NOT NULL AND p.id IS NULL
UNION ALL SELECT 'orphan_tx_refund', COUNT(*) FROM Transaction t LEFT JOIN Transaction o ON o.id=t.refundOfId WHERE t.refundOfId IS NOT NULL AND o.id IS NULL
UNION ALL SELECT 'orphan_item_transaction', COUNT(*) FROM TransactionItem i LEFT JOIN Transaction t ON t.id=i.transactionId WHERE t.id IS NULL
UNION ALL SELECT 'orphan_item_variant', COUNT(*) FROM TransactionItem i LEFT JOIN ProductVariant v ON v.id=i.variantId WHERE i.variantId IS NOT NULL AND v.id IS NULL
UNION ALL SELECT 'orphan_item_category', COUNT(*) FROM TransactionItem i LEFT JOIN Category c ON c.id=i.categoryId WHERE i.categoryId IS NOT NULL AND c.id IS NULL
UNION ALL SELECT 'orphan_item_brand', COUNT(*) FROM TransactionItem i LEFT JOIN Brand b ON b.id=i.brandId WHERE i.brandId IS NOT NULL AND b.id IS NULL
UNION ALL SELECT 'processed_without_balance', COUNT(*) FROM Transaction t WHERE t.processed=1 AND NOT EXISTS (SELECT 1 FROM Balance b WHERE b.transactionId=t.id)
UNION ALL SELECT 'unprocessed_with_balance', COUNT(DISTINCT t.id) FROM Transaction t JOIN Balance b ON b.transactionId=t.id WHERE t.processed=0
UNION ALL SELECT 'duplicate_balance_tx_account_groups', COUNT(*) FROM (SELECT transactionId,accountId FROM Balance GROUP BY transactionId,accountId HAVING COUNT(*)>1) duplicate_groups
UNION ALL SELECT 'invalid_transaction_type', COUNT(*) FROM Transaction WHERE type NOT IN ('Expense','Income','Credit_Payment','Refund','Transfer','Init_Balance')
ORDER BY check_name;
SQL
  then
    echo "Inventory capture failed for $container_name:" >&2
    sed -n '1,80p' "$error_path" >&2
    exit 1
  fi
  chmod 600 "$output_path" "$error_path"
  return 0
}

# Case 1: migrations must create the expected schema from an empty database.
echo "Verifying migration deployment on an empty database..."
start_mysql "$fresh_container"
run_prisma "$fresh_container" migrate deploy \
  > "$evidence_dir/fresh-migrate-deploy.txt"
run_prisma "$fresh_container" migrate status \
  > "$evidence_dir/fresh-migrate-status.txt"
assert_no_drift "$fresh_container" "$evidence_dir/fresh-drift.txt"
capture_inventory "$fresh_container" "$evidence_dir/fresh-inventory.tsv"
echo "Fresh database inventory captured."
# Run the two cases sequentially to keep the verification footprint small.
docker rm --force --volumes "$fresh_container" >/dev/null

# Case 2: a retained-data database with no migration metadata is resolved,
# not reset or replayed. Counts before and after must remain byte-identical.
echo "Verifying baseline resolution on a retained-data clone..."
start_mysql "$clone_container"
docker exec --interactive "$clone_container" sh -c \
  'mysql --user=root --password="$MYSQL_ROOT_PASSWORD"' < "$backup_path"
docker exec "$clone_container" sh -c \
  'mysql --user=root --password="$MYSQL_ROOT_PASSWORD" persofi --execute="DELETE FROM _prisma_migrations;"'
capture_inventory "$clone_container" "$evidence_dir/clone-before-resolve.tsv"

run_prisma "$clone_container" migrate resolve --applied "$migration_name" \
  > "$evidence_dir/clone-resolve.txt"
run_prisma "$clone_container" migrate deploy \
  > "$evidence_dir/clone-migrate-deploy.txt"
run_prisma "$clone_container" migrate status \
  > "$evidence_dir/clone-migrate-status.txt"
assert_no_drift "$clone_container" "$evidence_dir/clone-drift.txt"
capture_inventory "$clone_container" "$evidence_dir/clone-after-resolve.tsv"

# The migration table legitimately changes from 0 to 1. Compare all domain-table
# counts and all integrity checks while excluding only that metadata row.
grep -v '^_prisma_migrations	' "$evidence_dir/clone-before-resolve.tsv" \
  > "$evidence_dir/clone-before-domain.tsv"
grep -v '^_prisma_migrations	' "$evidence_dir/clone-after-resolve.tsv" \
  > "$evidence_dir/clone-after-domain.tsv"
diff -u "$evidence_dir/clone-before-domain.tsv" "$evidence_dir/clone-after-domain.tsv" \
  > "$evidence_dir/clone-domain-counts.diff"

sha256sum \
  "$evidence_dir/fresh-inventory.tsv" \
  "$evidence_dir/clone-before-domain.tsv" \
  "$evidence_dir/clone-after-domain.tsv" \
  > "$evidence_dir/evidence.sha256"
chmod 600 "$evidence_dir"/*

echo "Prisma migration baseline verification passed."
echo "Evidence: $evidence_dir"
