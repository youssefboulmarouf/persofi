import { useMemo } from 'react';
import { useAccountContext } from '../../context/AccountContext';
import { useBalanceContext } from '../../context/BalanceContext';
import { useTransactionContext } from '../../context/TransactionContext';
import { useCategoryContext } from '../../context/CategoryContext';
import { useStoreContext } from '../../context/StoreContext';
import { usePersonContext } from '../../context/PersonContext';
import { useProductContext } from '../../context/ProductContext';
import { useBrandContext } from '../../context/BrandContext';

import {
    AccountJson,
    AccountTypeEnum,
    BalanceJson,
    TransactionJson,
    TransactionTypeEnum,
    TransactionItemJson,
    CategoryJson
} from '../../model/PersofiModels';
import {DateRange, inRangeInclusive, normalizeRange, round2} from "../common/Utilities";

/* --------------------------
   Date helpers (MTD, DMY key)
---------------------------*/
const dayKey = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

function startOfMonth(d = new Date()) {
    return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
}
function endOfMonth(d = new Date()) {
    return new Date(d.getFullYear(), d.getMonth() + 1, 1, 0, 0, 0, 0);
}
function isInRange(x: Date, gte: Date, lt: Date) {
    return x >= gte && x < lt;
}
function fmtDM(d: Date) {
    // returns '01', '02', ... for chart x-axis
    return String(d.getDate()).padStart(2, '0');
}

/* ------------------------------------------
   Latest balance per account (fast selector)
-------------------------------------------*/
export function useLatestBalancesByAccount(): Map<number, BalanceJson> {
    const { balances } = useBalanceContext();
    // balances: BalanceJson[] (amount: string!)
    return useMemo(() => {
        const byAcc = new Map<number, BalanceJson>();
        for (const b of balances) {
            const prev = byAcc.get(b.accountId);
            if (!prev || new Date(b.date).getTime() > new Date(prev.date).getTime()) {
                byAcc.set(b.accountId, b);
            }
        }
        return byAcc;
    }, [balances]);
}

/* ------------------------------------------
   KPIs: spend, income, net, processed ratio
-------------------------------------------*/
export function useKpisInRange(range?: DateRange) {
    const { transactions } = useTransactionContext();

    return useMemo(() => {
        const txDates = transactions.map((t) => new Date(t.date));
        const { start, end } = normalizeRange(range, txDates);

        let spend = 0, income = 0, refunds = 0, creditPayments = 0, transfer = 0, processed = 0;

        for (const t of transactions) {
            const ts = new Date(t.date).getTime();
            if (!inRangeInclusive(ts, start, end)) continue;
            if (t.processed) processed += 1;

            switch (t.type) {
                case TransactionTypeEnum.EXPENSE: spend += Number(t.grandTotal ?? 0); break;
                case TransactionTypeEnum.INCOME: income += Number(t.amount ?? 0); break;
                case TransactionTypeEnum.REFUND: refunds += Number(t.amount ?? 0); break;
                case TransactionTypeEnum.TRANSFER: transfer += Number(t.amount ?? 0); break;
                case TransactionTypeEnum.CREDIT_PAYMENT: creditPayments += Number(t.amount ?? 0); break;
            }
        }

        const netCashFlow = income + refunds - spend - creditPayments - transfer;
        const processedPct = transactions.length ? processed / transactions.length : 0;

        return {
            spend: round2(spend),
            income: round2(income),
            netCashFlow: round2(netCashFlow),
            processedPct
        };
    }, [transactions, range?.start, range?.end]);
}

/* ------------------------------------------
   Cashflow series (Income vs Expense) daily
-------------------------------------------*/
export function useCashflowDailyInRange(range?: DateRange) {
    const { transactions } = useTransactionContext();

    return useMemo(() => {
        if (!transactions.length) return { dates: [], income: [], expense: [] };

        const txDates = transactions.map((t) => new Date(t.date));
        const { start, end } = normalizeRange(range, txDates);

        // Build day keys across [start..end]
        const dates: string[] = [];
        const incomeMap = new Map<string, number>();
        const expenseMap = new Map<string, number>();

        if (start == null || end == null || start > end) return { dates: [], income: [], expense: [] };

        const cur = new Date(start);
        while (cur.getTime() <= end) {
            const k = dayKey(cur);
            dates.push(k);
            incomeMap.set(k, 0);
            expenseMap.set(k, 0);
            cur.setDate(cur.getDate() + 1);
        }

        for (const t of transactions) {
            const ts = new Date(t.date).getTime();
            if (!inRangeInclusive(ts, start, end)) continue;

            const key = dayKey(new Date(ts));
            if (t.type === TransactionTypeEnum.INCOME) {
                incomeMap.set(key, (incomeMap.get(key) ?? 0) + Number(t.amount ?? 0));
            } else if (t.type === TransactionTypeEnum.EXPENSE) {
                expenseMap.set(key, (expenseMap.get(key) ?? 0) + Number(t.grandTotal ?? 0));
            }
        }

        return {
            dates,
            income: dates.map((k) => round2(incomeMap.get(k) ?? 0)),
            expense: dates.map((k) => round2(expenseMap.get(k) ?? 0))
        };
    }, [transactions, range?.start, range?.end]);
}

