# STAB-002 — Non-Destructive Prisma Migration Baseline

**Execution date:** 2026-07-23  
**Status:** complete  
**Database impact on retained source:** none; status and drift queries only  
**STAB-001 clean baseline backup:** `persofi-primary-clean-20260721T163620Z.sql`
**Backup SHA-256:** `5ccc1b189cccd3d60798c2540ac11425d0ff313ffb71bef4914aab89a8622bb4`

## Decision

Track the existing migration `20260301185544_init` as the repository baseline instead of generating a new, competing baseline.

The migration file already existed locally but was hidden by `.gitignore`. Its SHA-256 is:

```text
b28502307736d76e78c25dfef72e05fd5b6a7249b58f274e350e6745e8c0d4f4
```

The retained database's `_prisma_migrations` record has the same migration name and checksum, one applied step, a completed timestamp, and no rollback timestamp. Therefore the retained database was already baselined correctly. Running `prisma migrate resolve` against it would be unnecessary metadata mutation and was intentionally avoided.

## Tracked migration files

```text
app/prisma/migrations/
├── 20260301185544_init/
│   └── migration.sql
└── migration_lock.toml
```

`.gitignore` no longer excludes `app/prisma/migrations/`. A specific exception also ensures migration SQL remains tracked despite the generic rule that ignores operational SQL backup artifacts.

## Fresh-database verification

The verification harness created a disposable MySQL 8.0.45 instance on a temporary Docker network and tmpfs volume, then ran:

```bash
npx prisma migrate deploy
npx prisma migrate status
npx prisma migrate diff \
  --from-schema-datasource prisma/schema.prisma \
  --to-schema-datamodel prisma/schema.prisma
```

Results:

- one migration was discovered;
- `20260301185544_init` applied successfully;
- Prisma reported the database schema up to date;
- Prisma reported `No difference detected`;
- the expected 12 domain/migration tables were present; and
- aggregate integrity checks completed.

The disposable database, volume, and network were removed automatically.

## Retained-data clone verification

The STAB-001 clean test-data baseline was restored into a second disposable MySQL 8.0.45 database. On that clone only:

1. the `_prisma_migrations` rows were removed to simulate a pre-Prisma retained schema;
2. aggregate domain row counts and integrity results were captured;
3. `npx prisma migrate resolve --applied 20260301185544_init` marked the baseline;
4. `npx prisma migrate deploy` reported no pending migrations;
5. `npx prisma migrate status` reported the schema up to date;
6. the live schema and Prisma datamodel had no difference; and
7. aggregate domain row counts and integrity results were captured again.

The before/after domain evidence was byte-identical:

```text
ced2181a1814bd46c20425185240442159bd6e7d3397a66d2e673adedb04311a
```

The only intentional change was adding the migration record. No domain row was inserted, updated, or deleted. The generated `clone-domain-counts.diff` was empty.

## Retained-source verification

Read-only Prisma checks against the retained source reported:

```text
1 migration found in prisma/migrations
Database schema is up to date!
No difference detected.
```

The retained source already contained the matching applied migration, so no `migrate resolve`, migration replay, reset, or seed was run.

## Repeatable verification

Run from the repository root:

```bash
scripts/verify-migrations.sh \
  backups/clean-test-data-baseline/persofi-primary-clean-20260721T163620Z.sql \
  /tmp/persofi-migration-verification-evidence
```

The script:

- validates the backup checksum;
- uses only disposable MySQL containers and tmpfs storage;
- applies migrations to an empty database;
- simulates baseline resolution on a retained-data clone;
- compares pre/post domain inventories;
- checks schema drift;
- uses random temporary database credentials; and
- removes containers, volumes, and its Docker network on exit.

It never connects to the retained source database.

## Drift-check procedure

### Database versus current Prisma datamodel

Run in an environment whose `DATABASE_URL` points to the intended database:

```bash
npx prisma migrate status
npx prisma migrate diff \
  --from-schema-datasource prisma/schema.prisma \
  --to-schema-datamodel prisma/schema.prisma
```

Expected result:

```text
Database schema is up to date!
No difference detected.
```

Any unexpected SQL or textual diff is a release blocker. Do not repair drift with `prisma db push`, `prisma migrate reset`, hand-written destructive SQL, or by editing an already-applied migration.

### Future migration policy

1. Never modify `20260301185544_init/migration.sql`; its checksum is now immutable.
2. Create a new timestamped migration for every schema change.
3. Review generated SQL before applying it.
4. Take a named backup before applying a migration to retained data.
5. Validate from-empty deployment and retained-clone upgrade in CI.
6. Run `migrate status` and database-to-datamodel drift checks after deployment.
7. If a pre-existing database lacks migration metadata but already matches the baseline, verify a clone and use:

   ```bash
   npx prisma migrate resolve --applied 20260301185544_init
   ```

   Do not run the initial migration SQL over existing tables.

## Known tooling warning

The disposable Node verification image reports that it cannot confidently detect OpenSSL and falls back to the Prisma 1.1-compatible engine. All Prisma operations completed successfully. Container-runtime dependency hardening belongs to DEVOPS-001; the warning should be eliminated there rather than changing application dependencies in STAB-002.

Prisma also warns that the `package.json#prisma` seed configuration will be removed in Prisma 7. Migrating to `prisma.config.ts` is a future tooling task and is not required for this schema baseline.

## Acceptance criteria

- [x] Migration directory and SQL are trackable.
- [x] The tracked migration checksum matches retained migration metadata.
- [x] An empty database reaches the expected schema.
- [x] A retained-data clone can be baselined without domain-data changes.
- [x] Fresh, clone, and retained-source drift checks report no difference.
- [x] The drift-check and future migration procedures are documented.
- [x] The STAB-001 clean baseline backup name and checksum are recorded.
- [x] No retained-source reset, migration replay, seed, or domain mutation occurred.
