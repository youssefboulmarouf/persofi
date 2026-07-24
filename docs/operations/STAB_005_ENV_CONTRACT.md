# STAB-005 — Secret-Safe Environment Variable Contract

**Execution date:** 2026-07-24
**Status:** complete
**Database impact:** None
**API impact:** None
**Security impact:** High — this item exists to prevent secret leakage and undocumented configuration drift.

## Purpose

Document every environment variable this repository's tracked code and
configuration actually reads, where it is scoped, what happens when it is
missing, and how to rotate it — without printing any secret value. Audit
tracked history and local files for accidentally committed credentials before
any further schema or authentication work begins.

## Variable inventory

Only variables verified by grepping `app/src`, `client/src`, the Dockerfiles,
and the Compose files are listed. Nothing here is aspirational.

### Backend (`app/`)

| Variable | Required in production | Scope | Default | Read by |
|---|---|---|---|---|
| `DATABASE_URL` | **Yes** — startup fails fast if missing or blank | Backend process, Prisma | None | `app/src/index.ts` → `validateEnv()`; Prisma Client |
| `NODE_ENV` | Implicitly yes (`production`/`dev`/`test`) | Backend process | none (undefined behaves like non-production) | `app/src/index.ts` (server start gate, env validation gate) |
| `PORT` | No | Backend process | `5000` | `app/src/index.ts` |

`app/.env.example` documents these with placeholders. Copy it to `app/.env`
for local, non-Docker development; never commit the result.

### Frontend (`client/`)

