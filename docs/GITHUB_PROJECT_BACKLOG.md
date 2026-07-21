# GitHub Project Backlog

## Initiative summary

| Initiative | Objective | Epics | Atomic items | Target milestone |
|---|---|---:|---:|---|
| STAB-I01 — Repository stabilization | Establish recoverable, reproducible engineering baseline | 1 | 6 | M0 |
| FIN-I01 — Financial integrity | Make financial effects deterministic and atomic | 2 | 8 | M2 |
| AUTH-I01 — Data access protection | Authenticate and isolate household data | 2 | 6 | M2 |
| DOM-I01 — Consumption domain | Correct beneficiaries, catalog links, and itemization | 2 | 8 | M1–M3 |
| REC-I01 — Receipt import | Create safe human-reviewed local receipt automation | 2 | 8 | M4–M5 |
| OPS-I01 — Production readiness | Containerize, validate, secure, deploy, and recover | 3 | 18 | M6–M8 |

## Epic summary

| Epic ID | Epic title | Initiative | Brief description | Priority | Story count |
|---|---|---|---|---|---:|
| STAB-E01 | Reproducible development | STAB-I01 | Data baseline, migrations, tests, environment and tooling | P0 | 6 |
| FIN-E01 | Posting rules | FIN-I01 | Deterministic Decimal account effects and refunds | P0 | 3 |
| FIN-E02 | Atomic lifecycle | FIN-I01 | Transactions, idempotency, concurrency, audit and reversal | P0 | 5 |
| AUTH-E01 | Identity | AUTH-I01 | Secure application sessions | P0 | 2 |
| AUTH-E02 | Household authorization | AUTH-I01 | Ownership, BOLA prevention and HTTP protections | P0 | 4 |
| DOM-E01 | Beneficiaries | DOM-I01 | Default and per-item beneficiaries | P1 | 4 |
| DOM-E02 | Itemization and catalog | DOM-I01 | Coverage/status/product consistency | P1 | 4 |
| REC-E01 | Safe receipt drafts | REC-I01 | Upload, drafts, matching, reconciliation and review | P2 | 6 |
| REC-E02 | Local extraction | REC-I01 | Evidence-based OCR adapter and isolation | P2 | 2 |
| OPS-E01 | Production containers | OPS-I01 | Hardened runtime and health | P1 | 4 |
| OPS-E02 | CI and security | OPS-I01 | Automated quality/security gates | P1 | 8 |
| OPS-E03 | Deployment and recovery | OPS-I01 | Platform, deployment, backup, monitoring, runbook | P1 | 6 |

## Atomic backlog index

| ID | Title | Type | Area | Priority | Complexity | Dependencies | Milestone |
|---|---|---|---|---|---|---|---|
| STAB-001 | Verify a restorable production-data baseline | Technical task | Operations | P0 | M | None | M0 |
| STAB-002 | Commit a non-destructive Prisma migration baseline | Migration | Database | P0 | M | STAB-001 | M0 |
| STAB-003 | Create a reproducible MySQL integration-test harness | Test | Testing | P0 | M | STAB-002 | M0 |
| STAB-004 | Establish backend and frontend lint/type gates | Technical task | CI/CD | P1 | S | None | M0 |
| STAB-005 | Publish a secret-safe environment variable contract | Documentation | Documentation | P0 | S | None | M0 |
| STAB-006 | Reuse one Prisma client per API process | Technical task | Backend | P1 | S | STAB-003 | M0 |
| FIN-001 | Specify the deterministic account-effect matrix | Documentation | Architecture | P0 | S | STAB-002 | M2 |
| FIN-002 | Implement Decimal-based balance-effect calculation | Story | Backend | P0 | M | FIN-001 | M2 |
| FIN-003 | Enforce refund eligibility and remaining amount | Story | Backend | P0 | M | FIN-001 | M2 |
| FIN-004 | Post transaction effects atomically | Story | Backend | P0 | M | FIN-002,FIN-003,STAB-003 | M2 |
| FIN-005 | Make transaction posting idempotent and concurrency-safe | Story | Backend | P0 | M | FIN-004 | M2 |
| FIN-006 | Update unposted transactions atomically | Bug | Backend | P0 | S | STAB-003 | M2 |
| FIN-007 | Add financial audit events and reversal workflow | Story | Backend | P0 | L | FIN-004,AUTH-003 | M2 |
| FIN-008 | Add financial-rule integration and concurrency tests | Test | Testing | P0 | L | FIN-005,FIN-007 | M2 |
| AUTH-001 | Add user authentication and secure sessions | Story | Authentication | P0 | L | STAB-002,STAB-005 | M2 |
| AUTH-002 | Add household ownership to financial entities | Migration | Database | P0 | L | AUTH-001,STAB-001 | M2 |
| AUTH-003 | Enforce household authorization on every API resource | Security task | Authorization | P0 | L | AUTH-002 | M2 |
| AUTH-004 | Protect backup export and restore operations | Security task | Security | P0 | M | AUTH-003 | M2 |
| AUTH-005 | Add request validation and safe error responses | Security task | API | P0 | M | STAB-003 | M2 |
| AUTH-006 | Apply secure HTTP, CORS, CSRF and rate-limit policy | Security task | Security | P0 | M | AUTH-001 | M2 |
| DOM-001 | Add default and item beneficiary schema fields | Migration | Database | P1 | M | AUTH-002 | M1 |
| DOM-002 | Backfill historical item beneficiaries | Migration | Database | P1 | S | DOM-001,STAB-001 | M1 |
| DOM-003 | Resolve effective beneficiaries in the domain service | Story | Backend | P1 | S | DOM-001 | M1 |
| DOM-004 | Expose beneficiary fields through compatible APIs | Story | API | P1 | S | DOM-003,AUTH-003 | M1 |
| DOM-005 | Add itemization status and reconciliation fields | Migration | Database | P1 | M | STAB-002 | M1 |
| DOM-006 | Add direct product links and validate variations | Migration | Database | P1 | M | STAB-001 | M1 |
| DOM-007 | Implement itemization reconciliation and coverage | Story | Backend | P1 | M | DOM-005,DOM-006 | M3 |
| DOM-008 | Add optional itemization and beneficiary editing UI | Story | Frontend | P1 | L | DOM-004,DOM-007 | M3 |
| REC-001 | Define a strict receipt-draft extraction schema | Documentation | Receipt processing | P2 | S | DOM-007 | M4 |
| REC-002 | Quarantine and validate receipt uploads | Security task | Receipt processing | P1 | M | AUTH-003,REC-001 | M4 |
| REC-003 | Persist receipt drafts and raw extraction safely | Story | Database | P2 | M | REC-002 | M4 |
| REC-004 | Add store and product alias matching | Story | Receipt processing | P2 | M | REC-003,DOM-006 | M4 |
| REC-005 | Detect duplicates and reconcile receipt totals | Story | Receipt processing | P1 | M | REC-003 | M4 |
| REC-006 | Build receipt review and confirmation workflow | Story | Frontend | P2 | L | REC-004,REC-005,AUTH-003 | M4 |
| SPIKE-001 | Benchmark local OCR engines on representative receipts | Research spike | Receipt processing | P2 | M | REC-001 | M5 |
| REC-007 | Implement the selected bounded extraction adapter | Story | Receipt processing | P2 | L | SPIKE-001,REC-003 | M5 |
| DEVOPS-001 | Harden frontend and API production images | Technical task | DevOps | P1 | M | STAB-004 | M6 |
| DEVOPS-002 | Create secret-safe production Compose networking | Security task | DevOps | P0 | M | STAB-005,AUTH-001 | M6 |
| DEVOPS-003 | Run schema migrations as a controlled deployment job | Technical task | DevOps | P0 | S | STAB-002,DEVOPS-002 | M6 |
| DEVOPS-004 | Add liveness, readiness and container health checks | Story | Monitoring | P1 | M | DEVOPS-002 | M6 |
| CI-001 | Validate builds, lint, types and unit tests in CI | Technical task | CI/CD | P1 | M | STAB-003,STAB-004 | M7 |
| CI-002 | Validate migrations and integration tests in CI | Test | CI/CD | P0 | M | CI-001,DEVOPS-003 | M7 |
| CI-003 | Build images and validate Compose in CI | Technical task | CI/CD | P1 | S | DEVOPS-001,DEVOPS-002 | M7 |
| SEC-001 | Enable dependency update and vulnerability review | Security task | Security | P1 | S | CI-001 | M7 |
| SEC-002 | Add CodeQL static analysis | Security task | Security | P1 | S | CI-001 | M7 |
| SEC-003 | Add Gitleaks secret scanning | Security task | Security | P0 | S | CI-001 | M7 |
| SEC-004 | Scan images and configuration with Trivy | Security task | Security | P1 | S | CI-003 | M7 |
| SEC-005 | Lint Dockerfiles with Hadolint | Security task | Security | P2 | XS | DEVOPS-001 | M7 |
| DEPLOY-001 | Select a deployment platform from verified constraints | Research spike | Deployment | P1 | M | DEVOPS-002 | M8 |
| DEPLOY-002 | Create immutable deployment and rollback scripts | Technical task | Deployment | P1 | M | DEPLOY-001,DEVOPS-003,DEVOPS-004 | M8 |
| DEPLOY-003 | Create encrypted backup and verified restore scripts | Technical task | Operations | P0 | M | STAB-001,DEPLOY-001 | M8 |
| DEPLOY-004 | Configure HTTPS, secrets and secure remote access | Security task | Deployment | P0 | M | DEPLOY-001,AUTH-006 | M8 |
| DEPLOY-005 | Add monitoring and backup-failure alerts | Story | Monitoring | P1 | M | DEVOPS-004,DEPLOY-003 | M8 |
| DEPLOY-006 | Publish and validate the production operations runbook | Documentation | Operations | P1 | M | DEPLOY-002,DEPLOY-003,DEPLOY-005 | M8 |

