# Persofi Delivery Roadmap

This roadmap converts the verified gaps into independently reviewable issues. The detailed copy-ready definitions and project configuration are in `GITHUB_PROJECT_BACKLOG.md`. No application implementation is included in this analysis baseline.

## Initiatives and epics

| Initiative | Epic | Outcome | Milestone |
|---|---|---|---|
| STAB-I01 Repository stabilization | STAB-E01 Reproducible development | Builds, tests, environment, and migrations are reproducible | M0 |
| FIN-I01 Financial integrity | FIN-E01 Posting rules; FIN-E02 Atomic lifecycle | Every balance effect is deterministic, atomic, idempotent, and auditable | M2 |
| AUTH-I01 Data access protection | AUTH-E01 Identity; AUTH-E02 Household authorization | Financial data is authenticated and household-isolated | M2 |
| DOM-I01 Consumption domain | DOM-E01 Beneficiaries; DOM-E02 Itemization/catalog | Mixed-beneficiary and partial-item data remain correct | M1–M3 |
| REC-I01 Receipt import | REC-E01 Safe drafts; REC-E02 Local extraction | Untrusted receipts create reviewable drafts only | M4–M5 |
| OPS-I01 Production readiness | OPS-E01 Containers; OPS-E02 CI/security; OPS-E03 Deployment/recovery | Secure, observable, recoverable remote operation | M6–M8 |

## Phase sequence

### Phase 0 — Repository stabilization (M0)

`STAB-001` through `STAB-006`: capture a recoverable database baseline, commit a non-destructive Prisma baseline, make MySQL-backed tests reproducible, establish lint/type gates, document environment variables, and centralize Prisma lifecycle. This phase must precede schema work.

### Phase 1 — Domain-model correction (M1)

`DOM-001` through `DOM-008`: add default/item beneficiaries, backfill deliberately, resolve effective beneficiary, model itemization and direct product references, and expose backward-compatible contracts. Preserve brands pending a measured usage decision.

### Phase 2 — Financial integrity and access control (M2)

`FIN-001` through `FIN-008` and `AUTH-001` through `AUTH-006`: define/test the posting matrix, correct refunds, make posting and draft updates atomic, add idempotency/concurrency, reversals/audit, authentication, household ownership, object authorization, and HTTP controls.

### Phase 3 — UX and reporting (M3)

`DOM-007` and `DOM-008` deliver optional item entry, per-item beneficiary editing, reconciliation, and coverage display. Corrected server-side financial metrics and coverage-qualified consumption metrics are acceptance outcomes of the financial and itemization epics; further dashboard refinements should be added as post-baseline issues after formulas are approved.

### Phase 4 — Receipt foundation (M4)

`REC-001` through `REC-006`: strict draft schema, safe upload quarantine, aliases, duplicate scoring, reconciliation, and review/confirm UI/API. No extractor can write financial records.

### Phase 5 — Local OCR decision/integration (M5)

`SPIKE-001`, `REC-007`, `SEC-006`: benchmark representative generated/redacted receipts, implement only the selected bounded adapter, and test prompt/parser isolation.

### Phase 6 — Containerization (M6)

`DEVOPS-001` through `DEVOPS-004`: non-root pinned images, secret-safe Compose with internal DB, explicit migration job, health checks and production proxy.

### Phase 7 — CI and security (M7)

`CI-001` through `CI-003` and `SEC-001` through `SEC-005`: build/test/migration/image validation plus distinct dependency, SAST, secret, container, Dockerfile and configuration scans.

### Phase 8 — Production deployment (M8)

`DEPLOY-001` through `DEPLOY-006`: platform decision, immutable deploy/rollback, encrypted backup/restore rehearsal, monitoring, runbook, and secure remote access validation.

## Critical path

`STAB-001 → STAB-002 → STAB-003 → FIN-001 → FIN-002 → FIN-003 → FIN-004 → AUTH-001 → AUTH-002 → AUTH-003 → DEVOPS-002 → CI-001 → CI-002 → DEPLOY-001 → DEPLOY-002 → DEPLOY-003 → DEPLOY-006`.

Production remains blocked until database recovery, migration reproducibility, atomic financial posting, authentication/authorization, secure containers, CI gates, TLS/secrets, and restore-tested deployment are complete.

## Parallelizable work

- After `STAB-002`, domain additive migrations and financial policy unit tests can proceed in parallel.
- Identity implementation and posting-policy work can proceed in parallel, joining before object authorization integration tests.
- Container hardening, scanner configuration, and documentation can proceed after scripts/build commands stabilize.
- Receipt research can start after a synthetic dataset exists, but implementation waits for auth/ownership and safe storage.
- Frontend beneficiary and itemization components can be built against approved API contracts while backend work proceeds.

## Migration checkpoints

Use MC0–MC5 from `architecture/GAP_ANALYSIS.md`. Every checkpoint requires a row-count/orphan/reconciliation report, a named backup, a restore result, and explicit go/no-go approval. Do not use `prisma migrate reset` on retained data.

## Release blockers

All P0 issues, plus `DEVOPS-001`–`DEVOPS-004`, `CI-001`–`CI-003`, `SEC-001`–`SEC-005`, and `DEPLOY-001`–`DEPLOY-006`, block the first remotely accessible release. Receipt and OCR items do not.

## Release coordination points

1. Freeze writes for MC0 baseline/restore verification if production data exists.
2. Deploy nullable ownership columns before bootstrapping household identity.
3. Deploy dual-compatible beneficiary fields before backfill and constraint enforcement.
4. Reconcile all existing balances before enabling atomic posting.
5. Take a verified backup immediately before each constraint-enforcing migration.
6. Promote immutable images only after smoke tests; retain previous image and backup IDs.

## Breaking changes

Authentication, pagination/versioning, posted-transaction immutability, `personId` deprecation, and removal of startup seeding require coordinated client/API releases. Each uses a documented compatibility window rather than a flag-day schema change.

## Post-MVP items

All M4/M5 OCR features, advanced product/store comparisons, semantic matching, Ollama, multi-role administration beyond minimum household membership, and brand retirement are postponable. The first secure release may support manual optional itemization only.