/* ------------------------------------------
   Category breakdown (Expense, current month)
-------------------------------------------*/
export function useCategoryBreakdownInRange(range?: DateRange) {
    const { transactions } = useTransactionContext();
    const { categories } = useCategoryContext();

    return useMemo(() => {
        if (!transactions.length) return { rows: [], totalAll: 0 };

        const txDates = transactions.map((t) => new Date(t.date));
        const { start, end } = normalizeRange(range, txDates);

        const items: TransactionItemJson[] = [];
        for (const t of transactions) {
            if (t.type !== TransactionTypeEnum.EXPENSE) continue;
            const ts = new Date(t.date).getTime();
            if (!inRangeInclusive(ts, start, end)) continue;
            if (Array.isArray(t.items)) items.push(...t.items);
        }

        const sumByCat = new Map<number, number>();
        for (const it of items) {
            if (it.categoryId == null) continue;
            sumByCat.set(it.categoryId, (sumByCat.get(it.categoryId) ?? 0) + Number(it.lineTotal ?? 0));
        }

        const nameById = new Map(categories.map((c) => [c.id, c.name]));
        const rows = Array.from(sumByCat.entries())
            .map(([categoryId, total]) => ({
                categoryId,
                categoryName: nameById.get(categoryId) ?? 'Uncategorized',
                total: round2(total)
            }))
            .sort((a, b) => b.total - a.total);

        const totalAll = round2(rows.reduce((acc, r) => acc + r.total, 0));
        return { rows, totalAll };
    }, [transactions, categories, range?.start, range?.end]);
}

/* ------------------------------------------
   Top stores & spend by person (MTD)
-------------------------------------------*/
export function useTopStoresInRange(limit = 10, range?: DateRange) {
    const { transactions } = useTransactionContext();
    const { stores } = useStoreContext();

    return useMemo(() => {
        if (!transactions.length) return [];
        const txDates = transactions.map((t) => new Date(t.date));
        const { start, end } = normalizeRange(range, txDates);

        const sumByStore = new Map<number, number>();
        for (const t of transactions) {
            if (t.type !== TransactionTypeEnum.EXPENSE || t.storeId == null) continue;
            const ts = new Date(t.date).getTime();
            if (!inRangeInclusive(ts, start, end)) continue;
            sumByStore.set(t.storeId, (sumByStore.get(t.storeId) ?? 0) + Number(t.grandTotal ?? 0));
        }

        const nameById = new Map(stores.map((s) => [s.id, s.name]));
        return Array.from(sumByStore.entries())
            .map(([storeId, total]) => ({ storeId, storeName: nameById.get(storeId) ?? 'Unknown', total: round2(total) }))
            .sort((a, b) => b.total - a.total)
            .slice(0, limit);
    }, [transactions, stores, limit, range?.start, range?.end]);
}

export function useSpendByPersonInRange(limit = 10, range?: DateRange) {
    const { transactions } = useTransactionContext();
    const { persons } = usePersonContext();

    return useMemo(() => {
        if (!transactions.length) return [];
        const txDates = transactions.map((t) => new Date(t.date));
        const { start, end } = normalizeRange(range, txDates);

        const sumByPerson = new Map<number, number>();
        for (const t of transactions) {
            if (t.type !== TransactionTypeEnum.EXPENSE || t.personId == null) continue;
            const ts = new Date(t.date).getTime();
            if (!inRangeInclusive(ts, start, end)) continue;
            sumByPerson.set(t.personId, (sumByPerson.get(t.personId) ?? 0) + Number(t.grandTotal ?? 0));
        }

        const nameById = new Map(persons.map((p) => [p.id, p.name]));
        return Array.from(sumByPerson.entries())
            .map(([personId, total]) => ({ personId, personName: nameById.get(personId) ?? 'Unknown', total: round2(total) }))
            .sort((a, b) => b.total - a.total)
            .slice(0, limit);
    }, [transactions, persons, limit, range?.start, range?.end]);
}