## Detailed issue definitions

The following compact issue bodies contain every required field. “Standard DoD” means implementation/documentation complete, listed tests pass, acceptance criteria are met, relevant docs are updated, and no new unresolved high/critical finding exists.

## STAB-001 — Verify a restorable production-data baseline
**Type:** Technical task · **Area:** Operations · **Priority:** P0 · **Parent initiative:** STAB-I01 · **Parent epic:** STAB-E01 · **Dependencies:** None · **Blocked items:** STAB-002,AUTH-002,DOM-002,DEPLOY-003 · **Complexity:** M · **Risk:** High—unknown real data/state · **Milestone:** M0 · **Release:** First production release · **Labels:** `operations`, `database`, `priority:P0`

### Brief description
Inventory the actual schema and data without mutation, take two independent backups, and restore one into an isolated database. Record checksums, row counts, orphan checks, RPO/RTO assumptions, and secure storage location before any migration.

**Likely modules:** MySQL instance, Prisma schema, backup endpoint. **Database impact:** Query-only change; isolated restore only. **API impact:** None. **Security impact:** High; backups contain all financial data.

**Acceptance criteria:** [ ] Schema/data inventory recorded. [ ] Two encrypted/checksummed backups exist. [ ] One isolated restore passes counts and integrity checks. [ ] No production reset or seed occurs.  
**Tests:** Restore rehearsal; checksum and FK/orphan verification. **Definition of done:** Standard DoD plus owner-approved recovery evidence. 

## STAB-002 — Commit a non-destructive Prisma migration baseline
**Type:** Migration · **Area:** Database · **Priority:** P0 · **Parent initiative:** STAB-I01 · **Parent epic:** STAB-E01 · **Dependencies:** STAB-001 · **Blocked:** STAB-003,FIN-001,AUTH-001,DOM-005,DEVOPS-003 · **Complexity:** M · **Risk:** High—schema drift · **Milestone:** M0 · **Release:** First production release · **Labels:** `database`, `migration`, `priority:P0`

### Brief description
Stop ignoring migration history and create a baseline matching the verified existing schema. Use Prisma baseline resolution for retained databases; never reset production.

**Likely modules:** `app/prisma/schema.prisma`, `app/prisma/migrations`, `.gitignore`. **Database:** Schema metadata/baseline; no destructive DDL. **API:** None. **Security:** Medium.  
**Acceptance:** [ ] Migration files tracked. [ ] Empty DB reaches expected schema. [ ] Existing clone is baselined without data loss. [ ] Drift check is documented. **Tests:** Fresh migrate; clone baseline; schema diff. **DoD:** Standard DoD plus backup ID recorded.

## STAB-003 — Create a reproducible MySQL integration-test harness
**Type:** Test · **Area:** Testing · **Priority:** P0 · **Parents:** STAB-I01 / STAB-E01 · **Dependencies:** STAB-002 · **Blocked:** FIN-004,FIN-006,CI-001 · **Complexity:** M · **Risk:** Medium—test isolation · **Milestone:** M0 · **Release:** Local development only · **Labels:** `testing`, `database`, `priority:P0`

### Brief description
Provide a disposable MySQL test service and commands that migrate, seed generated fixtures, run tests, and cleanly stop. Remove reliance on a manually running localhost database.

**Modules:** app test scripts, Jest, test Compose. **Database:** Test-only schema reset. **API:** None. **Security:** Low. **Acceptance:** [ ] One documented command runs all backend tests. [ ] Each run starts clean. [ ] No real data/secrets used. [ ] Failure cleans resources. **Tests:** Harness self-test and existing suites. **DoD:** Standard DoD.

## STAB-004 — Establish backend and frontend lint/type gates
**Type:** Technical task · **Area:** CI/CD · **Priority:** P1 · **Parents:** STAB-I01 / STAB-E01 · **Dependencies:** None · **Blocked:** DEVOPS-001,CI-001 · **Complexity:** S · **Risk:** Low · **Milestone:** M0 · **Release:** Local development only · **Labels:** `quality`, `frontend`, `backend`

### Brief description
Add explicit lint, formatting-check, and type-check scripts and record the existing frontend warning baseline. Gates must fail on new errors while warnings are burned down in separate scoped issues.

**Modules:** both package manifests, ESLint/format config. **Database/API:** None. **Security:** Low. **Acceptance:** [ ] Scripts are deterministic. [ ] Backend/client type checks pass. [ ] Policy for warnings is documented. **Tests:** Run all scripts twice from clean install. **DoD:** Standard DoD.

## STAB-005 — Publish a secret-safe environment variable contract
**Type:** Documentation · **Area:** Documentation · **Priority:** P0 · **Parents:** STAB-I01 / STAB-E01 · **Dependencies:** None · **Blocked:** AUTH-001,DEVOPS-002 · **Complexity:** S · **Risk:** Medium—secret leakage · **Milestone:** M0 · **Release:** First production release · **Labels:** `documentation`, `security`, `priority:P0`

### Brief description
Create `.env.example` with placeholders, validation rules, scope, defaults, and rotation guidance. Audit tracked history and local files without printing secret values.

**Modules:** env files, Compose, README. **Database/API:** None. **Security:** High. **Acceptance:** [ ] Every referenced variable documented. [ ] No credential value committed. [ ] startup rejects missing production variables. [ ] history audit result recorded. **Tests:** secret scan; config validation. **DoD:** Standard DoD.

## STAB-006 — Reuse one Prisma client per API process
**Type:** Technical task · **Area:** Backend · **Priority:** P1 · **Parents:** STAB-I01 / STAB-E01 · **Dependencies:** STAB-003 · **Blocked:** None · **Complexity:** S · **Risk:** Low · **Milestone:** M0 · **Release:** MVP · **Labels:** `backend`, `performance`

