# Persofi Posting Matrix

> Created: 2026-09-28
> Status: **Approved specification for R1-02 through R1-10.**
> Scope: single-user, single-currency, local application.

This document is the single source of truth for how each transaction type affects account balances. The effect calculator (R1-03), validator (R1-02), processor (R1-06) and all tests must implement exactly what is written here.

## 1. Account Types

| Account type | Balance meaning | Example |
|---|---|---|
| Debit | Money available | Checking account |
| Credit | Outstanding debt (positive = owed) | Credit card |
| Cash | Physical money available | Wallet |
| Saving | Money set aside | Savings account |

**Convention:** a Credit account's balance is a positive number representing debt. Spending on a credit card *increases* the balance (more debt). Paying off a credit card *decreases* the balance (less debt). A fully paid credit card has a balance of 0.

## 2. Fields by Transaction Type

"Required" means must not be null and must pass the stated constraint. "Forbidden" means must be null. "Ignored" means the field is accepted but not used in processing.

### Expense

| Field | Rule |
|---|---|
| payAccountId | Required |
| counterpartyAccountId | Forbidden |
| subtotal | Required, > 0 |
| taxTotal | Required, ≥ 0 |
| grandTotal | Required, must equal subtotal + taxTotal |
| amount | Must be 0 |
| storeId | Optional |
| personId | Optional |
| refundOfId | Forbidden |
| items | Optional (itemization is never required) |

Amount field used for posting: **grandTotal**.

### Income

| Field | Rule |
|---|---|
| payAccountId | Forbidden |
| counterpartyAccountId | Required |
| subtotal | Must be 0 |
| taxTotal | Must be 0 |
| grandTotal | Must be 0 |
| amount | Required, > 0 |
| storeId | Forbidden |
| personId | Forbidden |
| refundOfId | Forbidden |
| items | Forbidden (no items on income) |

Amount field used for posting: **amount**.

### Transfer

| Field | Rule |
|---|---|
| payAccountId | Required (source) |
| counterpartyAccountId | Required (destination) |
| subtotal | Must be 0 |
| taxTotal | Must be 0 |
| grandTotal | Must be 0 |
| amount | Required, > 0 |
| storeId | Forbidden |
| personId | Forbidden |
| refundOfId | Forbidden |
| items | Forbidden |

Amount field used for posting: **amount**.

### Credit_Payment

| Field | Rule |
|---|---|
| payAccountId | Required (funding account) |
| counterpartyAccountId | Required (credit account being paid) |
| subtotal | Must be 0 |
| taxTotal | Must be 0 |
| grandTotal | Must be 0 |
| amount | Required, > 0 |
| storeId | Forbidden |
| personId | Forbidden |
| refundOfId | Forbidden |
| items | Forbidden |

Amount field used for posting: **amount**.

### Refund