/* ------------------------------------------
   Net worth / latest balance per currency
-------------------------------------------*/
export function useNetWorthByCurrency() {
    const { accounts } = useAccountContext();
    const latestByAcc = useLatestBalancesByAccount();

    return useMemo(() => {
        const sumByCurrency = new Map<string, number>();

        const getSign = (accType: AccountTypeEnum): number => {
            // CREDIT is a liability (subtract), others add
            return accType === AccountTypeEnum.CREDIT ? -1 : 1;
        };

        for (const acc of accounts) {
            const last = latestByAcc.get(acc.id);
            if (!last) continue;
            const amt = parseFloat(String(last.amount ?? '0')); // BalanceJson.amount is string
            const signed = amt * getSign(acc.accountType);
            sumByCurrency.set(acc.currency, round2((sumByCurrency.get(acc.currency) ?? 0) + signed));
        }

        // { currency: 'CAD', value: 1234.56 }[]
        return Array.from(sumByCurrency.entries()).map(([currency, value]) => ({ currency, value }));
    }, [accounts, latestByAcc]);
}

/** ---------------------------------------------------------
 * useSpendByTransactionType
 * Totals (and counts) grouped by TransactionTypeEnum.
 * --------------------------------------------------------- */
function getNumericAmount(t: TransactionJson): number {
    return t.type === TransactionTypeEnum.EXPENSE
        ? Number(t.grandTotal ?? 0)
        : Number(t.amount ?? 0);
}

export function useSpendByTransactionTypeInRange(range?: DateRange) {
    const { transactions } = useTransactionContext();

    return useMemo(() => {
        const txDates = transactions.map((t) => new Date(t.date));
        const { start, end } = normalizeRange(range, txDates);

        const includeTypes = [
            TransactionTypeEnum.EXPENSE,
            TransactionTypeEnum.INCOME,
            TransactionTypeEnum.CREDIT_PAYMENT,
            TransactionTypeEnum.REFUND,
            TransactionTypeEnum.TRANSFER
        ];

        const totals = new Map<TransactionTypeEnum, number>();
        const counts = new Map<TransactionTypeEnum, number>();
        for (const ty of includeTypes) {
            totals.set(ty, 0);
            counts.set(ty, 0);
        }

        for (const t of transactions) {
            if (!includeTypes.includes(t.type)) continue;
            const ts = new Date(t.date).getTime();
            if (!inRangeInclusive(ts, start, end)) continue;

            totals.set(t.type, round2((totals.get(t.type) ?? 0) + getNumericAmount(t)));
            counts.set(t.type, (counts.get(t.type) ?? 0) + 1);
        }

        const rows = includeTypes.map((ty) => ({
            type: ty,
            total: round2(totals.get(ty) ?? 0),
            count: counts.get(ty) ?? 0
        }));

        return { rows, totalsMap: totals, countsMap: counts };
    }, [transactions, range?.start, range?.end]);
}

export function useSavingsRateInRange(range?: DateRange) {
    const { transactions } = useTransactionContext();
    return useMemo(() => {
        const txDates = transactions.map((t) => new Date(t.date));
        const { start, end } = normalizeRange(range, txDates);

        let income = 0;
        let expense = 0;

        for (const t of transactions) {
            const ts = new Date(t.date).getTime();
            if (!inRangeInclusive(ts, start, end)) continue;
            if (t.type === TransactionTypeEnum.INCOME) income += Number(t.amount ?? 0);
            if (t.type === TransactionTypeEnum.EXPENSE) expense += Number(t.grandTotal ?? 0);
        }
        const saved = Math.max(0, income - expense);
        const rate = income > 0 ? saved / income : 0;
        return { income: round2(income), expense: round2(expense), saved: round2(saved), rate };
    }, [transactions, range?.start, range?.end]);
}

export function useRefundRateInRange(range?: DateRange) {
    const { transactions } = useTransactionContext();
    return useMemo(() => {
        const txDates = transactions.map((t) => new Date(t.date));
        const { start, end } = normalizeRange(range, txDates);

        let refunds = 0;
        let expenses = 0;

        for (const t of transactions) {
            const ts = new Date(t.date).getTime();
            if (!inRangeInclusive(ts, start, end)) continue;
            if (t.type === TransactionTypeEnum.REFUND) refunds += Number(t.amount ?? 0);
            if (t.type === TransactionTypeEnum.EXPENSE) expenses += Number(t.grandTotal ?? 0);
        }
        const rate = expenses > 0 ? refunds / expenses : 0;
        return { refunds: round2(refunds), expenses: round2(expenses), rate };
    }, [transactions, range?.start, range?.end]);
}

