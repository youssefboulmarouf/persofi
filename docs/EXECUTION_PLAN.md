# Persofi - Necessity-Based Execution Plan

> Revised: 2026-09-28
> Scope: single-user personal finance application used locally.
> Primary objective: make transaction capture easy enough for regular use without compromising balance correctness.

## 1. Authority and Scope

This is the active delivery plan. It incorporates the useful findings from earlier technical review and the consolidated operations guide while removing dependencies that are unnecessary for the current local, single-user product.

Authentication, household, hardened deployment, and public-production recommendations are conditional future work rather than prerequisites for transaction UX or receipt import.

## 2. Product Outcomes

The active plan is successful when:

- A simple manual expense can be entered and processed in under 20 seconds.
- Detailed item entry no longer opens a separate modal for every item.
- A typical receipt can be reviewed and confirmed in under 60 seconds.
- AI output always starts as an editable, unprocessed draft.
- Financial totals are checked deterministically before confirmation.
- Saving, processing, retrying, or failing cannot apply a balance more than once.
- Previously confirmed store and product aliases reduce repeated corrections.
- Uncertain mappings are highlighted instead of silently guessed.
- Backup and restore continue to work after receipt data is introduced.
- The app remains responsive with the current transaction history.

## 3. Necessity Decisions

| Workstream | Placement | Reason |
|---|---|---|
| Repository stabilization STAB-001 to STAB-006 | Complete | Migrations, tests, quality scripts, environment contract, and shared Prisma client are already verified |
| Deterministic financial posting | Now | Save & Process and receipt confirmation must not corrupt balances |
| Atomic create, update, and process | Now | Required for retries and failure recovery |
| Refund limits and processed immutability | Now | Protects personal financial history |
| Quick manual entry | Now | Current usability problem has already stopped regular use |
| Optional itemization and inline rows | Now | Removes the largest manual-entry bottleneck |
| Hosted receipt extraction | Now, after manual entry | Fastest path to useful receipt assistance |
| Receipt reconciliation and aliases | Now | Required for trustworthy review and repeated-use speed |
| Targeted caching and recent-first loading | Now where measured | Directly affects entry responsiveness |
| Broad dashboard enhancements | Later | Do not solve the adoption bottleneck |
| Local OCR benchmark and worker | Triggered future | Hosted extraction must be evaluated first |
| Authentication and household ownership | Triggered future | Needed only for remote or multi-user access |
| Beneficiary domain redesign | Triggered future | Current transaction-level person is sufficient until mixed-person items are needed |
| Hardened containers, scanners, monitoring, TLS | Triggered future | Needed for remote production, not trusted local use |
| Full audit events and reversal subsystem | Triggered future | Useful for compliance or multiple users, not required for the first personal release |
| Custom OCR training | Triggered future | Premature before provider and alias accuracy are measured |

## 4. Completed Foundation - M0

The following work is complete and must remain green:

- STAB-001: clean database baseline, backup, and restore evidence.
- STAB-002: tracked non-destructive Prisma migration baseline.
- STAB-003: disposable MySQL integration-test harness.
- STAB-004: backend and frontend lint/type gates.
- STAB-005: documented environment contract and production startup validation.
- STAB-006: shared Prisma client and graceful disconnect.

Before each schema phase:

1. Run the existing type, lint, and backend test gates.
2. Use tracked additive Prisma migrations.
3. Take a current backup before changing retained data.
4. Verify export and restore whenever backup schema changes.

Do not recreate completed stabilization work as new backlog items.

## 5. Target User Flows

### Manual Flow

    New Transaction
          |
          v
    Manual Entry
          |
          +---- Quick expense: date, account, total
          |
          +---- Optional store, person, tax, category, notes
          |
          +---- Optional inline item rows
          |
          +---- Save Draft
          |
          +---- Save & Process atomically