| Field | Rule |
|---|---|
| payAccountId | Forbidden |
| counterpartyAccountId | Required (must equal the original expense's payAccountId — see §4) |
| subtotal | Required, > 0 |
| taxTotal | Required, ≥ 0 |
| grandTotal | Required, must equal subtotal + taxTotal |
| amount | Must be 0 |
| storeId | Optional |
| personId | Optional |
| refundOfId | Required (must reference a processed Expense — see §4) |
| items | Optional |

Amount field used for posting: **grandTotal**.

### Init_Balance

| Field | Rule |
|---|---|
| payAccountId | Forbidden |
| counterpartyAccountId | Required (the account to initialize) |
| subtotal | Must be 0 |
| taxTotal | Must be 0 |
| grandTotal | Must be 0 |
| amount | Required, ≥ 0 (zero is allowed — see §6) |
| storeId | Forbidden |
| personId | Forbidden |
| refundOfId | Forbidden |
| items | Forbidden |

Amount field used for posting: **amount**.

## 3. Balance Effects (The Posting Matrix)

Each row shows the signed delta applied to the account's balance. "Posting amount" is the field named in §2 for that transaction type.

| Transaction type | Pay account effect | Counterparty account effect |
|---|---|---|
| Expense (Debit/Cash/Saving) | − grandTotal | — |
| Expense (Credit) | + grandTotal (debt increases) | — |
| Income | — | + amount |
| Transfer | − amount | + amount |
| Credit_Payment | − amount | − amount (debt decreases) |
| Refund (Debit/Cash/Saving counterparty) | — | + grandTotal |
| Refund (Credit counterparty) | — | − grandTotal (debt decreases) |
| Init_Balance | — | Sets balance to amount (first row) |

**Reading the signs:**
- Debit, Cash, Saving: positive balance = money you have. Spending subtracts; receiving adds.
- Credit: positive balance = money you owe. Spending adds; paying off or getting a refund subtracts.

## 4. Refund Rules

**Decision: the refund must go back to the account that was originally charged.**

1. `refundOfId` must reference an existing, **processed** Expense transaction.
2. The refund's `counterpartyAccountId` must equal the original expense's `payAccountId`. The money goes back where it came from.
3. **Remaining refundable amount** = original expense's `grandTotal` minus the sum of `grandTotal` across all **processed** refund transactions where `refundOfId` points to the original.
4. The refund's `grandTotal` must be ≤ the remaining refundable amount.
5. **Draft refunds do not count** toward the refunded total. Only processed refunds reduce the remaining amount. This means you can create multiple draft refunds as long as only the ones you process stay within the limit.
6. The remaining-amount check at create/update time is **advisory** (fast feedback for the UI). The authoritative check happens inside the processing transaction under the row lock on the original expense (R1-06, R1-08).

**Rationale:** Allowing refunds to any account adds complexity (which account do you debit for the limit check?) and doesn't match a real refund, which goes back to the original payment method. If a real-world situation needs a different target account, the user can record the refund to the original account and then do a Transfer.

## 5. Allowed Account Types per Transaction Type

| Transaction type | Pay account | Counterparty account |
|---|---|---|
| Expense | Debit, Credit, Cash, Saving | — |
| Income | — | Debit, Cash, Saving |
| Transfer | Debit, Cash, Saving | Debit, Cash, Saving |
| Credit_Payment | Debit, Cash, Saving | Credit |
| Refund | — | Determined by original (same as original's pay account) |
| Init_Balance | — | Debit, Credit, Cash, Saving |

**Rejections:**
- Income to a Credit account is rejected. Income doesn't reduce debt; use Credit_Payment for that.
- Transfer from or to a Credit account is rejected. Moving money out of or into a credit card doesn't make sense as a transfer; use Credit_Payment or Expense.
- Credit_Payment from a Credit account is rejected (paying a credit card with another credit card).
- The pay and counterparty on a Transfer or Credit_Payment must be different accounts.

## 6. Init_Balance Rules

**Decision: zero starting balance is allowed. Negative is not.**

1. An account may have at most one Init_Balance transaction.
2. The account must have no existing balance rows when Init_Balance is processed. (Checked by verifying no Balance record exists for that accountId.)
3. `amount` ≥ 0. Zero is allowed because:
   - A new credit card starts with no debt (balance = 0).
   - A new empty checking account starts with no funds (balance = 0).
4. The Init_Balance processing creates the first Balance row for the account with the amount as the value — it does not add a delta.

**Negative starting balances** are not supported in Release 1. A credit card that already has debt can be initialized at 0 and then have its existing charges recorded as an Expense, or the user can accept the debt isn't tracked before the start date. This avoids the question of what "negative" means for each account type.

## 7. Back-Dating Policy

**Decision: back-dating is rejected in Release 1.**

When processing a transaction, if its UTC calendar day is earlier than the UTC calendar day of the latest Balance row for any affected account, processing is rejected with a 409 Conflict error. Timestamps within a calendar day do not make a transaction back-dated.

Two transactions on the **same calendar day** are allowed, even if their timestamps differ. The latest balance is selected by `id DESC`, which follows processing order and prevents a same-day date-only row at midnight from sorting behind a later timestamp.

**Rationale:** Allowing back-dated transactions requires recalculating every subsequent balance row for the affected accounts. This is the domain of F5 (Advanced Audit and Reversal). For Release 1, the user should process transactions in chronological order. If a past transaction was missed, enter it with today's date and add a note about the actual date. A proper reversal and reprocessing workflow is deferred to F5.

## 8. Amount Field Convention

**Decision: keep the current split. Do not unify.**

| Transaction type | Posting amount field | Other amount fields |
|---|---|---|
| Expense | grandTotal | subtotal > 0, taxTotal ≥ 0 |
| Refund | grandTotal | subtotal > 0, taxTotal ≥ 0 |
| Income | amount | subtotal, taxTotal, grandTotal must all be 0 |
| Transfer | amount | subtotal, taxTotal, grandTotal must all be 0 |
| Credit_Payment | amount | subtotal, taxTotal, grandTotal must all be 0 |
| Init_Balance | amount | subtotal, taxTotal, grandTotal must all be 0 |

Expense and Refund use `grandTotal` because they have a tax breakdown. The others use `amount` because they're simple single-value transactions. Unifying into one field would either lose the tax breakdown or force dummy subtotal/tax values on types that don't have them.

## 9. Notes and Future Considerations

- **Currency:** Release 1 treats all amounts as the same unit. No currency validation, conversion, or cross-currency checks are implemented. Multi-currency support is deferred.
- **Items:** Items are informational. They affect the itemization status (for display) but never affect balance processing or transaction validity.
- **Overdraft/over-refund on balances:** Release 1 does not prevent a Debit/Cash/Saving account from going negative through an expense, or a Credit account from going below zero through a payment. These are valid real-world scenarios (overdraft, overpayment). Warnings may be added later.
- **Audit trail:** The Balance table is append-only; each processing creates new rows. There is no update or delete of balance rows during normal processing. Full audit events are F5.
