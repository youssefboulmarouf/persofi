# Release 1 Tasks — Trustworthy Manual Entry

> Created: 2026-09-28
> Covers: R1A Financial Guardrails (Execution Plan steps 1–4) and R1B Manual Entry Rescue (steps 5–9).
> Source of truth for scope and acceptance: [EXECUTION_PLAN.md](../EXECUTION_PLAN.md) and [ROADMAP.md](../ROADMAP.md). This file breaks that scope into implementable tasks.

## How to Use

- Work top to bottom unless a task says it can run in parallel.
- Before every task, run the M0 gates: `scripts/run-backend-tests.sh`, plus `lint`, `typecheck` and `format:check` in `app/` and `client/`.
- Schema changes use a new additive Prisma migration. Take a JSON backup (Settings → Export) before applying one to retained data.
- Tick the checkbox when all of the task's acceptance criteria pass. Record decisions in the task itself.

Size: S ≈ under half a day, M ≈ 1–2 days, L ≈ 3+ days.

## Known Defects in the Current Code

These were found while writing the tasks. Each one is assigned to a task below.

| # | Defect | Location | Task |
|---|---|---|---|
| D1 | Money is parsed with `Number()` and compared with `!==`, so a valid expense like `0.1 + 0.2 = 0.3` fails validation | `TransactionJson.from`, `BalanceJson.from`, `TransactionValidator.mustEq` | R1-02 |
| D2 | Processing is not atomic: balance rows are written one by one and `processed` is set last. A failure halfway (e.g. the second leg of a transfer) leaves partial balances and an unprocessed transaction that can be processed again | `TransactionService.processTransaction` | R1-06 |
| D3 | Two concurrent process requests both pass the `isProcessed()` check and apply the balances twice | `TransactionService.processTransaction` | R1-06 |
| D4 | `update` checks `processed` on the request body, not the database, so a client can edit a processed transaction by sending `processed: false` | `TransactionService.update` | R1-05 |
| D5 | `update` deletes items, updates the transaction and inserts items as three separate writes; a failure can leave a transaction with no items | `TransactionService.update` | R1-05 |
| D6 | The latest balance is chosen by transaction date only. Processing a back-dated transaction writes a row older than the current latest, so its effect is silently lost from the next calculation. Ties on the same date are non-deterministic | `BalanceService.getLatestBalanceOfAccount` | R1-04 |
| D7 | Refunds are not checked against the original: `refundOfId` may point to any transaction, and the total refunded is unlimited | `TransactionValidator.validateRefund`, processor | R1-08 |
| D9 | `GET /api/transactions` has no ordering | `TransactionService.get` | R1-18 |
| D10 | `INIT_BALANCE` detects "no balance yet" by matching an error message string | `processInitBalanceTransaction` | R1-03 |
| D11 | Two *different* transactions processed at the same time on the same account both read the same latest balance and each append a new row from it, so one effect is lost. Two refunds of the same expense processed at the same time can both pass the remaining-amount check | `BalanceService`, processor | R1-06, R1-08 |

---

## Phase 1 — Financial Guardrails (R1A)

Goal: create, update and process are deterministic, atomic, retry-safe and covered by tests. Phase 2 cannot ship Save & Process until this phase passes its gate.

### [x] R1-01 — Specify the Posting Matrix (S)

Plan: Step 1 / FIN-001. Depends on: nothing.

Write `docs/POSTING_MATRIX.md` and get it approved before changing any processing code.

- For each type (Expense, Income, Transfer, Credit_Payment, Refund, Init_Balance), list the required and forbidden fields, the allowed account types for pay and counterparty, and the signed effect on each account.
- Credit representation: record the current convention (a credit balance is positive debt; an expense increases it and a payment reduces it) and confirm it.
- Which field holds the amount: Expense and Refund use `grandTotal`; the others use `amount`. Confirm this or unify it.
- Refund rules: the original must be a processed Expense. Decide which accounts a refund may credit (the original pay account only, or any account). Define "remaining refundable" (grand total minus processed refunds; decide whether draft refunds count).
- Currency is out of scope for Release 1. Treat all account amounts as the same currency/unit; do not add currency checks or conversions. Multi-currency support is deferred.
- Init_Balance: at most one per account, and it must be the account's first balance. Decide whether zero or negative starting balances are allowed (the validator currently rejects them, but a credit card can start at 0).
- Back-dating policy for D6: decide whether processing a transaction dated before the account's latest balance is (a) rejected, or (b) allowed, with the new row inserted in order and later rows recomputed. Recommendation: (a) for Release 1, because (b) belongs to F5.