### Brief description
Replace per-service PrismaClient construction with one lifecycle-managed process client and graceful disconnect. This prevents avoidable connection pools during compound transaction processing.

**Modules:** `BaseService`, new Prisma utility, server shutdown/tests. **Database:** None. **API:** Internal API change. **Security:** Low. **Acceptance:** [ ] Services share one client. [ ] shutdown disconnects. [ ] tests do not leak handles. **Tests:** unit/integration and connection-count observation. **DoD:** Standard DoD.

## FIN-001 — Specify the deterministic account-effect matrix
**Type:** Documentation · **Area:** Architecture · **Priority:** P0 · **Parents:** FIN-I01 / FIN-E01 · **Dependencies:** STAB-002 · **Blocked:** FIN-002,FIN-003 · **Complexity:** S · **Risk:** High—wrong rules corrupt balances · **Milestone:** M2 · **Release:** First production release · **Labels:** `finance`, `architecture`, `priority:P0`

### Brief description
Define inputs, signed effects, account constraints, currency rules, refunds, opening balances, reversals, and update/delete semantics for every transaction type. Product/OCR logic must have no role.

**Modules:** transaction/balance docs and enums. **Database/API:** None. **Security:** Medium. **Acceptance:** [ ] Six types covered. [ ] Credit debt convention explicit. [ ] transfer/credit/refund exclusions documented. [ ] examples approved. **Tests:** Convert matrix examples to parameterized test vectors. **DoD:** Standard DoD.

## FIN-002 — Implement Decimal-based balance-effect calculation
**Type:** Story · **Area:** Backend · **Priority:** P0 · **Parents:** FIN-I01 / FIN-E01 · **Dependencies:** FIN-001 · **Blocked:** FIN-004 · **Complexity:** M · **Risk:** High · **Milestone:** M2 · **Release:** First production release · **Labels:** `backend`, `finance`, `priority:P0`

### Brief description
Create a pure policy that validates accounts and returns signed Decimal effects. Remove binary floating-point equality and duplicated switch arithmetic from persistence code.

**Modules:** transaction processor/validator, balance domain. **Database:** None. **API:** Internal change. **Security:** Medium. **Acceptance:** [ ] Policy has no DB/AI dependency. [ ] exact decimal rules apply. [ ] invalid same-account/currency/type combinations fail. **Tests:** table-driven unit/property boundary tests. **DoD:** Standard DoD.

## FIN-003 — Enforce refund eligibility and remaining amount
**Type:** Story · **Area:** Backend · **Priority:** P0 · **Parents:** FIN-I01 / FIN-E01 · **Dependencies:** FIN-001 · **Blocked:** FIN-004 · **Complexity:** M · **Risk:** High · **Milestone:** M2 · **Release:** First production release · **Labels:** `backend`, `refund`, `priority:P0`

### Brief description
Validate that a refund references a posted expense in the household and does not exceed the unrefunded eligible amount. Standardize the refund total field used by posting and reporting.

**Modules:** transaction validator/service/schema. **Database:** Constraint/query change. **API:** Backward-compatible contract change. **Security:** High—household check. **Acceptance:** [ ] full/partial allowed. [ ] over-refund/foreign household rejected. [ ] concurrent refunds cannot exceed cap. **Tests:** integration/concurrency/API tests. **DoD:** Standard DoD.

## FIN-004 — Post transaction effects atomically
**Type:** Story · **Area:** Backend · **Priority:** P0 · **Parents:** FIN-I01 / FIN-E02 · **Dependencies:** FIN-002,FIN-003,STAB-003 · **Blocked:** FIN-005,FIN-007 · **Complexity:** M · **Risk:** High · **Milestone:** M2 · **Release:** First production release · **Labels:** `backend`, `database`, `priority:P0`

### Brief description
Wrap validation, account locks, all balance/effect inserts, audit data, and posted-state change in one Prisma database transaction. Any failure must leave no partial effect.

**Modules:** TransactionService/Processor, BalanceService, Prisma schema. **Database:** Schema/constraint change. **API:** Internal change. **Security:** High. **Acceptance:** [ ] one/two-account posting is atomic. [ ] injected failure rolls back all writes. [ ] uniqueness prevents duplicate effect. **Tests:** integration failure injection and transaction tests. **DoD:** Standard DoD plus migration verified.

## FIN-005 — Make transaction posting idempotent and concurrency-safe
**Type:** Story · **Area:** Backend · **Priority:** P0 · **Parents:** FIN-I01 / FIN-E02 · **Dependencies:** FIN-004 · **Blocked:** FIN-008 · **Complexity:** M · **Risk:** High · **Milestone:** M2 · **Release:** First production release · **Labels:** `backend`, `idempotency`, `priority:P0`

### Brief description
Accept/scopе an idempotency key and use row locking or optimistic conflict handling so retries return the original outcome and concurrent posts apply once.

**Modules:** transaction route/service/schema. **Database:** Index/constraint change. **API:** Backward-compatible contract change. **Security:** Medium—replay protection. **Acceptance:** [ ] repeated key returns same result. [ ] conflicting payload rejected. [ ] concurrent requests yield one posting. **Tests:** API concurrency/replay tests. **DoD:** Standard DoD.

## FIN-006 — Update unposted transactions atomically
**Type:** Bug · **Area:** Backend · **Priority:** P0 · **Parents:** FIN-I01 / FIN-E02 · **Dependencies:** STAB-003 · **Blocked:** None · **Complexity:** S · **Risk:** High—item loss · **Milestone:** M2 · **Release:** First production release · **Labels:** `backend`, `bug`, `priority:P0`

### Brief description
Combine item deletion, transaction update, and item recreation in one DB transaction with version validation. Preserve the prohibition on directly changing posted transactions.

**Modules:** TransactionService/ItemService. **Database:** None. **API:** Backward-compatible change. **Security:** Medium. **Acceptance:** [ ] injected failure preserves original. [ ] stale version conflicts. [ ] posted update rejected. **Tests:** integration rollback/concurrency tests. **DoD:** Standard DoD.

## FIN-007 — Add financial audit events and reversal workflow
**Type:** Story · **Area:** Backend · **Priority:** P0 · **Parents:** FIN-I01 / FIN-E02 · **Dependencies:** FIN-004,AUTH-003 · **Blocked:** FIN-008 · **Complexity:** L · **Risk:** High · **Milestone:** M2 · **Release:** First production release · **Labels:** `backend`, `audit`, `priority:P0`

### Brief description
Record actor, action, timestamp, correlation, before/after references, and reason for financial changes. Correct posted transactions through linked reversal/replacement effects.

**Modules:** Prisma audit models, transaction API/service. **Database:** Schema change. **API:** New endpoint. **Security:** High. **Acceptance:** [ ] posted rows immutable. [ ] reversal nets original effects. [ ] actor/household/reason recorded. [ ] audit events cannot be client-forged. **Tests:** integration/auth/audit tests. **DoD:** Standard DoD.

## FIN-008 — Add financial-rule integration and concurrency tests
**Type:** Test · **Area:** Testing · **Priority:** P0 · **Parents:** FIN-I01 / FIN-E02 · **Dependencies:** FIN-005,FIN-007 · **Blocked:** production release · **Complexity:** L · **Risk:** Medium · **Milestone:** M2 · **Release:** First production release · **Labels:** `testing`, `finance`, `priority:P0`

### Brief description
Cover the observable balance result for every account/type case, full/partial refunds, failures, retries, concurrent posts, update, reversal, deletion rejection, and account/amount changes.

**Modules:** backend integration tests. **Database:** Test-only. **API:** None. **Security:** Medium. **Acceptance:** [ ] required matrix is parameterized. [ ] concurrency/failure paths deterministic. [ ] no implementation-detail assertions. **Tests:** This issue is the integration/concurrency suite. **DoD:** All tests pass repeatedly against disposable MySQL.

