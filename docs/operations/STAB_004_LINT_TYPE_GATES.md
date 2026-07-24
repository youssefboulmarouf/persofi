# STAB-004 — Backend and Frontend Lint/Type Gates

**Execution date:** 2026-07-24
**Status:** complete
**Database impact:** None
**API impact:** None
**Security impact:** Low

## Purpose

Neither module had an explicit lint, formatting-check, or type-check script
before this item. The backend had no ESLint or Prettier configuration at all;
the frontend had an ESLint configuration (Create React App's `react-app` /
`react-app/jest` presets, declared in `client/package.json`) but no script to
run it standalone, and no formatter. Add deterministic scripts for both
modules and record the pre-existing warning baseline rather than rewriting
the codebase to silence it.

## Changes

### Backend (`app/`)

- Added devDependencies: `eslint`, `@eslint/js`, `typescript-eslint`,
  `prettier`, `eslint-config-prettier`.
- Added `app/eslint.config.js` (flat config): TypeScript-ESLint recommended
  rules, `eslint-config-prettier` to defer style to Prettier, an override
  disabling Node-`require()` restrictions for the two CommonJS tooling config
  files (`eslint.config.js`, `jest.config.js`), and an `ignores` entry for two
  untracked local debug scripts (`test-update-axios.js`,
  `test-update-fetch.js` — ad hoc, gitignored by the repository's existing
  generic `app/**/*.js` rule, not part of the application or test suite).
- Downgraded `@typescript-eslint/no-explicit-any` and
  `@typescript-eslint/no-unused-vars` to `warn` rather than `error` — the
  codebase uses `any` at Prisma/JSON boundaries throughout; see "Warning
  baseline" below.
- Added `app/.prettierrc.json` (4-space indent, double quotes, trailing
  commas — matching the codebase's existing style) and `app/.prettierignore`.
- Added `.gitignore` exception `!app/eslint.config.js`, mirroring the existing
  `!app/jest.config.js` exception — without it, the new config file would
  have been silently excluded from Git by the generic `app/**/*.js` rule
  meant for compiled output, and never committed.
- Added scripts to `app/package.json`: `lint`, `format`, `format:check`,
  `typecheck`.
- Ran `prettier --write .` once, repository-wide, to establish a formatted
  baseline (a pure whitespace/quote/comma change with no logic difference —
  confirmed by an unchanged `typecheck` result and a full passing test run
  before and after).

### Frontend (`client/`)

- Added devDependency: `prettier` (ESLint 8.57.1 and `tsc` were already
  present transitively via `react-scripts`/`typescript`; no new lint engine
  was needed).
- Added scripts to `client/package.json`: `lint` (reuses the existing
  `eslintConfig` from `package.json`), `format`, `format:check`, `typecheck`.
- Added `client/.prettierrc.json` (matching the backend's style) and
  `client/.prettierignore`.
- Fixed a real gap found while auditing: `client/.dockerignore` did not
  exclude `.env`/`.env.*` the way `app/.dockerignore` already did (recorded
  in [`STAB-005`](STAB_005_ENV_CONTRACT.md), since it is a secret-handling
  fix, not a lint/type concern).
- Ran `prettier --write src` once to establish a formatted baseline.

## Warning baseline

Both gates are configured to **fail only on errors**; existing warnings are
recorded here as a baseline to burn down in separate, scoped issues rather
than fixed as part of this item.

- **Backend:** `npm run lint` → 0 errors, **44 warnings** (all
  `@typescript-eslint/no-explicit-any` at Prisma/JSON boundaries, plus 3
  pre-existing unused-variable warnings in `prisma/seed.ts`,
  `TransactionProcessorService.ts`, and `tests/TransactionValidator.test.ts`).
- **Frontend:** `npm run lint` → 0 errors, **70 warnings** (`eqeqeq`,
  `react-hooks/exhaustive-deps`, and `@typescript-eslint/no-unused-vars`
  across various components/hooks).

## Known constraint for future CI work

Create React App's build treats **all** ESLint warnings as build-breaking
errors when `CI=true` is set in the environment — the exact convention most
CI runners (including GitHub Actions) use by default:

```text
$ CI=true npm run build
Treating warnings as errors because process.env.CI = true.
Failed to compile.
# exit code 1 — even though `npm run build` (without CI=true) exits 0
```

`npm run lint` and `npm run typecheck` are unaffected (they exit 0 regardless
of `CI`). This only affects `react-scripts build`. **`CI-001` (validate
builds in GitHub Actions) must account for this** — either by not setting
`CI=true` for the frontend build step, or by burning down the 70-warning
baseline first. Recorded here rather than worked around silently so the
decision is explicit when `CI-001` is implemented.

## Verification evidence

Verified on 2026-07-24:

- **Backend:** `npm run typecheck` (0 errors), `npm run lint` (0 errors, 44
  warnings, exit 0), `npm run format:check` (clean after the one-time
  `format` run), and the full disposable-MySQL test harness
  (`scripts/run-backend-tests.sh`) — 7 suites, 97 tests, all passing —
  re-run successfully after the repository-wide Prettier pass, confirming no
  behavioral change.
- **Frontend:** `npx tsc --noEmit` (0 errors), `CI=true npx eslint src ...`
  (0 errors, 70 warnings, exit 0), `npm run format:check` (clean after the
  one-time `format` run), and `npm run build` (without `CI=true`, exit 0,
  succeeds) — re-run successfully after the Prettier pass. No frontend test
  files currently exist (`react-scripts test` reports "No tests found"); this
  is a pre-existing gap, out of scope for this item.
- **Determinism:** every script (`lint`, `format:check`, `typecheck`) was run
  twice in both modules; output and exit codes were byte-identical between
  runs.

## Acceptance criteria

- [x] Scripts are deterministic (verified: identical output across two
      consecutive runs of each script, in both modules).
- [x] Backend type check passes (`tsc --noEmit`, 0 errors).
- [x] Client type check passes (`tsc --noEmit`, 0 errors).
- [x] Policy for warnings is documented (fail on errors only; existing
      warnings recorded above as a baseline for separate scoped issues; the
      `CI=true` build-vs-warnings interaction is called out explicitly for
      `CI-001`).

## Tests

- `scripts/run-backend-tests.sh` — full backend suite, run before and after
  the formatting pass (both passing, byte-identical test counts).
- `npm run build` (frontend, both with and without `CI=true`) — run before
  and after the formatting pass.
- Manual: each of `lint`, `format:check`, `typecheck` run twice per module
  from the already-installed dependency tree to confirm determinism (see
  above; a full `rm -rf node_modules && npm ci` clean-install rerun was not
  performed as part of this verification).

## Definition of done

- [x] Implementation complete in both modules.
- [x] Required tests pass (backend suite, frontend build).
- [x] This document records the warning baseline and the `CI=true` build
      constraint for `CI-001`.
- [x] Acceptance criteria satisfied.
- [x] No new lint/type errors introduced; no unresolved high/critical
      security finding.