Acceptance:
- The matrix covers every type × account-type combination, including rejected ones.
- The open decisions above are resolved and written down.

### [x] R1-02 — Decimal-Safe Money Type (M)

Plan: Step 2 / FIN-002. Depends on: R1-01. Fixes: D1.

- Add a money utility in `app/src/utilities/` built on `Prisma.Decimal`: parse, add, subtract, compare, round to 2 dp, and serialize.
- Use it for all **backend financial calculations**: validator comparisons, balance effects (R1-03), allocation (R1-03), latest-balance arithmetic, and remaining-refundable (R1-08).
- Replace `mustEq`, `mustGt0` and the other comparisons in `TransactionValidator` with decimal comparisons.
- Reject money inputs with more than 2 decimal places or values outside `Decimal(10,2)`.
- **API format is unchanged:** money fields are sent and received as JSON numbers with at most 2 decimals, as today. Parse them into `Decimal` at the boundary (`TransactionJson.from`, `BalanceJson.from`) and convert back to numbers only when serializing responses. No client type changes are part of this task.
- Out of scope: the client's own arithmetic. Client-side totals are display-only, and the backend is authoritative (see R1-13 and R1-15).

Acceptance:
- Unit tests pass for `0.1 + 0.2 = 0.3`, `19.99 + 1.50 = 21.49`, values near the column limit, and precision rejection.
- The validator, effect calculator, allocation, balance and refund code in `app/src` does no money arithmetic or comparison with JS `number`.
- Existing API tests pass with no change to the response shape.

### [x] R1-03 — Pure Balance-Effect Calculator (M)

Plan: Step 2 / FIN-002, DOM-007. Depends on: R1-01, R1-02. Fixes: D10.

- Add a pure function, e.g. `computeBalanceEffects(transaction, accountsById) → { accountId, delta }[]`, that implements the matrix exactly. It must not call Prisma.
- Move account-type and Init_Balance checks into it (or a sibling pure validator). Return typed errors instead of matching message strings.
- Change `TransactionProcessorService` to apply the computed deltas instead of doing arithmetic per type.
- Add a pure `computeAllocation(transaction)` that returns allocated, unallocated and the derived itemization status (`NOT_ITEMIZED | PARTIAL | NEEDS_REVIEW | COMPLETE`). Items never affect financial validity.

Acceptance:
- Table-driven unit tests cover every row of the matrix, including rejections.
- The existing processing integration tests pass unchanged.

### [x] R1-04 — Deterministic Latest Balance (S)

Plan: Step 2. Depends on: R1-01 (back-dating decision). Fixes: D6.

- Order the latest balance by `id desc` so same-day postings follow processing order.
- Apply the back-dating policy from R1-01. If it is "reject", processing fails with a clear 409 when the transaction calendar day is before the latest balance calendar day for any affected account.
- Add an integration test for back-dated processing and for two transactions on the same date.

### [x] R1-05 — Transaction-Scoped Services and Atomic Create/Update (M)

Plan: Step 3 / FIN-004. Depends on: R1-02. Fixes: D4, D5.

- Let services run inside a Prisma interactive transaction. For example, an optional `tx: Prisma.TransactionClient` parameter on `BaseService` methods, or a unit-of-work helper, while keeping the single shared client from `utilities/prisma.ts`.
- `create`: insert the transaction and its items in one database transaction. This is already a nested create, so confirm it and keep it that way.
- `update`: load the existing row from the database inside the transaction. Reject it if the stored row is processed (ignore `processed` in the body). Replace items and update fields in one `$transaction`.
- Check that IDs referenced by `refundOfId`, `storeId`, `personId`, the accounts, and the items' variant/brand/category exist, and return 400 rather than a raw FK error.

Acceptance:
- A PUT with `processed: false` on a processed transaction returns 400/409 and changes nothing.
- An injected failure during item insert leaves the original transaction and its items unchanged.

### [x] R1-06 — Atomic, Race-Safe Processing (M)

Plan: Step 3 / FIN-004, FIN-006. Depends on: R1-03, R1-04, R1-05. Fixes: D2, D3, D11 (balances).

