# Persofi Codex Context

Persofi is a personal finance web application for a single user on a trusted local machine. Authentication, public deployment, and production-grade security hardening are intentionally deferred until the product scope changes.

## Sources of Truth

- `docs/ROADMAP.md`: release sequence, current position, critical path, and deferred tracks.
- `docs/EXECUTION_PLAN.md`: implementation phases, dependencies, and acceptance criteria.
- `docs/tasks/TASKS_RELEASE_1.md`: executable Release 1 backlog. Complete it in dependency order and tick tasks only after their acceptance criteria pass.
- `docs/FUTURE_ENHANCEMENTS.md`: product priorities, decision rules, and future work.
- `docs/OPERATIONS.md`: environment, runtime, migration, backup, and safety procedures.

If this file conflicts with those documents, follow the documents and update this file.

## Current Direction

- M0 repository stabilization is complete; do not recreate it as backlog work.
- Release 1 is active: R1A financial guardrails, followed by R1B manual entry rescue.
- Release 2 adds human-reviewed receipt extraction after the manual workflow and atomic posting path are trustworthy.
- Optimize only measured bottlenecks. Keep authentication, households, local OCR, remote operations, and advanced audit/reversal work in their triggered future tracks.

## Repository Layout

- `app/`: Express, TypeScript, Prisma, and MySQL backend. Entity modules live in `app/src/`; integration tests live in `app/tests/`.
- `client/`: Create React App, TypeScript, MUI, TanStack React Query, axios, and ApexCharts frontend. The existing dashboard folder is misspelled `dashborad`; preserve that path unless intentionally migrating it.
- `scripts/`: repository test and migration verification scripts.
- `docker-compose.dev.yml`: local development stack.
- `docker-compose.yml`: production-like local stack.
- `compose.test.yaml`: disposable backend test stack.

## Required Checks

- Backend harness from the repository root: `scripts/run-backend-tests.sh`.
- In both `app/` and `client/`: `npm run lint`, `npm run typecheck`, `npm run format:check`, and `npm run build`.
- Run focused checks while developing and all relevant gates before marking a task complete. Existing lint warnings are tolerated; new errors are not.
- Start the local app with `docker compose --file docker-compose.dev.yml up --build`.

## Financial Invariants

- Financial writes must be atomic. Transaction data, items, balance effects, and the processed state commit or roll back together.
- Save & Process must be idempotent and must never apply balance effects twice.
- Processed transactions are immutable through every endpoint.
- Use decimal-safe arithmetic. Release 1 assumes one shared currency/unit across accounts; multi-currency support and conversion are future work. Do not use floating-point equality for money.
- Transaction totals are independent of item rows. Itemization is optional; do not create a synthetic summary item.
- Itemization status is derived unless persistence is proven necessary.
- Use the shared Prisma client from `app/src/utilities/prisma.ts`; services must not instantiate their own client.

## Receipt Rules

- Receipt extraction is Release 2 work and produces untrusted, editable draft data only.
- Runtime-validate extraction against a strict schema and require human confirmation before creating or processing a transaction.
- Extraction must not invent entity IDs. Learn aliases only from confirmed mappings.
- Keep provider credentials on the backend and behind a provider-independent interface.

## Data Safety

- Never edit an applied migration. Add and review a new timestamped migration.
- Never use `prisma migrate reset`, `prisma db push`, destructive SQL, or delete the MySQL volume against retained data without explicit user intent and a verified backup.
- Back up through Settings -> Export before schema migrations or restores.
- Never commit `.env` files, backups, database dumps, receipt images, or provider secrets.
- Preserve unrelated user changes in a dirty worktree.

## Environment

- Backend: `DATABASE_URL` is required in production; `NODE_ENV` and `PORT` are supported (`PORT` defaults to 5000).
- Frontend: `REACT_APP_API_BASE_URL` is public and embedded at build time.
- Templates: `app/.env.example` and `client/.env.example`.
