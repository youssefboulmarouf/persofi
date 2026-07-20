# Persofi — Execution Plan

> Generated: 2026-05-10 | Based on technical review + FutureEnhancement backlog

---

## FutureEnhancement Status Map

| Area | Feature | Status | Notes |
|---|---|---|---|
| **Dashboard** | Date Search Bar | ✅ Done | `DashboardFilter.tsx` |
| **Dashboard / Balances** | Balance per account type | ✅ Done | `DashboardTopCards.tsx` typeSummaries |
| **Dashboard / Balances** | Historical balances per account type | ❌ Missing | Historical chart is per individual account, not grouped by type |
| **Dashboard / Balances** | Balance per account | ✅ Done | Accounts tab in `Dashboard.tsx` |
| **Dashboard / Balances** | Historical balances per account | ✅ Done | MultyStatsChart "Historical Accounts Balances" |
| **Dashboard / Net Flow** | Expense KPI | ✅ Done | |
| **Dashboard / Net Flow** | Income KPI | ✅ Done | |
| **Dashboard / Net Flow** | Expense – Income KPI | ✅ Done | "Net Cashflow" card |
| **Dashboard / Net Flow** | Bar chart expense vs income total | ✅ Done | Transaction Breakdown bar chart |
| **Dashboard / Net Flow** | Bar chart expense vs income by month | ❌ Missing | Daily cashflow exists; monthly grouping absent |
| **Dashboard / Expenses** | Total expense (credit vs debit breakdown) | ❌ Missing | No split by account type on expense |
| **Dashboard / Expenses** | Expense per parent category | ❌ Missing | Flat category breakdown only; no parent grouping |
| **Dashboard / Expenses** | Expense per store | ✅ Done | Top Stores chart |
| **Dashboard / Expenses** | Expense per person | ✅ Done | Spend by Person chart |
| **Dashboard / Tax** | How much tax paid | ❌ Missing | `taxTotal` field exists on transactions; no widget |
| **Dashboard / Tax** | Historic tax paid | ❌ Missing | |
| **Transactions** | CRUDS | ✅ Done | |
| **Transactions / Filters** | Filter by date | ✅ Done | |
| **Transactions / Filters** | Filter by transaction type | ✅ Done — label bug | Dropdown labelled "Categories" instead of "Type" |
| **Transactions / Filters** | Filter by account type | ❌ Missing | Not in `FilterProps` or the filter UI |
| **Transactions / Filters** | Filter by store | ❌ Missing | |
| **Transactions / Filters** | Filter by person | ❌ Missing | |
| **Settings / Accounts** | CRUDS | ✅ Done | |
| **Settings / Accounts** | Filter by name | ✅ Done | |
| **Settings / Accounts** | Filter by account type | ✅ Done | |
| **Settings / Persons** | CRUDS | ✅ Done | |
| **Settings / Persons** | Filter by name | ✅ Done | |
| **Settings / Categories** | CRUDS | ✅ Done | |
| **Settings / Categories** | Filter by name / parent name | ✅ Done | |
| **Settings / Categories** | Filter by "Is Parent" | ❌ Missing | Boolean flag not in filter UI |
| **Settings / Products** | CRUDS | ✅ Done | |
| **Settings / Products** | Filter by product name / category name | ✅ Done | |
| **Settings / Variants** | CRUDS | ✅ Done | |
| **Settings / Variants** | Filter by variant / product name | ✅ Done | |
| **Settings / Brands** | CRUDS | ✅ Done | |
| **Settings / Brands** | Filter by name | ✅ Done | |
| **Settings / Stores** | CRUDS | ✅ Done | |
| **Settings / Stores** | Filter by name | ✅ Done | |

**9 items pending from FutureEnhancement.**

---

## Sprint 1 — Foundation & Critical Fixes
> Security, data integrity, and the connection pool issue. Do these before anything else ships.

### Step 1 — Add MySQL Password `(S)`
- `docker-compose.yml:9` — Replace `MYSQL_ALLOW_EMPTY_PASSWORD: "yes"` with `MYSQL_ROOT_PASSWORD: "${DB_PASSWORD}"`
- `docker-compose.yml:27` — Update `DATABASE_URL` to `mysql://root:${DB_PASSWORD}@mysql:3306/persofi`
- Add `.env.example` with `DB_PASSWORD=` and load it via `env_file` in both compose files
- Apply the same change to `docker-compose.dev.yml`

