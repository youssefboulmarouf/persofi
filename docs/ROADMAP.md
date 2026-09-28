# Persofi Roadmap

> Revised: 2026-09-28
> Product scope: personal, single-user, local-first finance application.

## Direction

The roadmap is ordered by necessity rather than by architectural completeness.

1. Protect financial correctness.
2. Make manual entry fast enough for daily use.
3. Add human-reviewed receipt extraction.
4. Learn mappings and remove repeated corrections.
5. Optimize only the bottlenecks demonstrated by use.
6. Activate security, local OCR, or remote operations only when their trigger exists.

The detailed tasks and acceptance criteria are in [EXECUTION_PLAN.md](EXECUTION_PLAN.md). Product priorities and deferred capabilities are in [FUTURE_ENHANCEMENTS.md](FUTURE_ENHANCEMENTS.md).

## Current Position

| Stage | Status | Outcome |
|---|---|---|
| M0 - Repository stabilization | Complete | Recoverable baseline, migrations, test harness, quality gates, environment contract, shared Prisma client |
| R1A - Financial guardrails | Next | Deterministic, atomic, retry-safe transaction processing |
| R1B - Manual entry rescue | Planned | Quick expense entry, optional inline items, Save Draft, Save & Process |
| R2A - Receipt foundation | Planned | Hosted extraction into strict, editable drafts |
| R2B - Receipt trust and learning | Planned | Reconciliation, duplicate detection, aliases, atomic confirmation |
| R3 - Measured optimization | Planned | Pagination, latest balances, and cache work justified by measurements |
| F1-F5 - Triggered future tracks | Deferred | Reporting, local OCR, shared access, remote operations, advanced audit |

## Release 1 - Trustworthy Manual Entry

Goal: make Persofi useful again without requiring AI.

### R1A - Financial Guardrails

- Approve a posting matrix for every transaction type.
- Centralize decimal-safe signed balance effects.
- Make create, item replacement, process, and create-and-process atomic.
- Make retries idempotent.
- Prevent editing or deleting processed transactions.
- Enforce remaining refundable amount.
- Cover all rules and rollback paths with integration tests.

Release gate:

- A failed operation leaves no partial transaction, item, or balance state.
- Repeating the same process request cannot apply balances twice.
- Every supported transaction type passes deterministic posting tests.

### R1B - Manual Entry Rescue

- Add a dedicated responsive transaction workspace.
- Require only date, account, and total for a quick expense.
- Keep store, person, tax, category, notes, and itemization optional.
- Replace item dialogs with inline rows.
- Show allocated and unallocated amounts.
- Remember common defaults and rank recent choices.
- Add Save Draft and atomic Save & Process.
- Preserve entered data after recoverable errors.
- Fix newest-first ordering and expose drafts clearly.
- Apply narrow query caching improvements.

Release gate:

- A simple expense can be entered and processed in under 20 seconds.
- Detailed entry opens no nested item modal.
- Income, transfer, credit payment, and refund remain functional.
- The legacy form is removed only after parity is verified.

## Release 2 - Receipt-Assisted Entry

Goal: turn a receipt into a trustworthy draft that is faster to review than entering manually.

### R2A - Receipt Foundation

- Build a representative receipt evaluation set.
- Define and runtime-validate a strict extraction schema.
- Add ReceiptImport, StoreAlias, and ProductAlias persistence.
- Introduce a provider-independent extraction interface.
- Implement one hosted multimodal provider.
- Validate receipt type, signature, size, dimensions, and page count.
- Hash and store uploads temporarily using private random names.
- Add upload, status, abandon, and retry endpoints.
- Build side-by-side desktop and mobile review.

Release gate:

- A supported receipt produces an editable draft.
- Invalid extraction output is rejected.
- Failure can be retried or completed manually.
- Extraction cannot create transactions or alter balances.

### R2B - Trust, Confirmation, and Learning

- Reconcile item arithmetic and receipt totals deterministically.
- Show coverage, unallocated amounts, and required mismatches.
- Detect exact and likely duplicates.
- Match stores and products using confirmed aliases first.
- Allow quick entity creation or unresolved raw descriptions.
- Confirm the reviewed draft through the normal atomic posting path.
- Learn aliases only from confirmed choices.
- Delete confirmed images by default.
- Add receipt metadata and aliases to backup and restore.

Release gate:

- Required amount mismatches are visible before confirmation.
- Familiar receipt labels reuse confirmed mappings.
- A typical receipt is reviewed and confirmed in under 60 seconds.
- Backup and restore preserve mappings and receipt metadata.

## Release 3 - Measured Optimization

Goal: address observed delays without designing for hypothetical scale.

Candidate work:

- Recent-first server pagination and transaction filters.
- Latest-balance-per-account endpoint.
- Separate current-balance and history queries.
- Query-plan-driven indexes.
- Draft persistence across accidental navigation.
- Receipt cleanup and retry controls.
- CSV transaction export.

Promotion rule:

A candidate enters active work only when timing, query volume, failure frequency, or repeated user friction demonstrates the need.

## Critical Path

    M0 complete
       |
       v
    Posting matrix
       |
       v
    Decimal-safe effect calculator
       |
       v
    Atomic and retry-safe processing
       |
       v
    Quick manual entry and inline items
       |
       v
    Manual Release 1
       |
       v
    Strict receipt draft and hosted provider
       |
       v
    Review, reconciliation, duplicates, aliases
       |
       v
    Receipt Release 2
       |
       v
    Measured optimization

Receipt dataset preparation and extraction-contract design may proceed while manual UX is built. Receipt confirmation cannot ship before atomic processing is complete.

## Future Tracks

### F1 - Reporting and Convenience

Trigger: Releases 1 and 2 meet their usability targets.

- Monthly cash flow and tax history.
- Historical balances and net worth.
- Expense grouping and itemization coverage.
- Budgets, CSV export, and price comparisons.

### F2 - Local OCR

Trigger: hosted extraction misses cost, privacy, latency, availability, or accuracy targets.

- Benchmark local engines on the same receipt set.
- Select by exact financial-field accuracy and maintenance cost.
- Add only the winning adapter behind the existing provider interface.

### F3 - Shared Access and Beneficiaries

Trigger: another user or household needs access, or mixed-person item allocation becomes frequent.

- Authentication and secure sessions.
- Household ownership and object authorization.
- Default and item-level beneficiaries.
- Protected backup and browser request controls.

### F4 - Remote Production Operations

Trigger: access moves beyond a trusted local machine or network.

- Hardened containers and internal networking.
- Least-privilege credentials and managed secrets.
- Controlled migrations, HTTPS, monitoring, and rollback.
- Encrypted off-host backups and CI/security gates.

### F5 - Advanced Audit and Reversal

Trigger: multiple users, compliance, or detailed correction history requires it.

- Immutable balance effects and audit events.
- Reversal and replacement workflows.
- Concurrency controls and exchange-rate records.

## Scope Guardrails

Do not delay Release 1 or Release 2 for:

- Authentication or household ownership.
- Local OCR.
- Public deployment.
- Kubernetes, n8n, or distributed services.
- Comprehensive scanner pipelines.
- Custom OCR training.
- Dashboard expansion.
- Full audit and reversal infrastructure.

Always preserve:

- Tracked migrations.
- Restorable backups.
- Backend-only provider credentials.
- Upload limits and private temporary storage.
- Atomic financial writes.
- Human confirmation of extracted receipts.
