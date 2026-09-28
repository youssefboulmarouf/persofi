# Persofi — Claude Context

Personal finance web app. **Scope: single-user, local-first, trusted local machine.** No auth, no public deployment — these are deliberately deferred (see Scope guardrails).

## Authoritative docs

- [docs/ROADMAP.md](docs/ROADMAP.md) — release sequence, current position, critical path.
- [docs/EXECUTION_PLAN.md](docs/EXECUTION_PLAN.md) — numbered steps (1–23) with acceptance criteria. Read the relevant step before starting work.
- [docs/FUTURE_ENHANCEMENTS.md](docs/FUTURE_ENHANCEMENTS.md) — product priorities, decision rules, deferred work.
- [docs/OPERATIONS.md](docs/OPERATIONS.md) — env vars, commands, migrations, backups, safety rules.

If this file and the docs disagree, the docs win; update this file.

## Stack & layout

- `app/` — backend: Express + TypeScript + Prisma (MySQL 8). One folder per entity under `app/src/` (account, balance, brand, category, person, product, product-variant, store, transaction, transaction-item, backup). Shared code in `app/src/utilities/` (incl. `prisma.ts`, `errors/`). Jest integration tests in `app/tests/`.
- `client/` — frontend: Create React App + TypeScript, MUI, TanStack React Query, axios, ApexCharts. API calls in `client/src/api/`, hooks in `client/src/hooks/`, UI in `client/src/components/` (note: dashboard folder is spelled `dashborad`).
- `scripts/` — `run-backend-tests.sh`, `verify-migrations.sh`.
- Compose: `docker-compose.dev.yml` (dev), `docker-compose.yml` (prod-like local), `compose.test.yaml` (test harness).

## Commands

- Backend tests (authoritative): `scripts/run-backend-tests.sh` from repo root. Spins up a disposable MySQL on tmpfs, migrates, seeds, runs Jest serially, cleans up. Needs Docker.
- Quality gates (run in both `app/` and `client/`): `npm run lint`, `npm run typecheck`, `npm run format:check`, `npm run build`. Lint fails on errors only; warnings exist. CRA may treat warnings as errors under `CI=true`.
- Run app: `docker compose --file docker-compose.dev.yml up --build`.
- New migration: `cd app && npm run init-db` (wraps `prisma migrate dev`).

## Current status (as of 2026-09-28)

- **M0 stabilization (STAB-001..006): complete.** Don't re-create it as backlog work.
- **Next: R1A / Phase 1 — Financial guardrails** (execution plan steps 1–4): posting matrix → decimal-safe effect calculator → atomic writes → idempotency, processed-transaction immutability, refund limits.
- Then R1B manual entry rescue (steps 5–9), R2A receipt foundation (10–15), R2B reconciliation/aliases (16–20), R3 measured optimization (21–23).
- Work item IDs referenced in the plan: FIN-*, DOM-*, REC-*, AUTH-*, SPIKE-001 (see plan §8 for mapping).

## Key design rules

- Financial writes are atomic (single Prisma `$transaction`: transaction + items + balance effects + processed flag). Failures leave no partial state.
- Save & Process and receipt confirmation must be idempotent — never apply balances twice.
- Processed transactions are immutable (no edit/delete/re-process).
- Decimal-safe, currency-aware math; no float equality; no cross-currency aggregation without explicit support.
- Transaction total is independent of item rows; itemization is optional. Itemization state (NOT_ITEMIZED / PARTIAL / NEEDS_REVIEW / COMPLETE) is derived, not persisted, unless proven necessary. Don't add a fake summary item.
- Receipts (future): extraction output is untrusted draft data, runtime-validated against a strict schema, never writes financial records, never invents entity IDs. Human confirmation required. Aliases learned only from confirmed choices. Provider behind `ReceiptExtractionProvider` interface; keys backend-only (never `REACT_APP_*`).
- Receipt models stay single-user — no `userId`/`householdId`.
- Use the shared `PrismaClient` from `app/src/utilities/prisma.ts`; never construct a new one in services (tests may own one if they disconnect in `afterAll`).

## Safety rules

- Never edit an applied migration; add new timestamped, additive migrations and review the SQL.
- Never run `prisma migrate reset` / `prisma db push` / destructive SQL against retained data.
- Never delete the MySQL Docker volume without a verified backup and explicit user intent.
- Never commit `.env`, backups, DB dumps, receipt images, or provider keys.
- Back up (Settings → JSON export) before schema migrations or restores; verify backup/restore round-trip when backed-up tables change.

## Scope guardrails

Don't pull these into Release 1/2: authentication, households/beneficiaries, local OCR, public deployment, Kubernetes/n8n/distributed services, scanner pipelines, custom OCR training, dashboard expansion, full audit/reversal infra. They're F1–F5 tracks activated only by a documented trigger.

## Env vars

Backend: `DATABASE_URL` (required in production; startup validation rejects blank), `NODE_ENV`, `PORT` (default 5000). Frontend: `REACT_APP_API_BASE_URL` (public, baked in at build). Templates: `app/.env.example`, `client/.env.example`. Local Compose uses MySQL root with empty password — accepted for local scope only.
