# STAB-003 — Reproducible MySQL Integration-Test Harness

## Purpose

The backend test suite now runs against a newly created MySQL database instead
of relying on a manually running database at `localhost:3306`. The harness
builds the backend test image, applies tracked Prisma migrations, loads only the
repository's generated seed data, runs Jest, and removes every test container
and database resource on exit.

The retained Persofi database and regular development/production Compose
projects are never addressed.

## Run all backend tests

From the repository root:

```bash
scripts/run-backend-tests.sh
```

This is the authoritative backend test command for local development.

## Isolation model

Each invocation:

- receives a unique Docker Compose project name;
- creates a new MySQL 8.0.45 container;
- stores MySQL data on container-local tmpfs, not a named or host volume;
- generates random temporary application and root database passwords;
- exposes no database or application ports to the host;
- applies `prisma migrate deploy` from the tracked migration history;
- executes the compiled TypeScript seed using generated reference data;
- runs Jest serially through `npm test`; and
- executes `docker compose down --volumes --remove-orphans` from an exit trap.

The test image excludes `.env` and `.env.*` files. `DATABASE_URL` is injected
only into the disposable test container. No personal data, retained backup, or
real credential is used.

## Failure-cleanup self-test

The command executed in the test container can be overridden solely to verify
the runner's failure cleanup:

```bash
PERSOFI_TEST_COMMAND='exit 23' scripts/run-backend-tests.sh
```

Expected behavior:

1. the command returns a nonzero status;
2. the exit trap removes the test container and database;
3. `docker compose ls` shows no project whose name starts with
   `persofi-tests-`; and
4. a subsequent normal test run starts with an empty database.

Do not set `PERSOFI_TEST_COMMAND` for normal test execution.

## Commands executed inside the test container

```bash
npx prisma migrate deploy
node dist/prisma/seed.js
npm test
```

`npm test` no longer runs `prisma migrate reset`, reads `.env.test`, or mutates
any database itself. Database lifecycle belongs exclusively to the disposable
Compose harness.

## Troubleshooting

- Docker and Docker Compose v2 are required.
- If image construction fails, run `docker compose --file compose.test.yaml
  build tests` to inspect the build error. The required password variables may
  be set to arbitrary test-only values for configuration inspection.
- If MySQL readiness fails, inspect the test project logs before the runner
  exits by temporarily running the equivalent Compose command manually.
- Never point `DATABASE_URL` in the test Compose file at a retained database.

## Acceptance criteria

- [x] One documented command runs all backend tests.
- [x] Every invocation creates an empty database and applies tracked migrations.
- [x] Only generated repository seed data is loaded.
- [x] No host port or retained database is used.
- [x] Temporary credentials are generated for each run.
- [x] Cleanup is registered for success, failure, interruption, and termination.
- [x] Existing Jest suites pass in the containerized harness.
- [x] The forced-failure cleanup self-test is verified.

## Verification evidence

Verified on 2026-07-23:

- all 5 Jest suites and all 88 tests passed after migration and generated seed;
- a forced test-process exit with status 23 propagated to the caller; and
- the forced-failure exit removed the test containers, network, and database
  resources.
