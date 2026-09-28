# Persofi - Execution Plan

> Revised: 2026-09-28
> Primary objective: remove transaction-entry friction and restore regular use of the application.

## 1. Outcome and Success Measures

Persofi should make both manual and receipt-assisted entry quick, predictable, and safe to confirm.

The first release is successful when:

- A simple manual expense can be entered and processed in under 20 seconds.
- A typical receipt can be reviewed and confirmed in under 60 seconds.
- Receipt imports always begin as unprocessed drafts.
- Required fields and financial totals are deterministically validated before confirmation.
- Previously confirmed store and product aliases are reused automatically.
- Ambiguous mappings are visibly flagged rather than silently guessed.
- The transaction list remains responsive as history grows.
- Existing transaction processing and backup behavior remain covered by tests.

## 2. Current State

### Working Today

- CRUD flows exist for transactions, accounts, people, stores, categories, products, variants, and brands.
- Expense, income, transfer, credit payment, refund, and initial-balance processing exist.
- Expense items support descriptions, quantities, prices, categories, variants, and brands.
- Dashboard, balance history, filters, database export, and database restore exist.
- Backend unit and integration test suites cover core transaction behavior.

### Main Bottlenecks

- Each expense item is entered through a separate modal.
- Manual expenses effectively require itemization because subtotal is derived from item rows.
- Saving and processing require separate actions.
- The transaction form exposes many fields before the user needs them.
- The transaction list fetches the full history and paginates only in the browser.
- Mutations invalidate and reload broad datasets.
- Reference data is repeatedly queried without an explicit caching policy.
- Transaction ordering is inconsistent with the intended newest-first behavior.
- Errors are often logged rather than explained in the UI.
- Receipt capture, extraction, review, duplicate detection, and mapping memory do not exist.

## 3. Product and Technical Decisions

### Workflow Decisions

- Scan Receipt and Manual Entry are equal entry points.
- AI extraction creates a receipt draft, not a transaction of record.
- Only the user can confirm and process an imported transaction.
- Simple manual expenses do not require detailed product itemization.
- Product, category, and brand mappings remain optional, but unresolved values are visible.
- The default confirmation action is Save & Process; Save Draft remains available.

### AI and OCR Decisions

- Begin with a hosted multimodal vision provider to minimize infrastructure and tuning work.
- Hide the provider behind a ReceiptExtractionProvider interface so it can be replaced.
- Require structured output that matches a versioned receipt-extraction schema.
- Never ask the model to invent Persofi database IDs.
- Perform store and product matching inside Persofi after extraction.
- Keep provider credentials in backend environment variables only.
- Benchmark the provider against real receipts before expanding the feature.

### Data Decisions

- Store money in the existing decimal-backed database fields.
- Perform arithmetic checks in application code using decimal-safe comparisons.
- Save raw merchant and item descriptions even when mappings are confirmed.
- Store confirmed aliases separately from products and stores.
- Keep receipt images only while a draft is under review by default.
- Include receipt metadata and aliases in database backups.

## 4. Target Workflow

    Receipt photo or PDF
            |
            v
    Upload and image preparation
            |
            v
    Structured AI extraction
            |
            v
    Deterministic arithmetic validation
            |
            v
    Store and product candidate matching
            |
            v
    Side-by-side user review
            |
            +---- Save Draft
            |
            +---- Confirm, create, and process transaction
                        |
                        v
                 Remember corrections

## 5. Delivery Plan

### Phase 0 - Baseline and Guardrails

Goal: establish measurable examples and protect existing behavior before changing the entry flow.

#### Step 1 - Build a Representative Test Set (S)

- Collect 20 to 50 receipts from frequently used stores.
- Include clear, blurry, long, discounted, taxed, weighted-item, and multi-page examples.
- Remove or mask information that should not be sent to a hosted provider.
- Define expected merchant, date, totals, and line items for each receipt.
- Keep test images outside Git unless they are intentionally sanitized fixtures.

#### Step 2 - Capture Baseline Entry Friction (S)

- Record the clicks and time required for a simple expense and an itemized expense.
- Note fields that are commonly skipped or repeatedly use the same value.
- Use the results to choose defaults and validate the success measures.

#### Step 3 - Protect Core Processing (S)

- Add regression coverage for create, update, process, refund, and backup behavior affected by the new flow.
- Fix floating-point equality in TransactionValidator.
- Add a processed-transaction deletion guard.
- Correct transaction ordering to newest first.

Exit criteria:

- Baseline timings and receipt fixtures are documented.
- Core transaction tests cover behavior the redesign will reuse.

### Phase 1 - Manual Entry Rescue

Goal: make Persofi useful again without depending on OCR.

#### Step 4 - Introduce a Transaction Entry Workspace (M)