### Step 2 — Guard `delete()` Against Processed Transactions `(S)`
- `app/src/transaction/TransactionService.ts:214` — Add `isProcessed()` guard before deletion
- Add a test: attempt to delete a processed transaction, assert 400 response

```typescript
// Before
async delete(id: number) {
    await this.prisma.transaction.delete({ where: { id } });
}

// After
async delete(id: number) {
    const tx = await this.getById(id);
    BadRequestError.throwIf(tx.isProcessed(), `Cannot delete a processed transaction [id=${id}]`);
    await this.prisma.transaction.delete({ where: { id } });
}
```

### Step 3 — Singleton PrismaClient `(S)`
- Create `app/src/utilities/prisma.ts` exporting one shared `PrismaClient` instance
- Update `app/src/utilities/BaseService.ts:9` to import and use it instead of `new PrismaClient()`
- Eliminates the 5 connection pools spawned per `processTransaction` request

```typescript
// app/src/utilities/prisma.ts (new file)
import { PrismaClient } from "@prisma/client";
export const prisma = new PrismaClient();

// BaseService.ts
import { prisma } from "./prisma";
protected prisma = prisma;  // replace: this.prisma = new PrismaClient()
```

### Step 4 — Fix Error Message Bugs + Filter Label `(S)`
- `app/src/transaction/TransactionService.ts:126` — Replace `getTransactionType()` with `getId()`
- `app/src/transaction/TransactionService.ts:199` — Replace hardcoded `"Expense transaction"` with a generic message
- `client/src/components/transaction/TransactionsFilter.tsx:42` — Change `label="Categories"` to `label="Type"`

---

## Sprint 2 — Backend Robustness

### Step 5 — Fix Floating-Point Equality in TransactionValidator `(S)`
- `app/src/transaction/TransactionValidator.ts:116` — Replace strict `!==` with epsilon comparison
- Add test: expense with `subtotal: 0.1, taxTotal: 0.2, grandTotal: 0.3` must pass validation

```typescript
// Before
private static mustEq(total: number, a: number, msg: string): void {
    BadRequestError.throwIf(total !== a, msg);
}

// After
private static mustEq(total: number, a: number, msg: string): void {
    BadRequestError.throwIf(Math.abs(total - a) > 0.001, msg);
}
```

### Step 6 — Fix `processInitBalanceTransaction` Control Flow `(S)`
- Add `existsForAccount(accountId: number): Promise<boolean>` to `app/src/balance/BalanceService.ts`
- Rewrite `app/src/transaction/TransactionProcessorService.ts:109-131` to use it directly — no more try/catch on a known error message string

```typescript
// BalanceService.ts — new method
async existsForAccount(accountId: number): Promise<boolean> {
    const count = await this.prisma.balance.count({ where: { accountId } });
    return count > 0;
}

// TransactionProcessorService.ts — rewritten
async processInitBalanceTransaction(transaction, counterPartyAccount) {
    const hasBalance = await this.balanceService.existsForAccount(counterPartyAccount.getId());
    BadRequestError.throwIf(hasBalance, `Balance already exists for account [id=${counterPartyAccount.getId()}]`);
    await this.balanceService.updateAccountBalance(
        transaction.getAmount(), transaction.getDate(),
        transaction.getId(), counterPartyAccount.getId()
    );
}
```

### Step 7 — Parallelize Independent DB Lookups `(S)`
- `TransactionService.ts:147-151` (CREDIT_PAYMENT) and `162-165` (TRANSFER) — wrap the two `getById` calls in `Promise.all`
- `TransactionProcessorService.ts:59-60` and `91-92` — wrap the two `getLatestBalanceOfAccount` calls in `Promise.all`

```typescript
// Before (sequential — CREDIT_PAYMENT case)
await this.accountService.getById(Number(existingTransaction.getPayAccountId())),
await this.accountService.getById(Number(existingTransaction.getCounterpartyAccountId()))

// After
const [payAccount, counterpartyAccount] = await Promise.all([
    this.accountService.getById(Number(existingTransaction.getPayAccountId())),
    this.accountService.getById(Number(existingTransaction.getCounterpartyAccountId()))
]);
```

### Step 8 — Add Pagination to List Endpoints `(M)`
- Add `?limit=100&offset=0` query params to all `get()` methods in every service, starting with `TransactionService` and `BalanceService` (these grow fastest)
- Update each resource to extract and pass through pagination params
- Frontend hooks: pass `limit` param; default to a reasonable page size per entity

