# persofi
Personal Finance Web Application

## Documentation

Start with the [documentation index](docs/README.md) or the active [roadmap](docs/ROADMAP.md).

## Environment variables

Copy `app/.env.example` to `app/.env` and `client/.env.example` to
`client/.env` for local, non-Docker development. Never commit the resulting
`.env` files — they are gitignored.

The full variable contract (what each variable does, whether it's required
in production, defaults, and rotation guidance) is documented in
[`docs/OPERATIONS.md#environment-variables`](docs/OPERATIONS.md#environment-variables).

## Running tests

```bash
scripts/run-backend-tests.sh
```

Runs the full backend Jest suite against a disposable MySQL database created
solely for the run. See
[`docs/OPERATIONS.md#backend-integration-tests`](docs/OPERATIONS.md#backend-integration-tests).
