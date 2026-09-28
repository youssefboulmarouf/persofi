# Persofi Future Enhancements

## Purpose

Persofi is a single-user personal finance application intended primarily for local use. The roadmap is ordered by necessity: first make transaction entry trustworthy and pleasant enough for daily use, then add receipt assistance, then improve reporting and infrastructure only when real usage justifies it.

This file is the product-priority backlog. The detailed delivery sequence is in EXECUTION_PLAN.md. The consolidated operations guide provides supporting evidence; this backlog and the execution plan are authoritative.

## Decision Rules

A feature belongs in the active plan only when it directly supports one of these outcomes:

- Faster manual transaction entry.
- Trustworthy financial balances and refunds.
- Human-reviewed receipt import.
- Reliable recovery of local financial data.
- Responsiveness at the current data volume.

Move work to the future when it is needed only for multiple users, public internet access, enterprise operations, or hypothetical scale.

## Completed Foundation

The repository stabilization work summarized in OPERATIONS.md is complete:

- STAB-001: clean baseline and restore evidence.
- STAB-002: non-destructive Prisma migration baseline.
- STAB-003: reproducible MySQL integration-test harness.
- STAB-004: backend and frontend lint/type gates.
- STAB-005: environment-variable contract and startup validation.
- STAB-006: one shared Prisma client per API process.

These capabilities are prerequisites to preserve, not work to repeat.

## Now - Release 1: Trustworthy and Fast Manual Entry

### Financial Integrity Required by the New Workflow

- Define one deterministic posting rule for every transaction type.
- Use decimal-safe calculations and currency-aware tolerances.
- Create transaction items, balance effects, and processed state atomically.
- Make Save & Process safe to retry without applying balances twice.
- Update unprocessed transactions atomically.
- Prevent editing or deleting processed transactions.
- Validate refund eligibility and prevent refunds above the remaining amount.
- Add focused integration tests for expense, income, transfer, credit payment, refund, retry, and failure rollback.

A full audit-event and reversal subsystem is not required for Release 1. Processed records remain immutable; complex reversal workflows are future work.

### Optional Itemization

- Store the financial transaction total independently from item rows.
- Allow a valid expense without detailed product itemization.
- Track a small itemization state: NOT_ITEMIZED, PARTIAL, NEEDS_REVIEW, or COMPLETE.
- Preserve raw item descriptions even when no product mapping exists.
- Calculate allocated and unallocated amounts rather than pretending partial itemization is complete.
- Keep existing category, product variant, and brand links backward compatible.
- Defer beneficiary schema redesign unless mixed-person purchases become a real need.

### Manual Entry Experience

- Provide two primary actions: Manual Entry and Scan Receipt.
- Replace nested transaction and item dialogs with a focused transaction workspace.
- Require only date, pay account, and total for the shortest expense path.
- Make store, person, tax, category, notes, and itemization optional.
- Edit item descriptions, quantities, prices, categories, and product mappings inline.
- Remember the last account and person and prioritize recent stores.
- Support keyboard navigation and useful default focus.
- Provide Save Draft and Save & Process actions.
- Show actionable validation and API errors in the interface.
- Preserve manual flows for income, transfer, credit payment, and refund.
- Show newest transactions first and make drafts easy to resume.

## Now - Release 2: Receipt-Assisted Entry

### Receipt Capture and Extraction

- Accept JPEG, PNG, WebP, and PDF receipts from desktop or mobile camera upload.
- Validate file signature, type, size, dimensions, and PDF page count.
- Store uploads temporarily using random private filenames.
- Compute a file hash for exact duplicate detection.
- Extract merchant, date, currency, subtotal, tax, discounts, fees, tips, total, and line items.
- Use a provider-independent ReceiptExtractionProvider interface.
- Start with one hosted multimodal vision provider using strict structured output.
- Keep provider credentials only in the backend.
- Treat all extracted values as untrusted draft data.

### Review and Reconciliation

- Display the receipt beside an editable transaction draft.
- Highlight missing, uncertain, inconsistent, duplicate, and unmapped fields.
- Verify quantity times unit price against each line total.
- Verify items and adjustments against subtotal.
- Verify subtotal, tax, fees, tips, and discounts against grand total.
- Require explicit user confirmation before creating or processing a transaction.
- Never allow the extractor to write financial records directly.
- Preserve a failed extraction so the user can retry or finish manually.