---

## Sprint 3 — Frontend Performance & Quick Wins

### Step 9 — Add `staleTime` to All React Query Hooks `(S)`
- All files in `client/src/hooks/`:
  - Mutable data (transactions, balances, accounts): `staleTime: 60_000`
  - Reference data (brands, categories, stores, persons, products): `staleTime: Infinity`

```typescript
// Before
return useQuery({ queryKey: ["transactions"], queryFn: fetchTransactions });

// After
return useQuery({ queryKey: ["transactions"], queryFn: fetchTransactions, staleTime: 60_000 });
```

### Step 10 — Route-Level Code Splitting `(S)`
- `client/src/App.tsx:10-18` — Convert all page imports except Dashboard to `React.lazy()`
- Wrap `<Routes>` with `<Suspense fallback={<LoadingComponent />}>`

```typescript
// Before
import {Transactions} from "./components/transaction/Transactions";

// After
const Transactions = React.lazy(() => import("./components/transaction/Transactions"));
```

### Step 11 — Add `/api/balances/latest` Endpoint `(S)`
- New `getLatestPerAccount()` method in `BalanceService.ts` using a grouped raw query
- New route `GET /api/balances/latest` in `BalanceResource`
- Update `useLatestBalancesByAccount` in `DashboardSelectors.ts:45` to call this endpoint instead of iterating all balance rows client-side

```typescript
// BalanceService.ts
async getLatestPerAccount(): Promise<BalanceJson[]> {
    const data = await this.prisma.$queryRaw`
        SELECT b.* FROM Balance b
        INNER JOIN (
            SELECT accountId, MAX(date) as maxDate FROM Balance GROUP BY accountId
        ) latest ON b.accountId = latest.accountId AND b.date = latest.maxDate
    `;
    return (data as any[]).map(BalanceJson.from);
}
```

### Step 12 — Categories "Is Parent" Filter `(S)`
- `client/src/components/category/CategoriesFilter.tsx` — Add a checkbox "Parent categories only"
- `client/src/components/category/Categories.tsx` — Add `isParent: boolean` to `FilterProps`, filter on `category.parentCategoryId === null`

---

## Sprint 4 — Transaction Filter Completion
> Completes the 3 missing filters from FutureEnhancement.

### Step 13 — Add Store Filter to Transactions `(S)`
- `client/src/components/transaction/TransactionsFilter.tsx` — Add an `Autocomplete` populated from `useStores()`
- `client/src/components/transaction/Transactions.tsx` — Add `storeId: number | null` to `FilterProps`; filter logic: `filters.storeId ? t.storeId === filters.storeId : true`

### Step 14 — Add Person Filter to Transactions `(S)`
- Same pattern as Step 13 using `usePersons()` and `personId`

### Step 15 — Add Account Type Filter to Transactions `(S)`
- `client/src/components/transaction/TransactionsFilter.tsx` — Add `AccountTypeEnum` Autocomplete
- Filter logic: check if `payAccountId` or `counterpartyAccountId` belongs to an account of the selected type, using the already-loaded `accounts` list
- Add `accountType: AccountTypeEnum | null` to `FilterProps`

---

## Sprint 5 — Dashboard: Missing Widgets
> Completes the 5 missing dashboard items from FutureEnhancement.

### Step 16 — Expense by Account Type (Credit vs Debit) `(S)`
- New selector `useExpenseByAccountTypeInRange(range)` in `DashboardSelectors.ts`: join transactions with the accounts list on `payAccountId`, group `grandTotal` by `accountType`
- Add a bar or donut chart card in the Spending Analysis tab

### Step 17 — Expense by Parent Category `(S)`
- Update (or add a variant of) `useCategoryBreakdownInRange` in `DashboardSelectors.ts:152`: walk `categoryId → parentCategoryId` using the categories list, accumulate `lineTotal` under the resolved parent
- Replace or supplement the flat category chart in the Spending Analysis tab with the parent-grouped version

### Step 18 — Monthly Expense vs Income Bar Chart `(M)`
- New selector `useCashFlowMonthlyInRange(range)` in `DashboardSelectors.ts`: same logic as `useCashFlowDailyInRange` but bucket by `YYYY-MM` key
- Add a grouped bar chart (Income series + Expense series by month) to the Overview tab