- Put the whole of `processTransaction` in one interactive `$transaction`.
- Claim the transaction first with `updateMany({ where: { id, processed: false }, data: { processed: true } })`. If the count is 0, reject with "already processed" and write nothing.
- Read the latest balances, apply the R1-03 effects and write the balance rows inside the same transaction.
- Any thrown error rolls back the claim and all balance rows.

**Serialization strategy (decided): pessimistic row locks in a fixed order.** This is shared by every processing path (process, create-and-process, update-and-process, refunds).

- Add one helper, e.g. `lockForPosting(tx, { transactionId?, accountIds, refundOfId? })`. Nothing in the database transaction reads data before it, and every step is a locking read:
  1. For an existing transaction (process, update-and-process), lock and read its row: `SELECT ... FROM Transaction WHERE id = ? FOR UPDATE`. This gives the account IDs and `refundOfId`, and replaces the plain `getById` read. For create-and-process, the IDs come from the payload and this step is skipped.
  2. If the transaction is a refund, lock the original expense row: `SELECT id FROM Transaction WHERE id = ? FOR UPDATE`.
  3. Lock every affected account row, sorted by ascending ID: `SELECT id FROM Account WHERE id IN (...) ORDER BY id FOR UPDATE`. For update-and-process, use the union of the stored and new account IDs.
- Then run the claim (`updateMany ... processed: false`), the balance reads and the writes.
- Because the order is always "own transaction row, then original expense, then accounts by ascending ID", two postings can't deadlock each other on these locks.
- Use `tx.$queryRaw` for the locking selects, because Prisma has no `FOR UPDATE` API.
- MySQL runs at REPEATABLE READ, where the snapshot is fixed by the first plain read. Taking the locks first means the snapshot is created only after any competing posting has committed. Also read the latest balances and the refund sum with locking reads (`FOR UPDATE`) as defense in depth, so correctness doesn't depend on statement order alone.
- Rejected alternatives: SERIALIZABLE isolation (gap-lock deadlocks and retry logic for little gain), and optimistic version columns (a schema change and retry loop that F5 owns).
- If a lock wait times out or MySQL reports a deadlock, return 409 and write nothing. The client retries with the same idempotency key.

Acceptance:
- Integration test: a failure injected after the first leg of a transfer leaves no balance rows and `processed = false`.
- Integration test: N parallel `POST /:id/process` calls produce exactly one set of balance rows.
- Integration test: N parallel processes of *different* expenses on the same account leave a final balance equal to the start minus the sum of all of them.
- Integration test: parallel transfers A→B and B→A complete without deadlock errors and leave correct balances.

### [ ] R1-07 — Save & Process Operations with Idempotency (L)

Plan: Step 3–4 / FIN-003, FIN-004. Depends on: R1-05, R1-06.

**Endpoints (decided):**

| Operation | Endpoint | Used by |
|---|---|---|
| Create draft | `POST /api/transactions` (existing) | Save Draft, new |
| Update draft | `PUT /api/transactions/:id` (existing) | Save Draft, existing draft |
| Process stored draft | `POST /api/transactions/:id/process` (existing, made atomic in R1-06) | List "Process" action |
| **Create and process** | `POST /api/transactions/process` | Save & Process, new |
| **Update and process** | `PUT /api/transactions/:id/process` | Save & Process, existing draft |

- **Create and process:** validate, insert the transaction and items, apply balance effects and set `processed = true` in one Prisma interactive transaction.
- **Update and process:** in one Prisma interactive transaction, load the stored row, reject it if processed, replace fields and items, claim it (`processed = false → true`, as in R1-06) and apply the balance effects. If processing fails, the draft keeps its previous stored contents; the edit is not half-saved.
- Both operations reuse the R1-05 update logic and the R1-06 processing logic inside the same `tx`. There are no separate code paths.

**Idempotency:**

- Add an additive migration for a new model:

      IdempotencyRecord {
        key           VARCHAR(64)  unique
        operation     VARCHAR(32)   // e.g. CREATE, UPDATE, CREATE_PROCESS, UPDATE_PROCESS
        requestHash   CHAR(64)      // SHA-256 of the canonical request
        transactionId Int
        createdAt     DateTime
      }

  A separate table (rather than a column on `Transaction`) is used because one transaction can receive several keyed operations: Save Draft, then Save & Process.