| Variable | Required | Scope | Default | Read by |
|---|---|---|---|---|
| `REACT_APP_API_BASE_URL` | No (falls back to CRA's `undefined` if unset, which breaks API calls — set it explicitly) | **Build time only** — baked into the static bundle | None | Create React App's build process; passed as a Docker build `ARG`/`ENV` in `client/Dockerfile.prod` |

This variable is not a secret; it is the public base URL the browser calls.
It cannot be changed at container runtime — changing it requires rebuilding
the frontend image. `client/.env.example` documents it.

### Test harness (`compose.test.yaml`)

| Variable | Scope | Source |
|---|---|---|
| `PERSOFI_TEST_DATABASE_PASSWORD` | Disposable test MySQL container only | Generated per run by `scripts/run-backend-tests.sh` via `openssl rand -hex 24` |
| `PERSOFI_TEST_ROOT_PASSWORD` | Disposable test MySQL container only | Generated per run by `scripts/run-backend-tests.sh` via `openssl rand -hex 24` |
| `PERSOFI_TEST_COMMAND` | Disposable test container | Optional override, defaults to `npx prisma migrate deploy && ...` in `compose.test.yaml` |

These are ephemeral, randomly generated per test run and are never persisted
to a `.env` file — no example file is provided for them; see
[`STAB-003`](STAB_003_TEST_HARNESS.md).

## Known gap: development and production Compose files hardcode credentials

`docker-compose.yml` and `docker-compose.dev.yml` do **not** read any
environment variable for the database — they hardcode
`MYSQL_ALLOW_EMPTY_PASSWORD: "yes"` and
`DATABASE_URL: "mysql://root:@mysql:3306/persofi"` directly in the tracked
YAML. This is a real, pre-existing configuration weakness, not a documentation
gap: replacing it with least-privilege, secret-sourced credentials is the
explicit scope of **`DEVOPS-002` — Create secret-safe production Compose
networking**, which this item deliberately does not implement (its own
database/API impact is scoped to "None"). Anyone deploying `docker-compose.yml`
before `DEVOPS-002` lands is running MySQL with no root password.

## Known gap found and fixed during this audit

`client/.dockerignore` did not exclude `.env`/`.env.*` the way
`app/.dockerignore` already did, so `client/Dockerfile.dev`'s `COPY . .` would
have copied a local `client/.env` into the dev image. Fixed by mirroring the
backend's exclusion pattern (`.env`, `.env.*`, with `!.env.example` re-included).

## Local, untracked `.env` files present on disk

The following files exist locally and are correctly excluded by
`.gitignore` (`.env`, `app/.env`, `app/.env.test`, `client/.env`):

- Root `.env` — defines `MYSQL_DATABASE`, `MYSQL_USER`, `MYSQL_PASSWORD`,
  `MYSQL_ROOT_PASSWORD`, `API_PORT`, `DATABASE_URL`, `REACT_APP_API_BASE_URL`.
  **None of these are currently consumed** — no tracked Compose file uses
  `env_file:` or `${VARIABLE}` substitution, so this file has no effect today.
  Treat its values as unverified legacy configuration until `DEVOPS-002` wires
  Compose to read from it (or a replacement secret source).
- `app/.env` — `PORT`, `DATABASE_URL`. Used when running the backend directly
  with `npm run dev`/`npm start` outside Docker.
- `app/.env.test` — `DATABASE_URL`. Vestigial: per
  [`STAB-003`](STAB_003_TEST_HARNESS.md), `npm test` no longer reads
  `.env.test`; the disposable Compose harness injects `DATABASE_URL` directly.
  Safe to delete locally; not removed here since it is untracked and doing so
  is outside this documentation-only item's scope.
- `client/.env` — `REACT_APP_API_BASE_URL`.

No values from any of these files are reproduced in this document or were
printed to any log during this audit.

## Git history audit

```bash
git log --all --diff-filter=A --name-only | grep -iE "(^|/)\.env"
git ls-files | grep -iE "env"
```

Both commands returned no results: no `.env` file (or `.env.*` variant) has
ever been added to a tracked commit, and none is currently tracked. No
credential rotation is required as a result of this audit.

## Startup enforcement

`app/src/utilities/validateEnv.ts` runs immediately after `dotenv.config()` in
`app/src/index.ts`. When `NODE_ENV=production`, it checks that every variable
in its required list (`DATABASE_URL`) is present and non-blank, and throws
listing only the missing variable **names** — never values — before the HTTP
server starts. Outside production (`dev`, `test`, or unset) it is a no-op, so
local development and the Jest/Compose test harness are unaffected.

## Rotation guidance

- **`DATABASE_URL` / MySQL credentials:** rotate by updating the secret at its
  source (currently a local `.env` or Compose environment block; a managed
  secret store once `DEVOPS-002` lands), then restarting the API container.
  No application code reads or caches the credential outside Prisma's
  connection pool, so a restart is sufficient.
- **`REACT_APP_API_BASE_URL`:** not a secret; changing it requires rebuilding
  and redeploying the frontend image, since it is compiled into the static
  bundle.
- **Test harness passwords:** never rotated — a fresh random pair is generated
  for every `scripts/run-backend-tests.sh` invocation and discarded when the
  disposable Compose project is torn down.

## Acceptance criteria

- [x] Every variable referenced by tracked code or configuration is
      documented.
- [x] No credential value is committed (verified: no `.env` file, in any
      variant, exists in Git history or the current tree).
- [x] Startup rejects missing production variables (`validateEnv()`,
      enforced only when `NODE_ENV=production`).
- [x] History audit result recorded (see "Git history audit" above).

## Tests

- `app/tests/ValidateEnv.test.ts` — unit tests covering: no enforcement
  outside production; throws when `DATABASE_URL` is missing in production;
  throws when `DATABASE_URL` is blank in production; does not throw when
  `DATABASE_URL` is present in production.
- Manual secret scan: `git log --all --diff-filter=A --name-only | grep -iE
  "(^|/)\.env"` and `git ls-files | grep -iE "env"` (see above), both empty.

## Definition of done

- [x] `app/.env.example` and `client/.env.example` created with placeholders,
      not real values.
- [x] `client/.dockerignore` gap closed.
- [x] Startup validation implemented and tested.
- [x] This document records the full variable inventory, the git-history
      audit result, and the known Compose-credential gap tracked by
      `DEVOPS-002`.
- [x] Root README points to this contract.
