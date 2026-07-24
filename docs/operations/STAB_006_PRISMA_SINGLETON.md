# STAB-006 — Reuse One Prisma Client Per API Process

## Purpose

Every `BaseService` subclass previously constructed its own `PrismaClient` in
its constructor (`this.prisma = new PrismaClient()`). Because several services
are also composed internally by other services — `TransactionService`
constructs its own `AccountService`, `TransactionItemService`, and
`TransactionProcessorService`; `TransactionProcessorService` constructs its own
`BalanceService` — a single incoming request could open connection pools far
beyond the twelve resource-level service instances created at process startup.
This wastes MySQL connections and complicates graceful shutdown.

## Change

- Added `app/src/utilities/prisma.ts`, exporting one process-wide `prisma`
  singleton and a `disconnectPrisma()` helper.
- `app/src/utilities/BaseService.ts` now assigns the shared singleton instead
  of constructing a new client. No subclass required changes.
- `app/src/index.ts` disconnects the shared client on `SIGTERM`/`SIGINT` after
  the HTTP server stops accepting new connections, so the process no longer
  leaves an open database connection behind on shutdown.

Test files that directly manipulate the database for setup/cleanup
(`app/tests/*.integration.test.ts`) keep their own locally scoped
`PrismaClient` instances; each is disconnected in that file's `afterAll` and
is unrelated to the application's shared client. This is intentional: Jest
gives every test file its own module registry, so a test file importing the
shared singleton would not observe cross-file connection reuse the way the
running Express process does.

## Verification evidence

Verified on 2026-07-24 using the disposable MySQL harness from
[`STAB-003`](STAB_003_TEST_HARNESS.md) (`scripts/run-backend-tests.sh`):

- all 6 Jest suites and all 92 tests passed, including the new
  `tests/PrismaSingleton.test.ts`, which asserts:
  - the shared client exposes the expected Prisma runtime API
    (`$connect`/`$disconnect`/`$transaction`);
  - two independently constructed top-level services (`AccountService`,
    `BalanceService`) reference the identical `prisma` singleton; and
  - a service that composes other services internally (`TransactionService`,
    which itself constructs `AccountService`, `TransactionItemService`, and
    `TransactionProcessorService`) has every composed instance reference the
    same singleton — confirming a single connection pool for the whole
    request graph rather than one per constructed service; and
  - `disconnectPrisma()` resolves without throwing.

## Acceptance criteria

- [x] Services share one client.
- [x] Shutdown disconnects the client (`SIGTERM`/`SIGINT` handlers in
      `app/src/index.ts`).
- [x] Tests do not leak handles — the harness process exits cleanly (exit
      code 0) after every suite runs, and the shared production client is
      disconnected on process shutdown rather than left open.