### Receipt Flow

    Receipt image or PDF
          |
          v
    Validate upload and detect exact duplicate
          |
          v
    Hosted provider returns strict draft schema
          |
          v
    Deterministic amount reconciliation
          |
          v
    Store and product candidate matching
          |
          v
    Side-by-side user review
          |
          +---- Save Draft / retry / finish manually
          |
          +---- Confirm and process atomically
                         |
                         v
                  Remember aliases

The extraction provider has no financial-write authority and never supplies Persofi entity IDs.

## 6. Active Delivery Plan

### Phase 1 - Financial Guardrails

Goal: make the existing transaction lifecycle safe enough to support one-click processing and receipt confirmation.

#### Step 1 - Specify the Posting Matrix (S)

Adapt FIN-001 to the local scope.

- Document signed balance effects for expense, income, transfer, credit payment, refund, and initial balance.
- Define valid source and destination account combinations.
- Define how credit balances are represented.
- Define refund eligibility and remaining refundable amount.
- Define currency behavior; do not aggregate or transfer across currencies without explicit support.
- Add pure unit tests for every rule before changing processing code.

Deliverable: one approved posting matrix used by services, tests, and dashboard formulas.

#### Step 2 - Centralize Decimal-Safe Effect Calculation (M)

Adapt FIN-002 and the relevant part of DOM-007.

- Replace binary floating-point equality checks with currency-aware comparisons.
- Calculate signed balance effects in one pure service.
- Keep financial total independent from item coverage.
- Calculate item allocation and unallocated amount without making itemization a validity requirement.
- Preserve raw values at API boundaries consistently.

Avoid a schema migration unless persisted itemization status proves necessary; initially derive NOT_ITEMIZED, PARTIAL, NEEDS_REVIEW, and COMPLETE from item coverage and validation.

#### Step 3 - Make Writes Atomic (M)

Adapt FIN-004 and FIN-006.

- Wrap transaction creation, item creation, balance effects, and processed-state updates in one Prisma database transaction.
- Update an unprocessed transaction and replace its items in one database transaction.
- Roll back all changes when validation or balance processing fails.
- Add an application operation for create-and-process used by Save & Process.
- Keep Save Draft as a separate unprocessed path.

#### Step 4 - Add Retry and History Protection (M)

Use the necessary parts of FIN-003, FIN-005, and FIN-008.

- Reject editing or deleting processed transactions.
- Reject processing an already processed transaction without changing balances.
- Add an idempotency mechanism to create-and-process and receipt confirmation.
- Prevent refunds above the original remaining eligible amount.
- Test repeated requests, mid-operation failures, and all transaction types.
- Defer audit-event tables, general concurrency infrastructure, and reversal workflows.

Exit criteria:

- Every transaction type has deterministic tests.
- Failed writes leave no transaction, item, or balance partial state.
- Repeating Save & Process cannot duplicate balance effects.
- Processed transactions are immutable.

### Phase 2 - Manual Entry Rescue

Goal: restore daily usefulness before depending on AI.

#### Step 5 - Add a Transaction Entry Workspace (M)

Adapt DOM-008 without the household/beneficiary expansion.

- Add a dedicated responsive transaction-entry route or full-width workspace.
- Present Manual Entry and Scan Receipt as primary actions.
- Default to Expense and keep less common transaction types compact.
- Reuse the workspace for editing drafts and viewing processed transactions.
- Keep the existing dialogs temporarily until workflow parity is verified.

#### Step 6 - Implement Quick Expense Entry (M)

- Require only date, pay account, and financial total.
- Make store, person, tax, category, notes, and detailed items optional.
- Allow subtotal and tax to be entered directly without requiring item rows.
- Remember the last account and person locally.
- Rank recent accounts and stores before the full list.
- Default date to today and focus the first incomplete required field.

The backend already stores transaction totals independently from item rows. Do not introduce a summary item solely to satisfy the UI.

#### Step 7 - Add Inline Optional Itemization (M)