- Canonical request: the validated, normalized payload after decimal parsing (R1-02), with money as fixed 2-dp strings, keys sorted, items in submitted order, and the target `:id` and operation included. Hash it with SHA-256.
- The client sends an `Idempotency-Key` header on all four write operations. It is required on the two process operations and optional on draft create/update.
- Write the record in the **same** database transaction as the operation. Then:
  - New key: run the operation and store the record.
  - Same key and same hash: apply nothing and return 200 with the current state of the stored transaction.
  - Same key and different hash or operation: return 409 and apply nothing.
  - Concurrent same key: the unique constraint fails (`P2002`) on the loser. Re-read the record and respond as above.
- A failed operation rolls back its record, so the key is **not** consumed and the client can retry with a corrected payload.
- Records are kept for Release 1 with no cleanup. Pruning is R3 work if the table grows.
- `IdempotencyRecord` is operational data and is not included in backup/restore. Note this in OPERATIONS.md.

Acceptance:
- The same key sent twice to either process endpoint gives one transaction and one set of balance rows.
- The same key with a changed amount returns 409 and changes nothing.
- A validation or processing failure writes nothing (no transaction, items, balances or idempotency record), and the same key then succeeds with a corrected payload.
- Update and process: a failure injected during balance application leaves the draft with its previous fields and items, still unprocessed.
- Parallel requests with the same key produce one result.

### [ ] R1-08 — Refund Eligibility and Limits (S)

Plan: Step 4 / FIN-005. Depends on: R1-01, R1-06. Fixes: D7, D11 (refunds).

- On create, update and process, check that `refundOfId` references a processed Expense and that the refund account follows the R1-01 rule.
- Compute the remaining refundable amount (original grand total minus processed refunds) inside the processing transaction, and reject if the refund would go over it.
- **Serialization:** processing a refund holds the `FOR UPDATE` lock on the original expense row (R1-06 `lockForPosting`) *before* reading the refund sum, and reads the sum with a locking read. Competing refunds of the same expense therefore run one at a time, whatever their idempotency keys, and the second one sees the first one's committed amount.
- The check at create/update is advisory, for fast feedback. The check under the lock at process time is the authoritative one.
- Expose the remaining amount so the refund UI can show it and cap the input: a field on `GET /api/transactions/:id`, or a small endpoint.

Acceptance:
- Tests: a refund of a non-expense is rejected, a refund of an unprocessed expense is rejected, a full refund is accepted, and a refund one cent over the remaining amount is rejected.
- Tests: two partial refunds that together exceed the original are rejected when the second is processed.
- Concurrency test: two refund drafts of the same expense that each fit on their own but together exceed it are processed in parallel with different idempotency keys. Exactly one succeeds, the other is rejected, and the total refunded never exceeds the original grand total. Repeat with create-and-process.

### [ ] R1-09 — Processed Immutability and Error Contract (S)

Plan: Step 4 / FIN-008 essentials. Depends on: R1-05, R1-06.

- Update, delete and process all check `processed` from the database, never from the request.
- Standardize status codes: 400 for validation, 404 for not found, 409 for state conflicts (already processed, idempotency mismatch, back-dating if rejected).
- Make validation errors include a `field` (e.g. `grandTotal`, `items[2].lineTotal`) so Phase 2 can show errors next to fields. Extend `BadRequestError` / `AppError` without breaking existing handlers.

### [ ] R1-10 — Phase 1 Test Completion (M)

Plan: Step 4 / FIN-008 essentials. Depends on: R1-02 … R1-09. Can be written alongside each task.

- Deterministic posting tests for every transaction type and account-type combination in the matrix.
- Rollback tests for create, update, process, create-and-process and update-and-process.
- Repeated-request tests for process, create-and-process and update-and-process, including key reuse with a different payload (409).
- Concurrency tests for double processing, for concurrent postings on the same account, and for concurrent refunds over the limit (R1-06, R1-08).
- Refund limit tests.
- Keep or update the existing tests in `app/tests/`. Don't delete coverage.

### Phase 1 Gate