- Replace the nested expense/item dialog experience with a responsive entry page or full-width workspace.
- Present Scan Receipt and Manual Entry as primary actions.
- Keep transaction-type selection compact and move uncommon types out of the expense path.
- Preserve editing and read-only viewing for existing transactions.

#### Step 5 - Add Quick Expense Entry (M)

- Require only date, pay account, and total for the shortest valid expense path.
- Make store, person, tax, category, notes, and detailed items optional.
- If no detailed items are supplied, create one summary item using the entered total and optional category.
- Remember the last pay account and person locally.
- Rank recent stores and accounts first.

#### Step 6 - Replace Item Modals with Inline Editing (M)

- Add editable rows for description, quantity, unit price, line total, category, and product mapping.
- Support add, duplicate, and remove row actions without leaving the form.
- Recalculate totals immediately.
- Support keyboard movement between cells.
- Use stable row IDs so edits do not cause table rows to remount.

#### Step 7 - Add Atomic Save and Process (M)

- Add a backend operation that creates and processes a transaction atomically.
- Roll back transaction, items, and balances when processing fails.
- Expose Save Draft and Save & Process in the UI.
- Return structured validation errors and display them next to the affected section.

Exit criteria:

- A simple manual expense can be entered and processed in under 20 seconds.
- Detailed manual entry no longer opens a modal per item.
- Existing transaction types still work.

### Phase 2 - Receipt Extraction Vertical Slice

Goal: turn one uploaded receipt into an editable, unprocessed draft.

#### Step 8 - Define the Extraction Contract (S)

Create a versioned schema containing:

- Merchant raw name and optional address.
- Transaction date, time, and currency.
- Subtotal, tax, discounts, fees, tips, and grand total.
- Line-item raw description, quantity, unit price, discount, and line total.
- Optional extraction confidence and warnings per field.
- Provider name, schema version, and extraction timestamp.

#### Step 9 - Add Receipt Import Persistence (M)

Add Prisma models equivalent to:

- ReceiptImport: status, image path, image hash, raw extraction JSON, warnings, timestamps, and optional transaction ID.
- StoreAlias: normalized merchant text and confirmed store ID.
- ProductAlias: store scope, normalized item text, and confirmed variant/category/brand IDs.

Suggested import statuses:

    UPLOADED -> EXTRACTING -> REVIEW_REQUIRED -> CONFIRMED
                           -> FAILED

#### Step 10 - Implement the Provider Boundary (M)

- Define ReceiptExtractionProvider.extract(input): ReceiptExtraction.
- Implement the first hosted vision provider using image input and strict structured output.
- Validate the provider response at runtime before returning it to the client.
- Add timeout, size, type, and retry handling.
- Keep the API key in the backend environment.

#### Step 11 - Add Upload and Extraction Endpoints (M)

- POST /api/receipt-imports uploads an image or PDF and starts extraction.
- GET /api/receipt-imports/:id returns status and the current draft.
- DELETE /api/receipt-imports/:id abandons a draft and removes its temporary image.
- Accept JPEG, PNG, WebP, and PDF within a configured size limit.
- Compute an image hash before extraction for duplicate detection.

#### Step 12 - Add the First Review Screen (M)

- Display the receipt and editable extracted fields side by side on desktop.
- Stack the receipt and fields ergonomically on mobile.
- Reuse the inline item editor from Phase 1.
- Keep the result unprocessed and require explicit confirmation.

Exit criteria:

- A supported receipt produces an editable draft.
- Provider failures do not lose the uploaded draft or block manual entry.
- No AI-generated transaction is automatically processed.

### Phase 3 - Validation and Mapping Memory

Goal: make receipt review trustworthy and faster with repeated use.

#### Step 13 - Add Deterministic Receipt Validation (M)

- Validate quantity times unit price against line total.
- Validate item totals plus discounts and adjustments against subtotal.
- Validate subtotal, tax, fees, and tips against grand total.
- Use explicit currency precision and tolerances.
- Highlight mismatches and block confirmation only for required financial inconsistencies.
- Allow the user to acknowledge legitimate receipt exceptions.

#### Step 14 - Add Duplicate Detection (S)

- Detect exact duplicate image hashes.
- Detect likely duplicates using store, date, total, and item similarity.
- Show the existing transaction before the user chooses to continue.
- Record an override when the user confirms similar receipts are distinct.

#### Step 15 - Add Store Matching (S)

- Normalize merchant text for casing, punctuation, branch numbers, and common suffixes.
- Prefer confirmed StoreAlias records.
- Fall back to exact and fuzzy store-name candidates.
- Allow store creation without leaving the review workflow.
- Save the confirmed alias after successful confirmation.

#### Step 16 - Add Product and Category Matching (L)

