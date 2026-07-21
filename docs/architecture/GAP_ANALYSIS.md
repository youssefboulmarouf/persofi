# Persofi Gap Analysis

Priority: P0 correctness/security/data protection; P1 first production release; P2 important; P3 future. Complexity is XS/S/M/L. No implementation item should be XL.

| Area | Current state | Target state | Gap / required change | Risk | Priority | Complexity | Dependencies | Migration / compatibility concern |
|---|---|---|---|---|---|---|---|---|
| Domain ownership | Global integer-ID data | User/household-scoped entities | Add identity, membership, `householdId`, scoped repositories | Critical | P0 | L | Auth decision | Add nullable, backfill single household, then constrain |
| Transactions | String types; mutable until processed | Validated state machine and immutable posting | Define enums/status/version/audit/reversal semantics | High | P0 | L | Migration baseline | Preserve existing type strings and IDs |
| Account balances | Snapshot writes outside shared transaction | Atomic deterministic signed effects | Central policy, Decimal math, DB transaction, locks, uniqueness/idempotency | Critical | P0 | L | Migration baseline | Reconcile existing snapshots before constraints |
| Income/expense | Basic effects implemented | Explicit account matrix | Reject unsupported types/currency and test every combination | High | P0 | M | Posting policy | Existing invalid records need report, not silent rewrite |
| Transfer | Two effects, no same-account/currency rule | Distinct compatible accounts, atomic effects | Validate source/destination and currency | High | P0 | S | Posting policy | Old cross-currency rows require classification |
| Credit payment | Correct nominal signs | Atomic, source and credit constraints | Prevent identical accounts and partial writes | High | P0 | S | Posting policy | None if additive validation |
| Refund | Link exists; no cap; metric mismatch | Eligible full/partial refund ledger | Validate original/remaining amount and reporting formula | Critical | P0 | M | Posting policy | Audit existing refunds and `amount`/`grandTotal` usage |
| Initial balance | Exception-message control flow | Exactly-once explicit opening effect | Replace flow, unique constraint, allow documented debt convention | High | P0 | S | Posting policy | Detect duplicate openings first |
| Process/update/delete | Process race; updates non-atomic; posted guarded | Idempotent post, atomic draft update, reversal | Add transaction boundary/version/key and reversal API | Critical | P0 | L | Audit model | Keep old processed records readable |
| Beneficiaries | Optional `Transaction.personId` only | Default plus item beneficiary | Rename semantically, add item FK/effective resolver | High | P1 | M | Household model | Dual-read `personId`; backfill items deliberately |
| Products | Generic product/category exists | Direct item product plus optional variation | Add item product FK; validate variation belongs to product | Medium | P1 | M | Migration baseline | Backfill product through variant where possible |
| Variations | Size/type/description; restrictive unique key | Reporting-meaningful variation | Review constraint and normalized semantics | Medium | P2 | S | Data audit | Preserve existing IDs/references |
| Brands | Full model exists | Optional legacy metadata | Measure usage; retain unless safe retirement chosen | Low | P3 | XS spike | Data audit | Never drop without export/backfill |
| Stores | Merchant CRUD, unique name | Merchant plus aliases | Add scoped store aliases/normalization | Medium | P2 | M | Household model | Existing stores become canonical records |
| Items | Description, quantity/prices, variant/category/brand | Raw/normalized label, product, beneficiary, discount/review/confidence | Add nullable fields and consistency validation | High | P1 | L | Product/beneficiary migrations | Additive migration then backfill |
| Itemization | Not represented | Explicit status, derived coverage/unallocated | Add status and reconciliation service | High | P1 | M | Transaction totals | Default historical rows based on verifiable totals only |
| Dashboard | Client aggregates all rows; formula defects | Server formulas split financial/consumption | Correct refund/net flow, processed filter, coverage, pagination | High | P0/P1 | L | Financial rules/itemization | Version formulas and regression-test old views |
| Receipt processing | Absent | Quarantined drafts, adapter, review-only persistence | Build upload/draft/alias/reconciliation/duplicate workflow | High | P2 | L | Auth, storage, itemization | Entirely additive; feature flag |
| OCR/AI | Absent | Benchmarked local adapter with strict schema | Research dataset/engines, sandbox worker, timeouts | High | P2 | L | Receipt foundation | Optional; no financial permissions |
| Authentication | Absent | Secure session/password lifecycle | Add users, sessions, login/logout/reset/throttling | Critical | P0 | L | Identity decision | Bootstrap current owner safely |
| Authorization | Absent | Household and object-level checks | Scope every entity/query, add negative tests | Critical | P0 | L | Auth + ownership migration | Single-household backfill checkpoint |
| API validation | Ad hoc casts | Strict schemas and consistent errors | Validate params/body/query; hide internals | High | P0 | M | API conventions | Preserve existing accepted payloads where valid |
| API shape | Unversioned, unpaginated | Versioned, documented, paginated | OpenAPI, pagination, compatibility window | Medium | P1 | M | Schema definitions | Keep `/api` adapter until client migrates |
| Database migrations | Directory gitignored; no initial migration | Committed baseline and tested additive migrations | Baseline existing DB, drift check, migration CI | Critical | P0 | M | Real schema/data access | Never reset production; baseline via resolve |
| Database runtime | API uses MySQL root/no password in Compose | Least-privilege app/migration/backup users | Secret-based credentials and grants | Critical | P0 | S | Environment design | Rotate without exposing values |
| Frontend | Functional CRUD SPA; warning-heavy | Authenticated, validated, tested workflows | Route guard, form errors, beneficiary/itemization/review UI | Medium | P1/P2 | L | APIs | Incremental components; no rewrite |
| Testing | Backend tests; integration setup fragile; no UI/E2E | Layered deterministic test pyramid | Containerized MySQL, migration/concurrency/auth/UI/E2E suites | High | P0 | L | Stable migrations | Generated data only |
| Docker | Dev/prod images and Compose | Non-root, pinned, healthy, secret-safe profiles | Harden images; explicit migration job; proxy; limits | Critical | P0/P1 | M | Migration/auth | Preserve volume; never recreate implicitly |
| CI/CD | Absent | Least-privilege validation/security workflows | Add builds, tests, migrations, images, Compose and scan gates | High | P1 | M | Reliable scripts | Deployment separate from PR CI |
| Security scanning | Absent | Dependabot, CodeQL, Gitleaks, Trivy, Hadolint | Configure non-overlapping scanners and policy | High | P1 | S | CI | Baseline findings with expiring exceptions |
| HTTP security | Open CORS; no headers/rate/body limits/CSRF | Same-origin, headers, throttles, CSRF | Add middleware and tests | Critical | P0 | M | Auth model | Dev origins explicitly configured |
| Upload security | No uploads | Signature/type/size/dimension/page/time limits | Quarantine, random names, parser isolation | High | P1 before receipts | M | Receipt storage | No real receipts in fixtures |
| Logging | Sync files, potentially sensitive payloads | Structured stdout, redaction, correlation | Replace logger behavior and retention | High | P1 | S | Logging schema | Preserve useful diagnostics without PII |
| Monitoring | None | Health/readiness, uptime/disk/backup alerts | Endpoints and minimal monitoring | High | P1 | M | Deployment | Health must not reveal internals |
| Backup | Unauthenticated JSON export/destructive restore | Scheduled encrypted dumps and rehearsed restore | Disable/secure endpoint; scripts, checksums, retention | Critical | P0 | M | Auth/storage | Verify current JSON export before deprecation |
| Recovery | None documented | RPO/RTO, rollback and restore runbook | Immutable releases, tested scripts, failure drills | High | P1 | M | Backup/deployment | Pre-migration checkpoint mandatory |
| Documentation | One-line README | Architecture, API, security, testing, operations | Create authoritative docs and update per phase | Medium | P1 | M | Decisions | Mark facts vs planned behavior |