- [ ] A failed operation leaves no partial transaction, item or balance state.
- [ ] Repeating the same process, create-and-process or update-and-process request cannot apply balances twice.
- [ ] Update-and-process failure leaves the draft exactly as it was stored.
- [ ] Concurrent postings on the same account, and concurrent refunds of the same expense, can't lose balance effects or exceed the refundable amount.
- [ ] Every supported transaction type passes deterministic posting tests.
- [ ] Processed transactions are immutable through every endpoint.
- [ ] `scripts/run-backend-tests.sh` and all quality gates are green.

---

## Phase 2 — Manual Entry Rescue (R1B)

Goal: entering and processing a simple expense takes under 20 seconds, with no nested item dialogs. The existing dialogs stay until parity is verified (R1-20).

### [ ] R1-11 — Baseline Measurements (S)

Plan: Step 9, 22. Depends on: nothing. Can start in parallel with Phase 1.

- Time how long a simple expense and an itemized expense take to enter and process with the current dialogs.
- Record the transaction list load time and the create/process mutation times at the current data volume.
- Save the numbers in this file under "Measurements" so R1-21 can compare against them.

### [ ] R1-12 — Transaction Workspace Route (M)

Plan: Step 5 / DOM-008 (quick-entry portion). Depends on: nothing. Can start in parallel with Phase 1.

- Add routes such as `/transactions/new` and `/transactions/:id` that render a full-width, responsive workspace instead of a dialog.
- Primary actions are **Manual Entry** and **Scan Receipt**. Scan Receipt is shown disabled with a "coming in Release 2" hint.
- Expense is the default type. The other types sit behind a compact selector.
- The same workspace is used to edit drafts and to view processed transactions (read-only, with a Refund action for processed expenses).
- `TransactionDialog`, `TransactionItemDialog` and `TransactionRefundDialog` stay reachable until R1-20.

### [ ] R1-13 — Quick Expense Entry (M)

Plan: Step 6. Depends on: R1-12.

- Required fields: date (defaults to today), pay account, total.
- Optional fields, collapsed by default: store, person, subtotal/tax, notes, category.
- **Totals rule: the total is the source of truth.** It is the number on the receipt and the amount charged to the account.
  - The user always enters **total**, and may optionally enter **tax** (default `0`).
  - **Subtotal is derived** as `total − tax` and shown read-only. It is never typed.
  - Tax must be `≥ 0` and `< total`, so the subtotal stays `> 0` as the validator requires. Otherwise show a field error on tax.
  - The request always sends all three, with `grandTotal = total`, `taxTotal = tax` and `subtotal = total − tax`, computed to 2 dp. The backend re-checks `grandTotal = subtotal + taxTotal` with decimals (R1-02) and remains authoritative.
  - Item rows (R1-15) never change the total. They only affect allocated and unallocated amounts.
- Don't create a summary item.
- On open, focus the first incomplete required field. Enter should submit where that's safe.
- Keyboard-only entry must work from start to finish.

### [ ] R1-14 — Remembered Defaults and Recent Ranking (S)

Plan: Step 6. Depends on: R1-13.

- Remember the last used pay account and person in `localStorage`, wrapped in try/catch and falling back silently.
- In the account and store pickers, show recently used entries (from recent transactions) above the full alphabetical list.

### [ ] R1-15 — Inline Optional Itemization (L)

Plan: Step 7. Depends on: R1-12, R1-03 (allocation logic).

- Editable item rows: description, quantity, unit price, line total, category, variant, brand.
- Row actions: add, duplicate, remove, and a quick-clear for all rows.
- Recalculate line totals as you type. Show allocated, unallocated and the itemization status. Use the same rules as `computeAllocation`, either shared or mirrored and tested on both sides. Client values are display-only, computed in integer cents to avoid float drift; the backend result is authoritative.
- A raw description with no mapping is allowed and kept.
- Use stable client row IDs. Tab and Enter move through a row and create the next one.
- An unallocated amount is informational only. It never blocks Save.

### [ ] R1-16 — Other Transaction Types in the Workspace (M)

Plan: Step 5, exit criteria. Depends on: R1-12, R1-08.

- Move the Income, Transfer, Credit Payment and Refund forms into the workspace, reusing the existing `transaction-forms/*` logic where it fits.
- Refund shows the original transaction and the remaining refundable amount, and caps the input (R1-08).
- Initial balance remains available where it lives today (account setup), or moves into the workspace. Decide which, and note the decision here.

### [ ] R1-17 — Save Draft, Save & Process, and Error Recovery (M)

Plan: Step 8. Depends on: R1-07, R1-09, R1-13.