- Replace the per-item modal with editable rows.
- Support description, quantity, unit price, line total, category, variant, and brand.
- Support add, duplicate, remove, and quick-clear actions.
- Recalculate row totals and coverage immediately.
- Display allocated and unallocated amounts.
- Preserve an unmapped raw description.
- Use stable client row IDs and keyboard-friendly focus movement.

Direct product links and beneficiary-per-item fields remain future work unless the current variant/category model blocks real receipts.

#### Step 8 - Add Save Draft and Save & Process (S)

- Connect Save Draft to the unprocessed transaction path.
- Connect Save & Process to the atomic operation from Phase 1.
- Keep buttons in stable positions and disable them only with a visible reason.
- Show field-level and form-level server errors.
- Preserve entered data after recoverable failures.

#### Step 9 - Remove Immediate List Friction (S)

- Fix newest-first transaction ordering.
- Add a visible Draft status/filter.
- Update React Query caches narrowly after create, update, process, and delete.
- Add practical stale times for reference data.
- Remove duplicate account/store/person/product subscriptions in nested forms.
- Measure load and mutation time before undertaking broader pagination work.

Exit criteria:

- A simple expense can be entered and processed in under 20 seconds.
- Itemized entry has no nested item dialog.
- Manual income, transfer, credit payment, and refund still work.
- An API failure does not discard the form.
- The old entry dialog can be removed after parity verification.

Release checkpoint: ship and use the manual workflow before starting or while prototyping receipt extraction.

### Phase 3 - Receipt Foundation and Hosted Extraction

Goal: convert a receipt into a safe editable draft without creating financial records.

#### Step 10 - Build the Receipt Evaluation Set (S)

Adapt SPIKE-001, but use it first to evaluate the hosted provider.

- Collect 20 to 50 representative receipts from commonly used stores.
- Include clear, blurry, long, taxed, discounted, weighted-item, and multi-page examples.
- Record expected merchant, date, totals, adjustments, and item lines.
- Keep real unsanitized fixtures outside Git.
- Define field-level accuracy and review-time measurements.

#### Step 11 - Define the Strict Draft Contract (S)

Adapt REC-001.

Include:

- Schema version and provider metadata.
- Raw merchant name and optional address.
- Date, time, and currency.
- Subtotal, tax, discounts, fees, tips, and grand total.
- Raw item description, quantity, unit price, discount, and line total.
- Per-field warnings or confidence where available.
- Parsing and reconciliation warnings.

Validate the provider response at runtime. Reject output that does not match the schema.

#### Step 12 - Add Receipt Draft Persistence (M)

Use the receipt-draft and alias requirements defined in this plan.

Add models equivalent to:

- ReceiptImport: status, temporary image path, hash, extraction payload, warnings, timestamps, and optional transaction link.
- StoreAlias: normalized merchant text and confirmed store.
- ProductAlias: optional store scope, normalized item text, and confirmed variant/category/brand.

Statuses:

    UPLOADED -> EXTRACTING -> REVIEW_REQUIRED -> CONFIRMED
                           -> FAILED
                           -> ABANDONED

Keep these models single-user. Do not add userId or householdId until the access model changes.

#### Step 13 - Implement the Extraction Provider Boundary (M)

Adapt REC-007 without requiring a local worker.

- Define ReceiptExtractionProvider.extract(input): ReceiptExtraction.
- Implement one hosted multimodal provider using image/file input and strict structured output.
- Keep provider-specific code behind the interface.
- Configure API key, model, timeout, and size limits through backend environment variables.
- Retry only safe transient failures.
- Do not pass database records or allow tool calls that can mutate Persofi.

#### Step 14 - Add Safe Local Upload Handling (M)

Use the necessary local subset of REC-002.

- Add POST /api/receipt-imports for JPEG, PNG, WebP, and PDF.
- Validate signature, MIME type, size, dimensions, and page count.
- Generate a random private temporary filename.
- Compute SHA-256 before extraction.
- Add GET /api/receipt-imports/:id and DELETE /api/receipt-imports/:id.
- Limit extraction concurrency so a large receipt cannot block normal API use.
- Do not add malware infrastructure or enterprise quarantine tooling for local use.