## AUTH-001 — Add user authentication and secure sessions
**Type:** Story · **Area:** Authentication · **Priority:** P0 · **Parents:** AUTH-I01 / AUTH-E01 · **Dependencies:** STAB-002,STAB-005 · **Blocked:** AUTH-002,AUTH-006,DEVOPS-002 · **Complexity:** L · **Risk:** High · **Milestone:** M2 · **Release:** First production release · **Labels:** `authentication`, `security`, `priority:P0`

### Brief description
Implement bootstrap/sign-in/sign-out and revocable server-managed sessions using Argon2id password hashes and Secure HttpOnly SameSite cookies. Add throttling and a documented recovery path; no default credentials.

**Modules:** new auth module/schema, client session/route guard. **Database:** Schema change. **API:** New endpoints. **Security:** Critical. **Acceptance:** [ ] passwords never stored/logged. [ ] cookies secure in production. [ ] session rotation/revocation works. [ ] login throttled. **Tests:** unit/integration/security/browser tests. **DoD:** Standard DoD plus threat-model update.

## AUTH-002 — Add household ownership to financial entities
**Type:** Migration · **Area:** Database · **Priority:** P0 · **Parents:** AUTH-I01 / AUTH-E02 · **Dependencies:** AUTH-001,STAB-001 · **Blocked:** AUTH-003,DOM-001 · **Complexity:** L · **Risk:** High · **Milestone:** M2 · **Release:** First production release · **Labels:** `database`, `authorization`, `migration`, `priority:P0`

### Brief description
Add household/membership and ownership to accounts, persons, categories, products, stores, transactions, receipts, and dependent records via staged nullable/backfill/constrain migrations.

**Modules:** Prisma schema/migrations/verification scripts. **Database:** Schema change and backfill. **API:** None initially. **Security:** Critical. **Acceptance:** [ ] all current rows assigned to bootstrap household. [ ] zero orphans/cross-household FKs. [ ] rollback/recovery documented. **Tests:** migration on representative clone. **DoD:** Standard DoD plus MC2 approved.

## AUTH-003 — Enforce household authorization on every API resource
**Type:** Security task · **Area:** Authorization · **Priority:** P0 · **Parents:** AUTH-I01 / AUTH-E02 · **Dependencies:** AUTH-002 · **Blocked:** AUTH-004,FIN-007,DOM-004,REC-002 · **Complexity:** L · **Risk:** High · **Milestone:** M2 · **Release:** First production release · **Labels:** `authorization`, `security`, `priority:P0`

### Brief description
Resolve household context server-side and scope every list/get/create/update/delete, relationship lookup, balance, dashboard, and receipt operation. Prevent ID enumeration and cross-household references.

**Modules:** middleware, all resources/services. **Database:** Query-only change. **API:** Modified endpoints. **Security:** Critical. **Acceptance:** [ ] anonymous denied. [ ] foreign IDs denied without existence leakage. [ ] nested references scoped. [ ] coverage inventory has no unguarded route. **Tests:** BOLA negative integration tests per resource. **DoD:** Standard DoD.

## AUTH-004 — Protect backup export and restore operations
**Type:** Security task · **Area:** Security · **Priority:** P0 · **Parents:** AUTH-I01 / AUTH-E02 · **Dependencies:** AUTH-003 · **Blocked:** production release · **Complexity:** M · **Risk:** High · **Milestone:** M2 · **Release:** First production release · **Labels:** `security`, `backup`, `priority:P0`

### Brief description
Disable public restore by default; require re-authenticated owner authorization and an operational confirmation mechanism. Make restore staged/transaction-safe and verify format, checksum, schema compatibility, and household scope.

**Modules:** BackupResource/Service, operations tooling. **Database:** Data migration/replacement only under explicit operation. **API:** Breaking security change. **Security:** Critical. **Acceptance:** [ ] anonymous/member restore denied. [ ] failure preserves original DB. [ ] audit event and restore report created. **Tests:** authorization, malformed backup, injected failure, restore test. **DoD:** Standard DoD.

## AUTH-005 — Add request validation and safe error responses
**Type:** Security task · **Area:** API · **Priority:** P0 · **Parents:** AUTH-I01 / AUTH-E02 · **Dependencies:** STAB-003 · **Blocked:** production release · **Complexity:** M · **Risk:** High · **Milestone:** M2 · **Release:** First production release · **Labels:** `api`, `validation`, `security`

### Brief description
Apply typed schemas to params/query/body and consistent public errors. Reject unknown/invalid types, dates, decimals, relationships and oversized JSON without exposing SQL, paths, or stack details.

**Modules:** resources, DTO wrappers, error middleware. **Database:** None. **API:** Modified endpoint validation. **Security:** High. **Acceptance:** [ ] all mutations validated. [ ] invalid input is 4xx. [ ] internal errors use correlation ID only. [ ] body limit configured. **Tests:** API contract/fuzz boundary tests. **DoD:** Standard DoD.

## AUTH-006 — Apply secure HTTP, CORS, CSRF and rate-limit policy
**Type:** Security task · **Area:** Security · **Priority:** P0 · **Parents:** AUTH-I01 / AUTH-E02 · **Dependencies:** AUTH-001 · **Blocked:** DEPLOY-004 · **Complexity:** M · **Risk:** High · **Milestone:** M2 · **Release:** First production release · **Labels:** `security`, `http`, `priority:P0`

### Brief description
Add secure headers, same-origin/restrictive CORS, CSRF protection for cookie mutations, proxy trust rules, and targeted auth/write throttles. Development origins are explicit.

**Modules:** Express bootstrap/proxy config. **Database:** None. **API:** Modified security behavior. **Security:** Critical. **Acceptance:** [ ] unauthorized origins blocked. [ ] CSRF mutation fails. [ ] security headers present. [ ] proxy/client IP behavior tested. **Tests:** security integration/browser tests. **DoD:** Standard DoD.

## DOM-001 — Add default and item beneficiary schema fields
**Type:** Migration · **Area:** Database · **Priority:** P1 · **Parents:** DOM-I01 / DOM-E01 · **Dependencies:** AUTH-002 · **Blocked:** DOM-002,DOM-003 · **Complexity:** M · **Risk:** Medium · **Milestone:** M1 · **Release:** MVP · **Labels:** `database`, `beneficiary`, `migration`

### Brief description
Introduce transaction `defaultBeneficiaryId` and nullable item `beneficiaryId` with household-safe FKs while preserving legacy `personId` during dual compatibility.

**Modules:** Prisma schema/migrations. **Database:** Schema/index/constraint change. **API:** None. **Security:** High—ownership consistency. **Acceptance:** [ ] additive migration preserves rows. [ ] FKs/indexes exist. [ ] mixed-version plan documented. **Tests:** migration/rollback-recovery tests. **DoD:** Standard DoD.

## DOM-002 — Backfill historical item beneficiaries
**Type:** Migration · **Area:** Database · **Priority:** P1 · **Parents:** DOM-I01 / DOM-E01 · **Dependencies:** DOM-001,STAB-001 · **Blocked:** constraint checkpoint · **Complexity:** S · **Risk:** Medium · **Milestone:** M1 · **Release:** MVP · **Labels:** `migration`, `beneficiary`

### Brief description
Copy legacy transaction persons to default beneficiaries and leave item beneficiaries null so inheritance preserves historical meaning. Produce counts for nulls, invalid references, and changed rows.

**Modules:** migration/backfill/verification scripts. **Database:** Backfill. **API:** None. **Security:** Medium. **Acceptance:** [ ] transaction defaults match valid legacy persons. [ ] item overrides remain null. [ ] anomalies reported, not guessed. [ ] rerun idempotent. **Tests:** representative migration tests. **DoD:** Standard DoD plus backup ID.

