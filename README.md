# persofi
Personal Finance Web Application

## Environment variables

Copy `app/.env.example` to `app/.env` and `client/.env.example` to
`client/.env` for local, non-Docker development. Never commit the resulting
`.env` files — they are gitignored.

The full variable contract (what each variable does, whether it's required
in production, defaults, and rotation guidance) is documented in
[`docs/operations/STAB_005_ENV_CONTRACT.md`](docs/operations/STAB_005_ENV_CONTRACT.md).

## Running tests

```bash
scripts/run-backend-tests.sh
```

Runs the full backend Jest suite against a disposable MySQL database created
solely for the run. See
[`docs/operations/STAB_003_TEST_HARNESS.md`](docs/operations/STAB_003_TEST_HARNESS.md).
