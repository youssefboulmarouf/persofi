# Persofi Local Operations

This is the living operations guide for the local, single-user Persofi application. It consolidates the useful instructions from the completed STAB-001 through STAB-006 records. Detailed historical evidence remains available in Git history.

## Prerequisites

- Docker with Docker Compose v2.
- Node.js and npm when running services outside Docker.
- MySQL 8 when not using the provided Compose configuration.

## Environment Variables

Never commit local .env files. The repository includes safe templates:

    cp app/.env.example app/.env
    cp client/.env.example client/.env

### Backend

| Variable | Required | Default | Purpose |
|---|---|---|---|
| DATABASE_URL | Required in production | None | Prisma MySQL connection string |
| NODE_ENV | Expected | Non-production behavior when unset | Selects production, development, or test behavior |
| PORT | Optional | 5000 | Express listen port |

When NODE_ENV is production, startup validation rejects a missing or blank DATABASE_URL and reports only the missing variable name.

### Frontend

| Variable | Required | Default | Purpose |
|---|---|---|---|
| REACT_APP_API_BASE_URL | Required for usable API calls | None | API base URL compiled into the frontend bundle |

REACT_APP_API_BASE_URL is public configuration, not a secret. Changing it requires rebuilding the frontend.

### Disposable Test Harness

The test runner generates temporary values for:

- PERSOFI_TEST_DATABASE_PASSWORD
- PERSOFI_TEST_ROOT_PASSWORD

PERSOFI_TEST_COMMAND is an optional test-only override used to verify failure cleanup. Do not set it during normal test runs.

### Current Local Compose Caveat

The development and production Compose files currently use the MySQL root account with an empty password. This is accepted for the trusted local-only scope, but it must be replaced with least-privilege credentials before remote or public deployment.

Provider credentials added for receipt extraction must be backend-only environment variables. They must never use the REACT_APP prefix or be embedded in the frontend bundle.

## Running the Application

Development Compose:

    docker compose --file docker-compose.dev.yml up --build

Production-like local Compose:

    docker compose up --build

Stop the corresponding project with:

    docker compose --file docker-compose.dev.yml down

or:

    docker compose down

Do not remove the MySQL volume unless intentionally discarding local data and a verified backup exists.

## Backend Integration Tests

From the repository root:

    scripts/run-backend-tests.sh

This is the authoritative backend integration-test command. Each run:

- creates a uniquely named disposable Compose project;
- starts a fresh MySQL database on tmpfs;
- generates temporary database credentials;
- exposes no database or API ports;
- applies tracked Prisma migrations;
- loads generated seed data;
- runs Jest serially; and
- removes containers, networks, and volumes on exit.

The runner does not use personal data, retained backups, or local .env credentials.

To verify cleanup after a forced failure:

    PERSOFI_TEST_COMMAND='exit 23' scripts/run-backend-tests.sh

The command should return 23 and leave no Compose project whose name starts with persofi-tests-.

## Quality Commands

Backend:

    cd app
    npm run lint
    npm run typecheck
    npm run format:check
    npm run build

Frontend:

    cd client
    npm run lint
    npm run typecheck
    npm run format:check
    npm run build

Lint currently treats existing warnings as warnings and fails on errors. Create React App may treat warnings as errors when CI=true; use the explicit lint and typecheck commands as the current quality gates until warnings are reduced or the frontend build system changes.

## Database Migrations

The tracked baseline migration is:

    app/prisma/migrations/20260301185544_init/migration.sql

Never edit an applied migration. Create a new timestamped migration for every schema change and review generated SQL before applying it.

For normal development migration creation:

    cd app
    npm run init-db

Before applying a migration to retained data:

1. Create a named backup.
2. Verify the backup is readable.
3. Review the generated SQL for destructive changes.
4. Test from-empty migration.
5. Test retained-data upgrade against a disposable clone.
6. Apply the migration.
7. Verify migration status and schema drift.
8. Exercise backup restore when the backup schema changes.

Run the repository migration verification from the project root:

    scripts/verify-migrations.sh backups/clean-test-data-baseline/persofi-primary-clean-20260721T163620Z.sql /tmp/persofi-migration-verification-evidence

The baseline backup is local and ignored by Git. If it is no longer present, provide another verified retained-data backup as the first argument.

Useful Prisma checks from app/ with DATABASE_URL set to the intended database:

    npx prisma migrate status
    npx prisma migrate diff --from-schema-datasource prisma/schema.prisma --to-schema-datamodel prisma/schema.prisma

Expected drift result:

    Database schema is up to date!
    No difference detected.

Do not repair retained-data drift with prisma migrate reset, prisma db push, destructive ad hoc SQL, or edits to an applied migration. If a pre-existing database already matches the baseline but lacks migration metadata, verify a clone before using prisma migrate resolve.

## Backup and Restore

Persofi provides JSON export and restore through Settings. Restore replaces all current application data, so:

- export a fresh backup before a schema migration or restore;
- keep at least one previous known-good backup;
- verify that the backup file is non-empty and valid JSON;
- test restore after adding or changing backed-up tables;
- never commit backups or receipt images;
- store real financial backups outside the repository.

The historical clean-baseline SQL backups contain development/reference data, are unencrypted, and are not a production backup strategy.

When receipt imports are added, backups must include receipt metadata and aliases. Receipt images should remain separate and should be deleted after confirmation by default.

## Prisma Lifecycle

The API uses one shared PrismaClient per process through app/src/utilities/prisma.ts. BaseService instances reuse this client, and the API disconnects it during SIGTERM and SIGINT shutdown.

Do not construct a new PrismaClient in application services. Test files may own a test-scoped client when they disconnect it in afterAll.

## Completed Stabilization Summary

The following foundation is complete and should be preserved:

- Clean development baseline and isolated restore verification.
- Tracked non-destructive Prisma migration baseline.
- Disposable MySQL integration-test harness.
- Backend and frontend lint, type, format, and build commands.
- Environment templates and production DATABASE_URL validation.
- Shared Prisma client with graceful shutdown.

The original per-item evidence documents were removed during documentation cleanup. Use Git history when the exact execution evidence, checksums, historical warning counts, or dated acceptance checklists are needed.

## Safety Rules

- Do not run prisma migrate reset against retained data.
- Do not delete a Docker volume without a verified backup and explicit intent.
- Do not commit .env files, receipt images, database dumps, or provider keys.
- Keep AI provider keys on the backend.
- Keep financial writes atomic.
- Validate receipt file type and size before extraction.
- Require human confirmation before receipt data becomes a financial transaction.