- Prefer confirmed ProductAlias records scoped to the matched store.
- Fall back to normalized exact matches and ranked fuzzy candidates.
- Use AI suggestions only to rank candidates, never to create IDs.
- Let the user confirm, change, create, or leave a mapping unresolved.
- Save confirmed corrections for future receipts.

#### Step 17 - Confirm and Process the Draft (M)

- Convert the reviewed receipt draft into the existing transaction contract.
- Create the transaction, items, alias corrections, and balance changes atomically.
- Link the ReceiptImport to the resulting transaction.
- Delete the image after confirmation by default while retaining extraction metadata.
- Invalidate only affected frontend queries.

Exit criteria:

- All financial mismatches are visible before confirmation.
- Familiar stores and items reuse confirmed mappings.
- Ambiguous mappings remain under user control.
- Typical receipt review completes in under 60 seconds.

### Phase 4 - Responsiveness and Operational Reliability

Goal: remove technical delays from the new workflow and growing history.

#### Step 18 - Share the Prisma Client (S)

- Create one application-level Prisma client.
- Update services to reuse it.
- Add graceful disconnect behavior for tests and shutdown.

#### Step 19 - Cache Reference Data (S)

- Give accounts and mutable financial data a short React Query staleTime.
- Give stores, people, categories, products, and brands a longer staleTime.
- Update or invalidate only the affected entity after mutations.
- Remove duplicate hook subscriptions where parent data can be passed down.

#### Step 20 - Add Server-Side Transaction Queries (M)

- Support limit, cursor or offset, date range, type, status, account, store, and person.
- Load recent transactions first.
- Keep dashboard aggregation needs separate from transaction-list pagination.
- Add database indexes only where query measurements justify them.

#### Step 21 - Improve Latest-Balance Loading (S)

- Add GET /api/balances/latest returning the latest row per account.
- Stop loading full balance history when only current balances are required.
- Retain a separate paginated/history endpoint for charts.

#### Step 22 - Harden Errors and Recovery (M)

- Add visible retry states for extraction and normal API failures.
- Preserve unsaved manual and receipt drafts across accidental navigation where practical.
- Make extraction retries idempotent.
- Verify export and restore after adding receipt and alias tables.
- Add configurable receipt-image cleanup for abandoned drafts.

Exit criteria:

- Entry screens do not wait on complete transaction or balance history.
- A failed extraction can be retried or completed manually.
- Backups include all non-image data needed to restore mappings and drafts.

### Phase 5 - Evaluation and Release

Goal: prove that the redesigned workflow solves the original usability problem.

#### Step 23 - Run the Receipt Evaluation (M)

Measure against the Phase 0 fixture set:

- Exact merchant, date, subtotal, tax, and total accuracy.
- Line-item description and amount accuracy.
- Percentage of items correctly auto-mapped from confirmed aliases.
- Average corrections and review time per receipt.
- Extraction failures by image quality and store.

Do not use a single overall confidence score as the release criterion. Financial-field accuracy and review time matter more.

#### Step 24 - Usability Acceptance Pass (S)

- Time repeated manual and receipt-assisted entries.
- Verify desktop and mobile layouts.
- Test keyboard-only manual entry.
- Confirm that error messages explain how to recover.
- Remove fields or steps that do not help confirmation.

#### Step 25 - Release and Observe (S)

- Enable the receipt workflow for normal use.
- Keep manual entry immediately accessible.
- Review unmapped items and extraction corrections after several weeks.
- Adjust aliases, prompts, and matching thresholds using observed corrections.

Exit criteria:

- Manual and receipt-assisted workflows meet target times.
- No critical transaction-processing or backup regressions remain.
- The application is comfortable enough to resume regular use.

## 6. Later Reporting Backlog

Resume these only after transaction-entry success measures are met:

1. Historical balances grouped by account type.
2. Monthly expense versus income chart.
3. Expense split by credit versus debit.
4. Expense grouped by parent category.
5. Tax total and tax history.
6. Historical net worth.
7. CSV export.
8. Monthly budget envelopes.

## 7. Explicitly Deprioritized Work

- Authentication and multi-user authorization.
- Advanced network and database security for a local-only deployment.
- A custom-trained OCR model.
- Autonomous transaction processing without review.
- Dashboard expansion before entry usability is validated.

Basic safeguards still remain mandatory: keep provider keys on the backend, preserve backups, validate uploaded file types and sizes, and protect transaction integrity.

## 8. Recommended First Release Scope

The smallest valuable release consists of:

- Phase 0 guardrails.
- Phase 1 manual-entry redesign.
- One receipt extraction provider.
- Receipt review with deterministic total validation.
- Store aliases and basic product aliases.
- Explicit Save Draft and Save & Process actions.
- Duplicate detection.

Defer advanced fuzzy matching, local OCR, analytics, and budget features until this release has been used with real receipts.