## Migration checkpoints

1. **MC0:** inventory production schema/data; take two backups and successfully restore one to an isolated database.
2. **MC1:** commit/baseline Prisma migration without changing production tables; CI drift check passes.
3. **MC2:** add household/auth/audit columns nullable; bootstrap owner and single household; verify counts and orphan report.
4. **MC3:** add beneficiary/product/itemization fields nullable; dual-read/write release; backfill and reconcile.
5. **MC4:** deploy atomic posting/reversal path behind a flag; reconcile snapshot/effect equivalence.
6. **MC5:** enforce ownership/FK/unique/check constraints only after zero-anomaly reports.

## Breaking changes

- Authentication makes formerly anonymous endpoints require a session.
- Versioned/paginated list endpoints change response shape; retain a compatibility adapter during client migration.
- Posted transactions become immutable; callers must use reversal rather than update/delete.
- `personId` becomes `defaultBeneficiaryId`; support both during the deprecation window.
- Runtime migration/seed behavior moves out of API startup into controlled jobs.

## Release blockers

P0 blockers are: verified backup/restore and migration baseline; removal of empty/root DB credentials; authentication and household authorization; disabling/guarding restore; atomic/idempotent posting with tested refund/transfer/credit-payment rules; strict input/error/CORS/HTTP controls; reproducible tests; production health/TLS/secrets; and critical/high vulnerability resolution.

## Post-MVP items

Receipt OCR/vision, semantic matching, Ollama, store price comparisons, advanced consumption history, optional brand retirement, multi-household roles beyond owner/member, and public internet access can wait. Secure production does not depend on them.