## DOM-003 — Resolve effective beneficiaries in the domain service
**Type:** Story · **Area:** Backend · **Priority:** P1 · **Parents:** DOM-I01 / DOM-E01 · **Dependencies:** DOM-001 · **Blocked:** DOM-004 · **Complexity:** S · **Risk:** Medium · **Milestone:** M1 · **Release:** MVP · **Labels:** `backend`, `beneficiary`

### Brief description
Implement the single rule `item beneficiary ?? transaction default` and household validation. Missing both remains explicitly unassigned.

**Modules:** transaction-item/domain/report services. **Database:** Query-only. **API:** Internal change. **Security:** High. **Acceptance:** [ ] explicit override wins. [ ] default inherits. [ ] missing remains null. [ ] foreign beneficiary rejected. **Tests:** unit/authorization tests. **DoD:** Standard DoD.

## DOM-004 — Expose beneficiary fields through compatible APIs
**Type:** Story · **Area:** API · **Priority:** P1 · **Parents:** DOM-I01 / DOM-E01 · **Dependencies:** DOM-003,AUTH-003 · **Blocked:** DOM-008 · **Complexity:** S · **Risk:** Medium · **Milestone:** M1 · **Release:** MVP · **Labels:** `api`, `beneficiary`

### Brief description
Add default, explicit, and effective beneficiary fields to transaction contracts while accepting legacy `personId` during a documented deprecation period.

**Modules:** Transaction JSON/Resource/client model. **Database:** None. **API:** Backward-compatible contract change. **Security:** High. **Acceptance:** [ ] old valid requests work. [ ] responses distinguish three concepts. [ ] OpenAPI/deprecation documented. **Tests:** API contract/backward compatibility/auth tests. **DoD:** Standard DoD.

## DOM-005 — Add itemization status and reconciliation fields
**Type:** Migration · **Area:** Database · **Priority:** P1 · **Parents:** DOM-I01 / DOM-E02 · **Dependencies:** STAB-002 · **Blocked:** DOM-007 · **Complexity:** M · **Risk:** Medium · **Milestone:** M1 · **Release:** MVP · **Labels:** `database`, `itemization`, `migration`

### Brief description
Add controlled itemization status and fields needed for taxes, fees, tips and discounts while keeping transaction total authoritative. Historical status is assigned only from verifiable data.

**Modules:** Prisma transaction/item schema/migrations. **Database:** Schema/backfill/constraint change. **API:** None. **Security:** Low. **Acceptance:** [ ] statuses constrained. [ ] no financial total recomputed silently. [ ] historical assignment report produced. **Tests:** migration and constraint tests. **DoD:** Standard DoD.

## DOM-006 — Add direct product links and validate variations
**Type:** Migration · **Area:** Database · **Priority:** P1 · **Parents:** DOM-I01 / DOM-E02 · **Dependencies:** STAB-001 · **Blocked:** DOM-007,REC-004 · **Complexity:** M · **Risk:** Medium · **Milestone:** M1 · **Release:** MVP · **Labels:** `database`, `product`, `migration`

### Brief description
Add nullable direct product references to items and backfill through existing variants. Validate that any selected variation belongs to the selected product and record category consistency anomalies.

**Modules:** Prisma catalog/item schema/services. **Database:** Schema/backfill/index change. **API:** Backward-compatible later. **Security:** Medium—ownership. **Acceptance:** [ ] resolvable items backfilled. [ ] inconsistent variation rejected. [ ] unresolved items preserved. [ ] brand data unchanged. **Tests:** migration/domain tests. **DoD:** Standard DoD.

## DOM-007 — Implement itemization reconciliation and coverage
**Type:** Story · **Area:** Backend · **Priority:** P1 · **Parents:** DOM-I01 / DOM-E02 · **Dependencies:** DOM-005,DOM-006 · **Blocked:** DOM-008,REC-001 · **Complexity:** M · **Risk:** High · **Milestone:** M3 · **Release:** MVP · **Labels:** `backend`, `itemization`

### Brief description
Derive allocated and unallocated amounts with configurable currency tolerance, validate quantity/prices/totals, and calculate coverage without affecting balances.

**Modules:** transaction itemization/report services. **Database:** Query-only. **API:** Backward-compatible fields. **Security:** Low. **Acceptance:** [ ] partial/full/overallocated states deterministic. [ ] tax/fees/tips/discount formula documented. [ ] balances unchanged. **Tests:** unit/API boundary tests. **DoD:** Standard DoD.

## DOM-008 — Add optional itemization and beneficiary editing UI
**Type:** Story · **Area:** Frontend · **Priority:** P1 · **Parents:** DOM-I01 / DOM-E02 · **Dependencies:** DOM-004,DOM-007 · **Blocked:** None · **Complexity:** L · **Risk:** Medium · **Milestone:** M3 · **Release:** MVP · **Labels:** `frontend`, `itemization`, `beneficiary`

### Brief description
Allow quick financial transaction entry without items, default beneficiaries, item overrides, bulk defaulting, and visible reconciliation/coverage. Never block a financially valid transaction merely for incomplete items.

**Modules:** transaction forms/item dialog/models/hooks. **Database:** None. **API:** Uses compatible fields. **Security:** Medium. **Acceptance:** [ ] no-item expense saves. [ ] mixed beneficiaries editable. [ ] unallocated/coverage visible. [ ] validation errors accessible. **Tests:** component and E2E workflows. **DoD:** Standard DoD.

## REC-001 — Define a strict receipt-draft extraction schema
**Type:** Documentation · **Area:** Receipt processing · **Priority:** P2 · **Parents:** REC-I01 / REC-E01 · **Dependencies:** DOM-007 · **Blocked:** REC-002,SPIKE-001 · **Complexity:** S · **Risk:** Medium · **Milestone:** M4 · **Release:** Receipt-processing release · **Labels:** `receipt-processing`, `documentation`

### Brief description
Specify bounded JSON for receipt metadata, totals, raw lines, confidence, errors, and review state. Treat all extractor output as untrusted suggestions.

**Modules:** receipt schema/docs. **Database:** None. **API:** New future contract. **Security:** High. **Acceptance:** [ ] size/type/range rules defined. [ ] unknown fields rejected. [ ] raw/normalized values separate. [ ] no financial-write instruction exists. **Tests:** valid/invalid schema fixtures. **DoD:** Standard DoD.

## REC-002 — Quarantine and validate receipt uploads
**Type:** Security task · **Area:** Receipt processing · **Priority:** P1 · **Parents:** REC-I01 / REC-E01 · **Dependencies:** AUTH-003,REC-001 · **Blocked:** REC-003 · **Complexity:** M · **Risk:** High · **Milestone:** M4 · **Release:** Receipt-processing release · **Labels:** `security`, `upload`, `receipt-processing`

### Brief description
Accept only authorized image/PDF uploads and validate extension, MIME, signature, size, dimensions, PDF pages, filename and storage path. Store randomized files outside executable/static paths with time/resource limits.

**Modules:** new receipt upload/storage middleware. **Database:** Metadata schema change. **API:** New endpoint. **Security:** Critical. **Acceptance:** [ ] spoofed/oversized/bomb/path inputs rejected. [ ] files private and randomized. [ ] cleanup policy exists. **Tests:** malicious upload/security/integration tests. **DoD:** Standard DoD.

## REC-003 — Persist receipt drafts and raw extraction safely
**Type:** Story · **Area:** Database · **Priority:** P2 · **Parents:** REC-I01 / REC-E01 · **Dependencies:** REC-002 · **Blocked:** REC-004,REC-005,REC-007 · **Complexity:** M · **Risk:** Medium · **Milestone:** M4 · **Release:** Receipt-processing release · **Labels:** `database`, `receipt-processing`

### Brief description
Add household-scoped draft, line, processing status, hash, raw-result and review metadata. Drafts cannot directly post transactions or create catalog records.

**Modules:** Prisma receipt models/service. **Database:** Schema/index change. **API:** New internal API. **Security:** High. **Acceptance:** [ ] statuses transition validly. [ ] raw labels retained. [ ] permanent transaction FK only after confirmation. [ ] retention documented. **Tests:** migration/state/auth tests. **DoD:** Standard DoD.