export function useWeekdaySpendDistributionInRange(range?: DateRange) {
    const { transactions } = useTransactionContext();
    return useMemo(() => {
        const txDates = transactions.map((t) => new Date(t.date));
        if (!txDates.length) return { labels: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'], series: [0,0,0,0,0,0,0] };
        const { start, end } = normalizeRange(range, txDates);

        const order = [1, 2, 3, 4, 5, 6, 0]; // Mon..Sun
        const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const sums = new Map<number, number>(order.map((w) => [w, 0]));

        for (const t of transactions) {
            if (t.type !== TransactionTypeEnum.EXPENSE) continue;
            const ts = new Date(t.date).getTime();
            if (!inRangeInclusive(ts, start, end)) continue;
            const w = new Date(ts).getDay();
            sums.set(w, (sums.get(w) ?? 0) + Number(t.grandTotal ?? 0));
        }

        const series = order.map((w) => round2(sums.get(w) ?? 0));
        return { labels, series };
    }, [transactions, range?.start, range?.end]);
}

type HeatmapOptions = {
    range?: DateRange;
    includeTypes?: TransactionTypeEnum[]; // default Expense only
};

export function useWeekdayHourHeatmap(opts?: HeatmapOptions) {
    const { transactions } = useTransactionContext();
    const include = opts?.includeTypes ?? [TransactionTypeEnum.EXPENSE];

    return useMemo(() => {
        const txDates = transactions.map((t) => new Date(t.date));
        const { start, end } = normalizeRange(opts?.range, txDates);

        const weekdayOrder = [1, 2, 3, 4, 5, 6, 0];
        const weekdayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const hours = Array.from({ length: 24 }, (_, h) => h.toString().padStart(2, '0'));

        const matrix = new Map<number, Map<number, number>>();
        for (const w of weekdayOrder) {
            const byHour = new Map<number, number>();
            for (let h = 0; h < 24; h++) byHour.set(h, 0);
            matrix.set(w, byHour);
        }

        for (const t of transactions) {
            if (!include.includes(t.type)) continue;
            const ts = new Date(t.date).getTime();
            if (!inRangeInclusive(ts, start, end)) continue;

            const d = new Date(ts);
            const weekday = d.getDay();
            const hour = d.getHours();
            const amount =
                t.type === TransactionTypeEnum.EXPENSE ? Number(t.grandTotal ?? 0) : Number(t.amount ?? 0);

            const row = matrix.get(weekday);
            if (!row) continue;
            row.set(hour, (row.get(hour) ?? 0) + amount);
        }

        const series = weekdayOrder.map((w, idx) => ({
            name: weekdayLabels[idx],
            data: hours.map((h, hourIdx) => ({ x: h, y: round2(matrix.get(w)?.get(hourIdx) ?? 0) }))
        }));

        return { series, hours, weekdayLabels };
    }, [transactions, opts?.range?.start, opts?.range?.end, JSON.stringify(include)]);
}

type HistogramOptions = {
    range?: DateRange;
    buckets?: number[]; // upper bounds; last bucket is ">= last"
};

export function useTransactionSizeHistogram(opts?: HistogramOptions) {
    const { transactions } = useTransactionContext();
    const bounds = opts?.buckets ?? [10, 25, 50, 100, 200, 500];

    return useMemo(() => {
        const txDates = transactions.map((t) => new Date(t.date));
        const { start, end } = normalizeRange(opts?.range, txDates);

        const counts = new Array(bounds.length + 1).fill(0);
        for (const t of transactions) {
            if (t.type !== TransactionTypeEnum.EXPENSE) continue;
            const ts = new Date(t.date).getTime();
            if (!inRangeInclusive(ts, start, end)) continue;

            const val = Number(t.grandTotal ?? 0);
            const idx = bounds.findIndex((b) => val < b);
            const bucket = idx === -1 ? counts.length - 1 : idx;
            counts[bucket] += 1;
        }
        const labels = bounds.map((b, i) => (i === 0 ? `< ${b}` : `${bounds[i - 1]}–${b}`));
        labels.push(`≥ ${bounds[bounds.length - 1]}`);
        return { labels, series: counts as number[] };
    }, [transactions, opts?.range?.start, opts?.range?.end, JSON.stringify(bounds)]);
}