### Mapping Memory

- Normalize merchant and item text without discarding the raw value.
- Map confirmed merchant aliases to stores.
- Map confirmed store-specific item aliases to variants, categories, and brands.
- Prefer confirmed aliases, then exact matches, then ranked fuzzy candidates.
- Never let AI invent database IDs or automatically create products.
- Allow quick store/product creation during review.
- Allow ambiguous items to remain unresolved.
- Learn aliases only from user-confirmed corrections.

### Receipt Data Ownership

- Persist receipt draft status, extraction metadata, warnings, hash, and optional transaction link.
- Add receipt and alias records to backup and restore.
- Delete confirmed receipt images by default while retaining extraction text and mappings.
- Clean up abandoned temporary images after a configurable retention period.

## Next - Release 3: Measured Responsiveness and Convenience

Implement these after Releases 1 and 2 are usable, or earlier when measurements show they block entry:

- Give mutable React Query data a short stale time and reference data a longer stale time.
- Update or invalidate only affected cache entries after mutations.
- Remove duplicate data subscriptions in nested forms.
- Add server-side recent-first transaction filtering and pagination.
- Add filters for date, type, status, account, store, and person.
- Add a latest-balance-per-account endpoint.
- Separate dashboard history queries from current-balance queries.
- Preserve unsaved drafts across accidental navigation where practical.
- Add receipt extraction retry and cleanup controls.
- Add CSV transaction export.

## Later - Reporting

Resume reporting work only after transaction-entry success measures are met:

- Historical balances grouped by account type.
- Monthly expense versus income.
- Expense split by debit versus credit.
- Expense grouped by parent category.
- Tax paid total and tax history.
- Historical net worth.
- Itemization coverage and unallocated-spending reports.
- Monthly budget envelopes and budget-versus-actual reporting.
- Store and product price comparisons.

## Future Work Activated by a Real Trigger

### Local OCR

Trigger: hosted extraction is too costly, unavailable, too slow, or unacceptable for privacy.

- Benchmark Tesseract, PaddleOCR, docTR, and suitable local vision models on representative receipts.
- Select an adapter only from measured field accuracy and operational cost.
- Run local extraction with time, memory, file, and output limits.
- Keep the same receipt-draft contract and review workflow.

### Authentication and Household Ownership

Trigger: the app becomes remotely accessible or supports more than one user/household.

- Add secure sessions and credential lifecycle.
- Add household ownership and object-level authorization.
- Protect backup and restore operations.
- Add CSRF, restrictive CORS, throttling, and secure HTTP policy.
- Add default and per-item beneficiary fields if shared purchases require them.

### Remote Production Deployment

Trigger: the application moves beyond a trusted local machine/network.

- Harden non-root production images and internal networking.
- Use least-privilege database credentials and managed secrets.
- Run migrations as controlled deployment jobs.
- Add HTTPS, health checks, monitoring, alerts, immutable releases, and rollback.
- Add encrypted off-host backups and scheduled restore rehearsals.
- Add CI build, migration, integration, image, dependency, secret, and configuration gates.

### Advanced Financial Audit

Trigger: correction history, compliance, or multi-user accountability requires it.

- Add immutable balance effects and audit events.
- Replace manual corrections with reversal and replacement workflows.
- Add optimistic versions, row locking, and concurrency tests.
- Add explicit exchange-rate records before aggregating currencies.

### Custom OCR or Autonomous Import

Trigger: off-the-shelf extraction and alias learning cannot meet measured needs.

- Consider custom model training only after a labeled receipt dataset exists.
- Keep autonomous financial posting out of scope unless a separate risk decision explicitly approves it.

## Explicitly Not Required Now

- Authentication for trusted local single-user operation.
- Household and role management.
- Public internet deployment.
- Kubernetes, n8n, or a distributed service architecture.
- Comprehensive security-scanner pipelines.
- A custom-trained OCR model.
- A local OCR worker before hosted extraction is evaluated.
- Full financial audit/reversal infrastructure.
- Additional dashboard polish before entry usability is validated.

Basic safeguards remain mandatory: preserve backups, protect provider keys, validate uploaded files, use tracked migrations, and keep financial writes atomic.