## REC-004 — Add store and product alias matching
**Type:** Story · **Area:** Receipt processing · **Priority:** P2 · **Parents:** REC-I01 / REC-E01 · **Dependencies:** REC-003,DOM-006 · **Blocked:** REC-006 · **Complexity:** M · **Risk:** Medium · **Milestone:** M4 · **Release:** Receipt-processing release · **Labels:** `receipt-processing`, `matching`

### Brief description
Persist household/store-scoped confirmed aliases and rank exact store, global normalized, fuzzy, and prior-confirmation matches. Unknown lines remain unresolved; no automatic product creation.

**Modules:** receipt aliases/matcher/catalog service. **Database:** Schema/index change. **API:** Internal/new review fields. **Security:** Medium. **Acceptance:** [ ] deterministic ranking. [ ] confirmation updates alias safely. [ ] foreign aliases invisible. [ ] unknown action choices supported. **Tests:** unit/integration/auth tests. **DoD:** Standard DoD.

## REC-005 — Detect duplicates and reconcile receipt totals
**Type:** Story · **Area:** Receipt processing · **Priority:** P1 · **Parents:** REC-I01 / REC-E01 · **Dependencies:** REC-003 · **Blocked:** REC-006 · **Complexity:** M · **Risk:** High · **Milestone:** M4 · **Release:** Receipt-processing release · **Labels:** `receipt-processing`, `finance`

### Brief description
Score duplicates from hash plus store/date/time/total/number/payment suffix/item set and reconcile items + taxes + fees + tips − discounts within tolerance. Weak single-field matches warn rather than block.

**Modules:** receipt duplicate/reconciliation services. **Database:** Index/query change. **API:** New draft warnings. **Security:** Medium—duplicate/replay. **Acceptance:** [ ] exact hash and composite candidates detected. [ ] single weak field not decisive. [ ] mismatch needs review. [ ] itemized total cannot silently exceed total. **Tests:** unit/integration/property tests. **DoD:** Standard DoD.

## REC-006 — Build receipt review and confirmation workflow
**Type:** Story · **Area:** Frontend · **Priority:** P2 · **Parents:** REC-I01 / REC-E01 · **Dependencies:** REC-004,REC-005,AUTH-003 · **Blocked:** None · **Complexity:** L · **Risk:** High · **Milestone:** M4 · **Release:** Receipt-processing release · **Labels:** `frontend`, `receipt-processing`

### Brief description
Create review APIs/UI for store, account, date, totals, products, variations, beneficiaries, ignored classifications, confidence and duplicate warnings. Confirmation creates one unposted transaction through deterministic validation.

**Modules:** receipt API/service/client pages/hooks. **Database:** Transactional draft linkage. **API:** New endpoints. **Security:** High. **Acceptance:** [ ] every suggestion editable. [ ] explicit confirmation required. [ ] retry idempotent. [ ] OCR cannot post balances/products. **Tests:** API/component/E2E/auth/idempotency tests. **DoD:** Standard DoD.

## SPIKE-001 — Benchmark local OCR engines on representative receipts
**Type:** Research spike · **Area:** Receipt processing · **Priority:** P2 · **Parents:** REC-I01 / REC-E02 · **Dependencies:** REC-001 · **Blocked:** REC-007 · **Complexity:** M · **Risk:** Low · **Milestone:** M5 · **Release:** Receipt-processing release · **Labels:** `research`, `ocr`

### Brief description
Compare Tesseract, PaddleOCR/docTR and justified local vision candidates on generated/redacted representative English/French receipts. Measure field/line accuracy, latency, memory, CPU/GPU needs, license, maintenance, packaging and failure modes; publish a decision and follow-ups.

**Modules:** benchmark harness/dataset/docs. **Database/API:** None. **Security:** Medium—no real receipts. **Acceptance:** [ ] options/criteria/data documented. [ ] repeatable results recorded. [ ] recommendation includes host feasibility/cost. [ ] follow-up issue refined. **Tests:** benchmark repeatability. **DoD:** Decision record approved.

## REC-007 — Implement the selected bounded extraction adapter
**Type:** Story · **Area:** Receipt processing · **Priority:** P2 · **Parents:** REC-I01 / REC-E02 · **Dependencies:** SPIKE-001,REC-003 · **Blocked:** None · **Complexity:** L · **Risk:** High · **Milestone:** M5 · **Release:** Receipt-processing release · **Labels:** `receipt-processing`, `ocr`, `security`

### Brief description
Implement the selected local adapter with strict schema validation, no DB credentials/outbound tools, bounded CPU/memory/time/output, retries and failure states. Receipt prompt text cannot alter instructions or execute actions.

**Modules:** extraction adapter/optional worker/Compose. **Database:** Status updates only. **API:** Internal adapter. **Security:** Critical. **Acceptance:** [ ] sandbox boundaries verified. [ ] invalid/timeout output fails safely. [ ] confidence/raw output retained. [ ] financial tables untouched. **Tests:** parser, timeout, resource, injection and integration tests. **DoD:** Standard DoD.

## DEVOPS-001 — Harden frontend and API production images
**Type:** Technical task · **Area:** DevOps · **Priority:** P1 · **Parents:** OPS-I01 / OPS-E01 · **Dependencies:** STAB-004 · **Blocked:** CI-003,SEC-005 · **Complexity:** M · **Risk:** Medium · **Milestone:** M6 · **Release:** First production release · **Labels:** `devops`, `docker`

### Brief description
Pin maintained base versions, use multi-stage minimal builds, non-root runtime users/read-only paths where practical, init/signal handling and reproducible dependency installs. Remove seeds/migrations from API startup.

**Modules:** app/client Dockerfiles, Nginx. **Database:** None. **API:** None. **Security:** High. **Acceptance:** [ ] both images run non-root where practical. [ ] clean builds succeed. [ ] graceful stop works. [ ] no dev dependencies/tools required at runtime. **Tests:** image build/runtime/signal tests. **DoD:** Standard DoD.

## DEVOPS-002 — Create secret-safe production Compose networking
**Type:** Security task · **Area:** DevOps · **Priority:** P0 · **Parents:** OPS-I01 / OPS-E01 · **Dependencies:** STAB-005,AUTH-001 · **Blocked:** DEVOPS-003,DEVOPS-004,DEPLOY-001 · **Complexity:** M · **Risk:** High · **Milestone:** M6 · **Release:** First production release · **Labels:** `devops`, `security`, `priority:P0`

### Brief description
Replace empty/root DB credentials with least-privilege secrets, keep DB internal, expose only proxy/web, separate dev/prod behavior, add named volumes, restart/resource policy, and same-origin API routing.

**Modules:** Compose files, env contract, proxy config. **Database:** Credential/grant change. **API:** Deployment URL change. **Security:** Critical. **Acceptance:** [ ] missing secrets fail. [ ] DB/API not publicly published. [ ] app/migration/backup privileges separated. [ ] persistent volume survives restart. **Tests:** Compose config/network/persistence tests. **DoD:** Standard DoD.

## DEVOPS-003 — Run schema migrations as a controlled deployment job
**Type:** Technical task · **Area:** DevOps · **Priority:** P0 · **Parents:** OPS-I01 / OPS-E01 · **Dependencies:** STAB-002,DEVOPS-002 · **Blocked:** CI-002,DEPLOY-002 · **Complexity:** S · **Risk:** High · **Milestone:** M6 · **Release:** First production release · **Labels:** `devops`, `migration`, `priority:P0`

### Brief description
Create a one-shot migration job using dedicated privileges, backup precondition and single-run lock. API startup checks compatibility but never seeds or races migrations.