- **Save Draft** calls `POST /api/transactions` for a new transaction or `PUT /api/transactions/:id` for an existing draft.
- **Save & Process** calls `POST /api/transactions/process` for a new transaction or `PUT /api/transactions/:id/process` for an existing draft. It is always one request; the client never saves and then processes in two calls (R1-07).
- Generate one idempotency key per submission, and reuse it when retrying that same submission. If the user edits the form after a failure, the next submission gets a new key.
- Buttons stay in fixed positions. A disabled button always shows the reason.
- Show server errors next to the matching field (using `field` from R1-09) and as a form-level message.
- Keep the form contents after any recoverable error, including network failures and 409s.
- After success, go to the list or reset for the next entry. Choose one, or offer "Save & New".

### [ ] R1-18 — List Ordering and Drafts (S)

Plan: Step 9. Depends on: nothing on the backend; the UI needs R1-12. Fixes: D9.

- Sort `GET /api/transactions` by `date desc, id desc` on the server. Remove any client re-sorting that conflicts with it.
- Show a Draft/Processed status chip, and add a Draft filter to `TransactionsFilter`.
- Clicking a draft opens it in the workspace to resume.

### [ ] R1-19 — Narrow React Query Caching (S)

Plan: Step 9. Depends on: R1-17.

- Replace the blanket `invalidateQueries(["transactions"])` in `useTransactions.ts` with targeted cache updates after create, update, process and delete. Invalidate `balances` only after process.
- Set a short `staleTime` for transactions and a longer one for reference data (accounts, stores, persons, categories, products, brands).
- Remove duplicate reference-data subscriptions in nested forms. Fetch once in the workspace and pass the data down.
- Measure again against the R1-11 baseline. Server pagination stays in R3 unless the numbers show a problem.

### [ ] R1-20 — Parity Verification and Legacy Removal (S)

Plan: Step 9 exit / Step 23. Depends on: R1-13 … R1-19.

- Checklist: expense (quick and itemized), income, transfer, credit payment, refund (partial and full), initial balance, draft edit, draft delete, processed view, and backup export/restore after the new flows.
- Once every item passes, delete `TransactionDialog`, `TransactionItemDialog`, `TransactionRefundDialog` and any code only they use.

### [ ] R1-21 — Release 1 Acceptance (S)

Plan: Step 22 (manual subset). Depends on: R1-20.

- Measure again: a simple expense takes under 20 seconds, and itemized entry opens no nested dialog.
- Confirm that an API failure does not discard the form.
- Record the results under "Measurements".

### Phase 2 Gate / Release 1 Checklist

- [ ] A simple expense is entered and processed in under 20 seconds.
- [ ] Itemized entry opens no nested item dialog.
- [ ] Income, transfer, credit payment and refund all work in the new workspace.
- [ ] An API failure does not discard the form.
- [ ] The legacy dialogs are removed after parity is verified.
- [ ] Backup export and restore round-trip after all Release 1 migrations.
- [ ] All quality gates and backend tests are green.

---

## Dependency Overview

    R1-01 ─┬─ R1-02 ─┬─ R1-03 ─┬─ R1-06 ─┬─ R1-07 ─┐
           │         │  R1-04 ─┘         ├─ R1-08  │
           │         └─ R1-05 ───────────┴─ R1-09 ─┤
           │                                       ├─ R1-10 ─► Phase 1 gate
           │                                       │
    R1-11, R1-12 (parallel with Phase 1)           │
           R1-12 ─ R1-13 ─ R1-14                   │
                 ├ R1-15 (needs R1-03)             │
                 ├ R1-16 (needs R1-08)             │
                 └ R1-17 (needs R1-07, R1-09) ◄────┘
                       R1-18, R1-19 ─► R1-20 ─► R1-21 ─► Release 1

## Out of Scope for Release 1

Receipt upload and extraction (Release 2), server pagination (R3 unless measured), authentication and households, audit events and reversal workflows (F5), dashboard changes, persisted itemization status (unless derivation proves insufficient), and beneficiary-per-item fields.

## Measurements

| Metric | Baseline (R1-11) | Release 1 (R1-21) | Target |
|---|---|---|---|
| Simple expense, open → processed | | | < 20 s |
| Itemized expense (5 items) | | | — |
| Transaction list load | | | — |
| Create / process mutation | | | — |