#### Step 15 - Build the Review Workspace (L)

Adapt REC-006.

- Display receipt and editable draft side by side on desktop.
- Use an ergonomic stacked layout on mobile.
- Reuse the Phase 2 transaction fields and inline item rows.
- Show extraction state, warnings, and retry/fallback actions.
- Allow the user to switch a failed import into manual entry without retyping extracted values.
- Never expose a direct AI-to-process action.

Exit criteria:

- A supported receipt creates a reviewable draft.
- Invalid provider output is rejected safely.
- Extraction failure can be retried or completed manually.
- No extraction path changes balances.

### Phase 4 - Reconciliation, Duplicates, and Mapping Memory

Goal: make receipt review accurate and faster with use.

#### Step 16 - Add Deterministic Reconciliation (M)

Adapt REC-005 and DOM-007.

- Check quantity times unit price against line total.
- Check line totals, discounts, and adjustments against subtotal.
- Check subtotal, tax, fees, tips, and discounts against grand total.
- Apply currency-aware tolerance.
- Show coverage and unallocated amount.
- Block confirmation for unresolved required financial mismatches.
- Allow an explicit acknowledgement for legitimate receipt exceptions and record the warning.

#### Step 17 - Add Duplicate Detection (S)

- Treat equal file hash as an exact duplicate candidate.
- Score likely duplicates using store, date, total, and item similarity.
- Show the existing receipt/transaction before proceeding.
- Allow an explicit override for legitimate similar purchases.
- Never block only because one weak field matches.

#### Step 18 - Add Store and Product Matching (M)

Adapt REC-004.

Store matching:

- Confirmed alias.
- Normalized exact store name.
- Ranked fuzzy candidates.
- Quick store creation.

Item matching:

- Confirmed store-specific product alias.
- Confirmed global alias.
- Normalized exact description.
- Ranked fuzzy candidates.
- Optional AI candidate ranking.
- Quick variant/category mapping or unresolved raw description.

AI may rank existing candidates but may not invent IDs or create entities.

#### Step 19 - Confirm, Process, and Learn Atomically (M)

- Convert the reviewed draft to the normal transaction contract.
- Atomically create the transaction, items, accepted aliases, and balance effects.
- Link the ReceiptImport to the created transaction.
- Apply the Phase 1 idempotency rule.
- Learn aliases only from confirmed choices.
- Keep the draft reviewable when confirmation fails.

#### Step 20 - Complete Image and Backup Lifecycle (S)

- Delete confirmed images by default after transaction creation.
- Retain extraction text, warnings, hash, aliases, and transaction link.
- Add configurable cleanup for failed and abandoned imports.
- Include receipt metadata and aliases in export and restore.
- Verify a backup round trip after the migration.
- Never place receipt images in Git or a public static directory.

Exit criteria:

- Required arithmetic mismatches are visible before confirmation.
- Exact and likely duplicates are surfaced.
- Familiar stores and products reuse confirmed aliases.
- Typical receipt review completes in under 60 seconds.
- Backup and restore preserve receipt metadata and mappings.

Release checkpoint: enable receipt entry for regular use and collect correction data before adding more matching sophistication.

### Phase 5 - Measured Performance and Acceptance

Goal: address demonstrated bottlenecks and prove the workflow solved the original problem.

#### Step 21 - Add Server-Side Queries Where Needed (M)

Implement only when current measurements show the full-history fetch is material.

- Add recent-first pagination and date/type/status/account/store/person filters.
- Keep dashboard aggregation endpoints separate from list endpoints.
- Add GET /api/balances/latest for current account balances.
- Keep historical balance pagination separate.
- Add indexes based on actual query plans, not hypothetical scale.

#### Step 22 - Run Accuracy and Usability Acceptance (M)

Measure:

- Manual simple-expense time.
- Manual itemized-expense time.
- Receipt review time.
- Merchant/date/subtotal/tax/total exact accuracy.
- Line-item amount accuracy.
- Percentage of mappings resolved by confirmed aliases.
- Corrections per receipt.
- Failure and retry rate by store and image quality.
- Transaction list and mutation response time.

Do not use one provider confidence score as the acceptance criterion.

#### Step 23 - Release, Observe, and Simplify (S)

- Use the new workflow for several weeks.
- Review abandoned drafts, unmapped items, and repeated corrections.
- Adjust extraction instructions and matching thresholds from evidence.
- Remove fields or steps that do not help confirmation.
- Remove the legacy transaction/item dialogs after parity and recovery are proven.
- Promote later work only when a documented trigger is met.

Final exit criteria:

- Manual and receipt-assisted targets are met.
- No critical financial-processing or backup regressions remain.
- The application is comfortable enough for regular personal use.

## 7. Future Phases and Activation Triggers

### F1 - Reporting and Convenience

Activate after the entry workflow meets its targets:

- Historical balance by account type.
- Monthly cash flow.
- Expense by debit/credit and parent category.
- Tax history.
- Net-worth history.
- CSV export.
- Budgets and price comparisons.

### F2 - Local OCR

Activate if hosted extraction fails cost, privacy, availability, latency, or accuracy targets:

1. Benchmark local engines against the same receipt set.
2. Compare exact financial fields, line items, runtime, memory, and maintenance.
3. Implement only the selected adapter behind ReceiptExtractionProvider.
4. Preserve the same strict draft and review contract.

### F3 - Shared Access and Beneficiaries

Activate if another person needs an account or mixed-person item allocation becomes common:

- Authentication and secure sessions.
- Household ownership and object authorization.
- Default and item-level beneficiaries.
- Backward-compatible person-field migration.
- Protected backup/restore and browser request controls.

### F4 - Remote Production Operations

Activate before access from the public internet:

- Hardened containers and internal database networking.
- Least-privilege credentials and managed secrets.
- Controlled migrations, HTTPS, health checks, monitoring, and rollback.
- Encrypted off-host backup and restore rehearsals.
- CI migration, integration, image, dependency, secret, and configuration gates.

### F5 - Advanced Audit and Reversal

Activate when multiple users, compliance, or detailed correction history requires it:

- Immutable balance-effect records.
- Audit events.
- Reversal and replacement workflow.
- Optimistic versions, locks, and concurrency tests.
- Explicit exchange-rate records.

## 8. Backlog Traceability

The architecture backlog is incorporated as follows:

- STAB-001 through STAB-006: completed foundation.
- FIN-001 through FIN-006 and the essential FIN-008 tests: active Phase 1.
- FIN-007 and advanced concurrency/audit portions of FIN-008: F5.
- DOM-005, DOM-007, and the quick-entry portion of DOM-008: active Phases 1 and 2.
- DOM-001 through DOM-004 beneficiary work: F3.
- DOM-006 direct product redesign: deferred unless receipt mapping proves it necessary.
- REC-001 through REC-006: active Phases 3 and 4, narrowed for local use.
- SPIKE-001 and local REC-007: F2; hosted provider implementation is active Phase 3.
- AUTH-001 through AUTH-006: F3 or F4 depending on trigger.
- DEVOPS, CI, SEC, and DEPLOY issues: F4, except existing local test and backup safeguards.

## 9. Recommended First Release Boundary

The first useful release ends after Phase 2:

- Financial posting guardrails.
- Fast manual transaction workspace.
- Optional inline itemization.
- Save Draft and atomic Save & Process.
- Error recovery and narrow cache improvements.

The first receipt release ends after Phase 4:

- One hosted extraction provider.
- Strict receipt drafts.
- Side-by-side review.
- Deterministic reconciliation.
- Duplicate detection.
- Store and product aliases.
- Atomic confirmation and verified backup support.

Do not delay either release for authentication, household ownership, local OCR, dashboards, public deployment, or comprehensive security automation.