**Modules:** Compose/migration script/Docker image. **Database:** Applies tracked migrations. **API:** None. **Security:** High. **Acceptance:** [ ] job is explicit/idempotent. [ ] failure blocks promotion. [ ] seed is separate/manual. [ ] logs omit URL credentials. **Tests:** fresh/existing/failing migration deployment tests. **DoD:** Standard DoD.

## DEVOPS-004 — Add liveness, readiness and container health checks
**Type:** Story · **Area:** Monitoring · **Priority:** P1 · **Parents:** OPS-I01 / OPS-E01 · **Dependencies:** DEVOPS-002 · **Blocked:** DEPLOY-002,DEPLOY-005 · **Complexity:** M · **Risk:** Low · **Milestone:** M6 · **Release:** First production release · **Labels:** `monitoring`, `devops`

### Brief description
Add non-sensitive live/ready/version endpoints and health checks for API, web and database. Readiness validates DB and migration compatibility; liveness avoids external dependencies.

**Modules:** Express health resource, Nginx, Compose. **Database:** Query-only readiness. **API:** New endpoints. **Security:** Medium. **Acceptance:** [ ] dependency failure changes readiness only. [ ] endpoints reveal no secrets. [ ] Compose startup uses health state. **Tests:** integration/container health tests. **DoD:** Standard DoD.

## CI-001 — Validate builds, lint, types and unit tests in CI
**Type:** Technical task · **Area:** CI/CD · **Priority:** P1 · **Parents:** OPS-I01 / OPS-E02 · **Dependencies:** STAB-003,STAB-004 · **Blocked:** CI-002,SEC-001,SEC-002,SEC-003 · **Complexity:** M · **Risk:** Low · **Milestone:** M7 · **Release:** First production release · **Labels:** `ci`, `testing`

### Brief description
Add least-privilege GitHub Actions for locked installs, format/lint/type checks, unit tests and builds with safe caches and no deployment secrets on PRs.

**Modules:** `.github/workflows/ci.yml`. **Database/API:** None. **Security:** High—workflow permissions. **Acceptance:** [ ] both modules validated. [ ] actions pinned/version-reviewed. [ ] fork PR has no secrets/write token. [ ] failures block merge. **Tests:** workflow run on PR branch. **DoD:** Standard DoD.

## CI-002 — Validate migrations and integration tests in CI
**Type:** Test · **Area:** CI/CD · **Priority:** P0 · **Parents:** OPS-I01 / OPS-E02 · **Dependencies:** CI-001,DEVOPS-003 · **Blocked:** production release · **Complexity:** M · **Risk:** Medium · **Milestone:** M7 · **Release:** First production release · **Labels:** `ci`, `database`, `priority:P0`

### Brief description
Provision ephemeral MySQL, apply migrations from empty state, seed generated fixtures, run integration/concurrency tests, and detect schema drift.

**Modules:** CI workflow/test harness. **Database:** Test-only. **API:** None. **Security:** Medium. **Acceptance:** [ ] no manual DB required. [ ] migrations and tests pass repeatedly. [ ] temporary credentials are masked. [ ] drift fails build. **Tests:** workflow itself. **DoD:** Standard DoD.

## CI-003 — Build images and validate Compose in CI
**Type:** Technical task · **Area:** CI/CD · **Priority:** P1 · **Parents:** OPS-I01 / OPS-E02 · **Dependencies:** DEVOPS-001,DEVOPS-002 · **Blocked:** SEC-004 · **Complexity:** S · **Risk:** Low · **Milestone:** M7 · **Release:** First production release · **Labels:** `ci`, `docker`

### Brief description
Build frontend/API images and validate development/production Compose using dummy secrets without publishing on ordinary PRs. Produce traceable image metadata.

**Modules:** CI workflow, Docker/Compose. **Database/API:** None. **Security:** Medium. **Acceptance:** [ ] clean images build. [ ] all Compose profiles parse. [ ] publishing requires protected event/approval. **Tests:** CI build/config job. **DoD:** Standard DoD.

## SEC-001 — Enable dependency update and vulnerability review
**Type:** Security task · **Area:** Security · **Priority:** P1 · **Parents:** OPS-I01 / OPS-E02 · **Dependencies:** CI-001 · **Blocked:** production release · **Complexity:** S · **Risk:** Medium · **Milestone:** M7 · **Release:** First production release · **Labels:** `security`, `dependencies`

### Brief description
Configure Dependabot for both npm modules and Actions, run lockfile audits, define severity/build thresholds, ownership, exception expiry and remediation workflow.

**Modules:** Dependabot/workflow/security docs. **Database/API:** None. **Security:** High. **Acceptance:** [ ] ecosystems covered. [ ] high/critical policy documented. [ ] exceptions time-bound. [ ] local commands documented. **Tests:** sample/update and CI audit run. **DoD:** Standard DoD.

## SEC-002 — Add CodeQL static analysis
**Type:** Security task · **Area:** Security · **Priority:** P1 · **Parents:** OPS-I01 / OPS-E02 · **Dependencies:** CI-001 · **Blocked:** production release · **Complexity:** S · **Risk:** Low · **Milestone:** M7 · **Release:** First production release · **Labels:** `security`, `codeql`

### Brief description
Run CodeQL JavaScript/TypeScript analysis with least permissions on PR/push/schedule. Document triage and avoid adding overlapping SAST until evidence requires it.

**Modules:** security workflow/docs. **Database/API:** None. **Security:** High. **Acceptance:** [ ] scans both modules. [ ] findings visible/owned. [ ] high/critical unresolved findings block release. **Tests:** successful workflow and test alert/known query verification. **DoD:** Standard DoD.

## SEC-003 — Add Gitleaks secret scanning
**Type:** Security task · **Area:** Security · **Priority:** P0 · **Parents:** OPS-I01 / OPS-E02 · **Dependencies:** CI-001 · **Blocked:** production release · **Complexity:** S · **Risk:** High · **Milestone:** M7 · **Release:** First production release · **Labels:** `security`, `secrets`, `priority:P0`

### Brief description
Scan current tree and relevant Git history for secrets, with reviewed fingerprints for false positives. Revoke/rotate any confirmed credential before documenting remediation.

**Modules:** security workflow/Gitleaks config/docs. **Database/API:** None. **Security:** Critical. **Acceptance:** [ ] history scan runs. [ ] confirmed secrets rotated, not merely deleted. [ ] allowlist reviewed and minimal. [ ] CI fails on new leak. **Tests:** harmless synthetic detector fixture. **DoD:** Standard DoD.

## SEC-004 — Scan images and configuration with Trivy
**Type:** Security task · **Area:** Security · **Priority:** P1 · **Parents:** OPS-I01 / OPS-E02 · **Dependencies:** CI-003 · **Blocked:** production release · **Complexity:** S · **Risk:** Medium · **Milestone:** M7 · **Release:** First production release · **Labels:** `security`, `container`, `trivy`

### Brief description
Use Trivy for built-image OS/package vulnerabilities and Compose/config misconfiguration, with pinned DB/cache behavior and documented severity threshold. Do not duplicate with Grype/Checkov absent a coverage gap.

**Modules:** security workflow/config/docs. **Database/API:** None. **Security:** High. **Acceptance:** [ ] both images/config scanned. [ ] fixable high/critical findings gate release. [ ] exception process time-bound. **Tests:** CI scan and local command. **DoD:** Standard DoD.

## SEC-005 — Lint Dockerfiles with Hadolint
**Type:** Security task · **Area:** Security · **Priority:** P2 · **Parents:** OPS-I01 / OPS-E02 · **Dependencies:** DEVOPS-001 · **Blocked:** None · **Complexity:** XS · **Risk:** Low · **Milestone:** M7 · **Release:** First production release · **Labels:** `security`, `docker`

### Brief description
Lint all Dockerfiles and document narrowly justified ignores. This complements image scanning by checking build-file practices.