### Step 19 — Tax Paid KPI + Historic Chart `(S)`
- New selector `useTaxInRange(range)`: sum `taxTotal` across EXPENSE transactions in the range
- New selector `useTaxMonthlyInRange(range)`: bucket `taxTotal` by month for the historic bar chart
- Add a "Tax Paid" KPI card and a monthly bar chart to the Spending Analysis tab

---

## Sprint 6 — Historical Balances by Account Type
> Last remaining FutureEnhancement item.

### Step 20 — Historical Balance Grouped by Account Type `(M)`
- `client/src/components/dashborad/Dashboard.tsx:196-213` — Alongside the existing per-account `balanceSeries`, compute an aggregated series: for each date in `balanceDateSet`, sum balances across all accounts of each `AccountTypeEnum`
- Add a second `MultyStatsChart` (or a toggle on the existing one) titled "Historical Balance by Account Type" in the Accounts tab

---

## Sprint 7 — New Features

### Step 21 — CSV Export for Transactions `(S)`
- Backend: `GET /api/transactions/export?format=csv` — stream a CSV file response with `Content-Disposition: attachment; filename="transactions.csv"`; respect the same date/type query params as the list endpoint
- Frontend: "Export CSV" button on the Transactions page, triggers a download via `window.open` or a `fetch` + blob

### Step 22 — Historical Net Worth Chart `(S)`
- New selector `useNetWorthHistory(range)` in `DashboardSelectors.ts`: for each unique balance date, compute total signed net worth per currency using the same account-type sign logic as `useNetWorthByCurrency`
- Add a line chart to the Accounts tab

### Step 23 — Monthly Budget Envelopes `(M)`
- Backend: new `Budget` Prisma model (`categoryId | null, amount, currency, month, year`); new `BudgetService` / `BudgetResource` with CRUDS
- Frontend: budget config page under Settings; "Budget vs Actual" progress bar widget on the Spending Analysis tab comparing `useCategoryBreakdownInRange` totals vs budget limits

---

## Full Priority Table

| # | Sprint | Step | Item | Type | Impact | Effort |
|---|---|---|---|---|---|---|
| 1 | S1 | 1 | MySQL password in Docker config | Security | 🔴 Critical | S |
| 2 | S1 | 2 | Guard `delete()` on processed transactions | Bug/Integrity | 🔴 Critical | S |
| 3 | S1 | 3 | Singleton PrismaClient | Perf | 🔴 Critical | S |
| 4 | S1 | 4 | Fix error message bugs + filter label | Bug/DX | 🟡 High | S |
| 5 | S2 | 5 | Fix floating-point equality in validator | Bug | 🔴 Critical | S |
| 6 | S2 | 6 | Fix `processInitBalance` control flow | Code Quality | 🟡 High | S |
| 7 | S2 | 7 | Parallelize account/balance fetches | Perf | 🟡 High | S |
| 8 | S2 | 8 | Pagination on list endpoints | Perf/Scale | 🟡 High | M |
| 9 | S3 | 9 | `staleTime` on React Query hooks | Perf | 🟡 High | S |
| 10 | S3 | 10 | Route code splitting | Perf | 🟡 High | S |
| 11 | S3 | 11 | `/api/balances/latest` endpoint | Perf | 🟡 High | S |
| 12 | S3 | 12 | Categories "Is Parent" filter | Feature | 🟢 Nice | S |
| 13 | S4 | 13 | Transactions: Store filter | Feature | 🟡 High | S |
| 14 | S4 | 14 | Transactions: Person filter | Feature | 🟡 High | S |
| 15 | S4 | 15 | Transactions: Account Type filter | Feature | 🟡 High | S |
| 16 | S5 | 16 | Dashboard: Expense by account type widget | Feature | 🟡 High | S |
| 17 | S5 | 17 | Dashboard: Expense by parent category | Feature | 🟡 High | S |
| 18 | S5 | 18 | Dashboard: Monthly cashflow bar chart | Feature | 🟡 High | M |
| 19 | S5 | 19 | Dashboard: Tax Paid KPI + historic chart | Feature | 🟡 High | S |
| 20 | S6 | 20 | Dashboard: Historical balance by account type | Feature | 🟡 High | M |
| 21 | S7 | 21 | CSV export for transactions | Feature | 🟡 High | S |
| 22 | S7 | 22 | Historical net worth chart | Feature | 🟢 Nice | S |
| 23 | S7 | 23 | Monthly budget envelopes | Feature | 🟢 Nice | M |
