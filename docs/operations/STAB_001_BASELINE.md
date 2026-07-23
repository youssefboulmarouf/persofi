# STAB-001 — Clean Test-Data Baseline Evidence

**Execution date:** 2026-07-21  
**Classification confirmed by owner:** development/test data; not production data  
**Source:** existing `persofi-mysql` container and Compose volume  
**Status:** complete

## Owner decision and scope

The owner authorized a clean financial start. The following reference data was retained:

- accounts;
- persons;
- stores;
- categories;
- products; and
- product variations.

The following test data was deleted atomically in foreign-key-safe order:

- transaction items;
- balances;
- transactions;
- product-variation/brand associations; and
- brands.

Prisma migration metadata was retained. No migration, schema reset, seed, API startup, or schema change occurred.

## Clean source inventory

| Table | Rows after cleanup |
|---|---:|
| Account | 4 |
| Balance | 0 |
| Brand | 0 |
| Category | 30 |
| Person | 6 |
| Product | 55 |
| ProductVariant | 4 |
| ProductVariantBrand | 0 |
| Store | 12 |
| Transaction | 0 |
| TransactionItem | 0 |
| `_prisma_migrations` | 1 |

MySQL is version 8.0.45. The schema contains 12 tables and 16 foreign-key constraints. The recorded migration is `20260301185544_init`, although its migration file is not currently tracked by the repository; STAB-002 must address that without resetting this database.

No reference-data values, names, or descriptions are included in this report.

## Backups

Two independent logical dumps of the cleaned test baseline were created:

```text
backups/stab001/persofi-primary-clean-20260721T163620Z.sql
backups/stab001/persofi-secondary-clean-20260721T163620Z.sql
```

Each has an adjacent `.sha256` checksum. The files are unencrypted and have mode `0600`; their parent directories have mode `0700`. The entire `backups/` directory and SQL/checksum extensions are ignored by Git.

These backups contain development reference data and must not be reused as the production backup design. Once real financial or personal production data exists, backups must be encrypted and stored off-host according to the future operations policy.

## Passphrase removal

The earlier backups were encrypted with a randomly generated passphrase held in a separate temporary file. The passphrase was never embedded in a backup and was never a user credential.

At the owner's request:

- both earlier encrypted `.gpg` backups were deleted;
- their checksum files were deleted;
- temporary encrypted copies were deleted;
- the generated passphrase file was deleted; and
- the backup/restore scripts now create and verify unencrypted test-baseline SQL files without a passphrase.

There is no remaining STAB-001 backup passphrase.

## Restore verification

The cleaned primary SQL backup was checksum-validated and restored into a disposable `mysql:8.0.45` container. The container published no ports, used `--network none`, stored its database on tmpfs, and was deleted after verification.

The source and restored aggregate inventories matched exactly. Integrity checks returned zero failures for all foreign-key orphan relationships, invalid transaction types, duplicate balance-effect groups, and processed/balance linkage checks. Because transaction and balance tables are intentionally empty, financial-history checks establish cleanliness rather than historical correctness.

## RPO and RTO

- **RPO (Recovery Point Objective):** the maximum acceptable amount of data loss, expressed as time. An RPO of 24 hours means losing at most the changes since the previous day's backup.
- **RTO (Recovery Time Objective):** the target time to restore usable service after an incident. An RTO of 2 hours means aiming to restore the application within two hours.

RPO and RTO are **not applicable to this disposable test baseline**. They must be selected before entering real production use, based on how much financial data loss and downtime the owner will accept.

## Temporary tooling cleanup

The STAB-001 backup, restore, and standalone inventory scripts were removed
after verification. They implemented an intentionally unencrypted test-data
workflow and must not be mistaken for the production backup and recovery
tooling planned under DEPLOY-003.

The two local checksummed baseline files remain ignored under
`backups/stab001/` because STAB-002 uses one to test retained-data baseline
resolution.

## Acceptance criteria

- [x] Schema and retained-data inventory recorded.
- [x] Two separately generated checksummed test-baseline backups exist.
- [x] One backup restored successfully into an isolated database.
- [x] Source and restored aggregate inventories match.
- [x] Foreign-key/orphan checks pass.
- [x] No reset, migration, or seed was run.
- [x] Authorized test financial history was removed.
- [x] Earlier encrypted backups and the generated passphrase were removed.
- [x] Owner data classification and cleanup direction are recorded.