**Modules:** Dockerfiles, CI/security config. **Database/API:** None. **Security:** Medium. **Acceptance:** [ ] every Dockerfile scanned. [ ] no blanket ignores. [ ] local command documented. **Tests:** CI lint run. **DoD:** Standard DoD.

## DEPLOY-001 — Select a deployment platform from verified constraints
**Type:** Research spike · **Area:** Deployment · **Priority:** P1 · **Parents:** OPS-I01 / OPS-E03 · **Dependencies:** DEVOPS-002 · **Blocked:** DEPLOY-002,DEPLOY-003,DEPLOY-004 · **Complexity:** M · **Risk:** Medium · **Milestone:** M8 · **Release:** First production release · **Labels:** `deployment`, `research`

### Brief description
Compare current official pricing/limits for a private home host, low-cost VPS, and low-maintenance managed split against MySQL persistence, backup, TLS, logging and OCR needs. Publish three profiles and one decision; never choose on “free tier” marketing alone.

**Modules:** deployment comparison/ADR. **Database/API:** None. **Security:** High. **Acceptance:** [ ] official dated sources cited. [ ] monthly cost/limits/egress/sleep/backups assessed. [ ] OCR/Ollama feasibility explicit. [ ] follow-ups refined. **Tests:** pricing/source review. **DoD:** Decision approved.

## DEPLOY-002 — Create immutable deployment and rollback scripts
**Type:** Technical task · **Area:** Deployment · **Priority:** P1 · **Parents:** OPS-I01 / OPS-E03 · **Dependencies:** DEPLOY-001,DEVOPS-003,DEVOPS-004 · **Blocked:** DEPLOY-006 · **Complexity:** M · **Risk:** High · **Milestone:** M8 · **Release:** First production release · **Labels:** `deployment`, `operations`

### Brief description
Deploy explicit image tags with preflight, backup, migration, health and smoke gates; record and restore the prior tag on failure. Scripts stop on errors, are repeatable, and never print secrets.

**Modules:** `scripts/deploy.sh`, `rollback.sh`, platform config. **Database:** Controlled migration. **API:** None. **Security:** High. **Acceptance:** [ ] immutable version required. [ ] failed health rolls back app. [ ] DB rollback policy is safe/explicit. [ ] repeated run idempotent. **Tests:** staging deployment/failure smoke tests. **DoD:** Standard DoD.

## DEPLOY-003 — Create encrypted backup and verified restore scripts
**Type:** Technical task · **Area:** Operations · **Priority:** P0 · **Parents:** OPS-I01 / OPS-E03 · **Dependencies:** STAB-001,DEPLOY-001 · **Blocked:** DEPLOY-005,DEPLOY-006 · **Complexity:** M · **Risk:** High · **Milestone:** M8 · **Release:** First production release · **Labels:** `backup`, `operations`, `priority:P0`

### Brief description
Create consistent least-privilege MySQL dump, checksum, encryption, retention and off-host copy scripts plus a guarded restore script and scheduled isolated restore rehearsal.

**Modules:** backup/restore scripts and storage config. **Database:** Backup/restore. **API:** None. **Security:** Critical. **Acceptance:** [ ] secrets not logged. [ ] retention/off-host copy configured. [ ] restore verifies schema/counts/checksum. [ ] RPO/RTO measured. **Tests:** scheduled restore rehearsal. **DoD:** Standard DoD plus successful evidence.

## DEPLOY-004 — Configure HTTPS, secrets and secure remote access
**Type:** Security task · **Area:** Deployment · **Priority:** P0 · **Parents:** OPS-I01 / OPS-E03 · **Dependencies:** DEPLOY-001,AUTH-006 · **Blocked:** production release · **Complexity:** M · **Risk:** High · **Milestone:** M8 · **Release:** First production release · **Labels:** `deployment`, `security`, `priority:P0`

### Brief description
Configure trusted HTTPS, strict proxy headers, protected secret injection and the chosen access profile. Prefer Tailscale plus app authentication initially; public exposure requires completed auth/security gates.

**Modules:** reverse proxy/platform/Tailscale configuration. **Database:** None. **API:** Proxy behavior. **Security:** Critical. **Acceptance:** [ ] valid TLS and redirect. [ ] secrets absent from images/repo/logs. [ ] origin/proxy tests pass. [ ] unauthorized remote client denied. **Tests:** TLS/header/access smoke tests. **DoD:** Standard DoD.

## DEPLOY-005 — Add monitoring and backup-failure alerts
**Type:** Story · **Area:** Monitoring · **Priority:** P1 · **Parents:** OPS-I01 / OPS-E03 · **Dependencies:** DEVOPS-004,DEPLOY-003 · **Blocked:** DEPLOY-006 · **Complexity:** M · **Risk:** Medium · **Milestone:** M8 · **Release:** First production release · **Labels:** `monitoring`, `operations`

### Brief description
Monitor uptime/readiness, restarts, disk/database capacity and backup age/result with actionable low-cost alerts. Logs are structured, rotated and redacted.

**Modules:** monitoring config/logger/runtime. **Database:** Query-only. **API:** Health endpoints only. **Security:** High—sensitive logs. **Acceptance:** [ ] simulated outage/disk/backup failure alerts. [ ] no financial payload/token in logs. [ ] retention documented. **Tests:** alert drills and log-redaction tests. **DoD:** Standard DoD.

## DEPLOY-006 — Publish and validate the production operations runbook
**Type:** Documentation · **Area:** Operations · **Priority:** P1 · **Parents:** OPS-I01 / OPS-E03 · **Dependencies:** DEPLOY-002,DEPLOY-003,DEPLOY-005 · **Blocked:** production release · **Complexity:** M · **Risk:** Medium · **Milestone:** M8 · **Release:** First production release · **Labels:** `documentation`, `operations`

### Brief description
Document start/stop/restart, deploy/rollback, logs/health, migration failure, secret rotation/revocation, backup/restore testing, disk incidents, dependency/image updates, critical vulnerabilities, and OCR failure. Validate procedures in staging.

**Modules:** `docs/operations/RUNBOOK.md`, root README. **Database:** Operational only. **API:** None. **Security:** High. **Acceptance:** [ ] every required incident procedure has commands/owner/expected result. [ ] no secrets embedded. [ ] second-person dry run succeeds. **Tests:** tabletop and staging drills. **DoD:** Standard DoD.

## GitHub Projects configuration

Create fields: Status, Priority, Type, Area, Initiative, Epic, Milestone, Complexity, Risk, Release impact, Target iteration, Dependencies. Status values: `Backlog`, `Ready`, `In progress`, `In review`, `Blocked`, `Done`, `Cancelled`.

Views: Roadmap by milestone; board by status; grouped by initiative; grouped by epic; security work; deployment readiness; receipt processing; P0/P1; blocked items; migration work; current iteration.

## Dependency validation

All dependency and blocked IDs in the index resolve to defined atomic items except the literal `production release`, which is a release gate rather than an issue ID and is not used as a dependency. No circular dependency was found. Items only depend on the same or an earlier enabling milestone; M1 domain work may be scheduled before M2, but ownership-dependent items explicitly wait for `AUTH-002`.

### Critical path
See `ROADMAP.md`: recovery baseline → migration baseline → reproducible tests → financial posting → auth/authorization → secure Compose/CI → platform/deploy/restore/TLS → runbook.

### Parallelizable work
Quality scripts, environment documentation, financial specification, auth design, container review, and OCR research fixtures are separable after their explicit prerequisites.

### Migration checkpoints
MC0–MC5 in `architecture/GAP_ANALYSIS.md` are required project release gates.

### Release blockers
Every P0 plus production container, CI/security scanning, platform/TLS/backup/monitoring/runbook work blocks remote production.

### Post-MVP items
Receipt/OCR items, advanced consumption analytics, semantic matching, Ollama and brand retirement can be postponed.

### Breaking changes
Authentication, versioned pagination, posted immutability, beneficiary field deprecation, and controlled migration startup require coordinated compatibility releases.
