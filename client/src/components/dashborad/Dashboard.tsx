import { FC, useEffect, useMemo, useState } from "react";
import Box from "@mui/material/Box";
import { Container, Grid, Tabs, Tab, Typography } from "@mui/material";
import DashboardTopCards from "./DashboardTopCards";
import MultyStatsChart from "./MultyStatsChart";
import { TransactionTypeEnum } from "../../model/PersofiModels";
import {
    useNetWorthByCurrency,
    useSpendByTransactionTypeInRange,
    useKpisInRange,
    useCashFlowDailyInRange,
    useCategoryBreakdownInRange,
    useTopStoresInRange,
    useSpendByPersonInRange,
    useSavingsRateInRange,
    useRefundRateInRange,
    useWeekdaySpendDistributionInRange,
    useWeekdayHourHeatmap,
    useTransactionSizeHistogram
} from './DashboardSelectors';
import { useAccounts } from "../../hooks/useAccounts";
import { useTransactions } from "../../hooks/useTransactions";
import { useBalances } from "../../hooks/useBalances";
import DashboardFilter from "./DashboardFilter";
import { Stack } from "@mui/system";
import DashboardBarChart from "./DashboardBarChart";
import HeatmapChartCard from "./HeatmapChartCard";
import DashboardCard from "./DashboardCard";
import { getCurrentMonthKey } from "../common/Utilities";

interface FilterProps {
    startDate: Date | null;
    endDate: Date | null;
}

// Extract YYYY-MM-DD from a date value without timezone shift.
// The date field is typed as Date but arrives as an ISO string from JSON;
// calling new Date() on a UTC midnight string shifts the day in UTC- timezones.
const dayKey = (d: Date): string => String(d).slice(0, 10);

export const Dashboard: FC = () => {
    const [filters, setFilters] = useState<FilterProps>({ startDate: null, endDate: null });

    // ------------------------------------------------
    const { spend, income, netCashFlow, processedPct } = useKpisInRange({
        start: filters.startDate,
        end: filters.endDate
    });

    const savings = useSavingsRateInRange({
        start: filters.startDate,
        end: filters.endDate
    });
    const refund = useRefundRateInRange({
        start: filters.startDate,
        end: filters.endDate
    });

    const cashflow = useCashFlowDailyInRange({
        start: filters.startDate,
        end: filters.endDate
    });
    const cat = useCategoryBreakdownInRange({
        start: filters.startDate,
        end: filters.endDate
    });
    const topStores = useTopStoresInRange(10, {
        start: filters.startDate,
        end: filters.endDate
    });
    const spendByPerson = useSpendByPersonInRange(10, {
        start: filters.startDate,
        end: filters.endDate
    });
    const spendByTransactionType = useSpendByTransactionTypeInRange({
        start: filters.startDate,
        end: filters.endDate
    });
    const netWorth = useNetWorthByCurrency();
    // Weekday & heatmap
    const weekday = useWeekdaySpendDistributionInRange({
        start: filters.startDate,
        end: filters.endDate
    });
    const heatmap = useWeekdayHourHeatmap({
        range: {
            start: filters.startDate,
            end: filters.endDate
        }
    });

    const hist = useTransactionSizeHistogram({
        range: {
            start: filters.startDate,
            end: filters.endDate
        }
    });

    // ------------------------------------------------
    const { data: accountsData } = useAccounts();
    const accounts = accountsData || [];
    const { data: transactionsData } = useTransactions();
    const transactions = transactionsData || [];
    const { data: balancesData } = useBalances();
    const balances = balancesData || [];

    const [balanceDateSet, setBalanceDateSet] = useState<Set<string>>(new Set<string>());
    const [balanceSeries, setBalanceSeries] = useState<{ name: string, data: number[] }[]>([]);
    const [transactionDateSet, setTransactionDateSet] = useState<Set<string>>(new Set<string>());
    const [transactionSeries, setTransactionSeries] = useState<{ name: TransactionTypeEnum, data: number[] }[]>([]);

    const filteredBalances = useMemo(() => {
        // Normalize date bounds
        const startTs =
            filters.startDate ? new Date(filters.startDate).setHours(0, 0, 0, 0) : null;
        const endTs =
            filters.endDate ? new Date(filters.endDate).setHours(23, 59, 59, 999) : null;

        const results = balances.filter((t) => {
            const dateStr = String(t.date).slice(0, 10);
            const tTime = new Date(dateStr + 'T00:00:00').getTime();
            if (Number.isNaN(tTime)) return false;

            const startMatch = startTs != null ? tTime >= startTs : true;
            const endMatch = endTs != null ? tTime <= endTs : true;

            return (
                startMatch &&
                endMatch
            );
        });

        // Sort chronologically (oldest first) so the chart renders left-to-right
        return results.sort((a, b) => {
            const timeA = new Date(String(a.date).slice(0, 10) + 'T00:00:00').getTime();
            const timeB = new Date(String(b.date).slice(0, 10) + 'T00:00:00').getTime();
            if (timeA !== timeB) return timeA - timeB;
            // Fallback to ID-based chronological sort for balances on the same day
            return a.id - b.id;
        });
    }, [balances, filters]);

    const filteredTransactions = useMemo(() => {
        // Normalize date bounds
        const startTs =
            filters.startDate ? new Date(filters.startDate).setHours(0, 0, 0, 0) : null;
        const endTs =
            filters.endDate ? new Date(filters.endDate).setHours(23, 59, 59, 999) : null;

        const results = transactions.filter((t) => {
            const dateStr = String(t.date).slice(0, 10);
            const tTime = new Date(dateStr + 'T00:00:00').getTime();
            if (Number.isNaN(tTime)) return false;

            const startMatch = startTs != null ? tTime >= startTs : true;
            const endMatch = endTs != null ? tTime <= endTs : true;

            return (
                startMatch &&
                endMatch
            );
        });

        // Sort chronologically (oldest first) so the chart renders left-to-right
        return results.sort((a, b) => {
            const timeA = new Date(String(a.date).slice(0, 10) + 'T00:00:00').getTime();
            const timeB = new Date(String(b.date).slice(0, 10) + 'T00:00:00').getTime();
            if (timeA !== timeB) return timeA - timeB;
            // Fallback to ID-based chronological sort for transactions on the same day
            return a.id - b.id;
        });
    }, [transactions, filters]);

    useEffect(() => {
        // 1) Build sorted unique list of date keys across all balances
        const dateSet = new Set<string>();
        for (const balance of filteredBalances) {
            dateSet.add(dayKey(balance.date));
        }
        setBalanceDateSet(dateSet);

        // 2) Index balances per accountId per day, keeping the last reading of the day
        //    (balances are not assumed sorted; we overwrite to keep the latest of that day)
        const balancesByAccountByDay = new Map<number, Map<string, number>>();
        for (const balance of filteredBalances) {
            const key = dayKey(balance.date);
            let accountBalancePerDay = balancesByAccountByDay.get(balance.accountId);
            if (!accountBalancePerDay) {
                accountBalancePerDay = new Map<string, number>();
                balancesByAccountByDay.set(balance.accountId, accountBalancePerDay);
            }
            // overwrite to keep the last encountered entry of that day (good enough for dashboard granularity)
            accountBalancePerDay.set(key, balance.amount);
        }

        setBalanceSeries(accounts.map((acc) => {
            const dailyAccountBalancesMap =
                balancesByAccountByDay.get(acc.id) ?? new Map<string, number>();

            const data: number[] = [];
            let lastKnown: number = 0;

            for (const d of Array.from(dateSet).sort()) {
                if (dailyAccountBalancesMap.has(d)) {
                    lastKnown = dailyAccountBalancesMap.get(d)!;
                    data.push(lastKnown);
                } else {
                    // carry forward after first known value; gaps before first known remain null
                    data.push(lastKnown);
                }
            }
            return { name: acc.name, data };
        }));
    }, [filteredBalances])

    useEffect(() => {
        const dateSet = new Set<string>();
        for (const tx of filteredTransactions) {
            dateSet.add(dayKey(tx.date));
        }
        setTransactionDateSet(dateSet);

        const categories = Array.from(dateSet).sort();

        const TYPE_LABELS: TransactionTypeEnum[] = [
            TransactionTypeEnum.EXPENSE,
            TransactionTypeEnum.INCOME,
            TransactionTypeEnum.CREDIT_PAYMENT,
            TransactionTypeEnum.REFUND,
            TransactionTypeEnum.TRANSFER
        ];

        const txByTypeByDay = new Map<TransactionTypeEnum, Map<string, number>>();
        for (const type of TYPE_LABELS) txByTypeByDay.set(type, new Map<string, number>());

        for (const tx of filteredTransactions) {
            if (!TYPE_LABELS.includes(tx.type)) continue;

            const key = dayKey(tx.date);
            const val = (tx.grandTotal > 0 ? tx.grandTotal : tx.amount) ?? 0;
            const m = txByTypeByDay.get(tx.type)!;
            m.set(key, (m.get(key) ?? 0) + val);
        }

        setTransactionSeries(TYPE_LABELS.map(type => {
            const m = txByTypeByDay.get(type)!;
            const data = categories.map(d => m.get(d) ?? 0);
            return { name: type, data };
        }));

    }, [filteredTransactions])

    const currentMonthKey = getCurrentMonthKey();
    const [activeTab, setActiveTab] = useState(0);

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setActiveTab(newValue);
    };

    return (
        <Box>
            {/* Global Header */}
            <Stack
                justifyContent="space-between"
                direction={{ xs: "column", sm: "row" }}
                alignItems="center"
                mb={3}
            >
                <Typography variant="h4">Dashboard</Typography>
                <DashboardFilter filters={filters} setFilters={setFilters} />
            </Stack>

            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs value={activeTab} onChange={handleTabChange} aria-label="dashboard tabs">
                    <Tab label="Overview" />
                    <Tab label="Spending Analysis" />
                    <Tab label="Accounts" />
                </Tabs>
            </Box>

            {/* TAB 0: Overview */}
            {activeTab === 0 && (
                <Box>
                    {/* Net Worth Hero */}
                    {netWorth.length > 0 && (
                        <Grid container spacing={3} mb={3}>
                            {netWorth.map(nw => (
                                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={nw.currency}>
                                    <DashboardCard
                                        title={`Net Worth (${nw.currency})`}
                                        currentMonthStats={nw.value.toFixed(2)}
                                        color="info"
                                    />
                                </Grid>
                            ))}
                        </Grid>
                    )}

                    <Grid container spacing={3}>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <DashboardCard
                                title="Income"
                                currentMonth={currentMonthKey}
                                currentMonthStats={income}
                                color="primary"
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <DashboardCard
                                title="Spend"
                                currentMonth={currentMonthKey}
                                currentMonthStats={spend}
                                color="error"
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <DashboardCard
                                title="Net Cashflow"
                                currentMonth={currentMonthKey}
                                currentMonthStats={netCashFlow}
                                color="secondary"
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <DashboardCard
                                title="Processed %"
                                currentMonth={currentMonthKey}
                                currentMonthStats={`${Math.round(processedPct * 100)}%`}
                                color="success"
                            />
                        </Grid>
                    </Grid>

                    <Grid container spacing={1} mt={3}>
                        <MultyStatsChart
                            title={"Historical Accounts Balances"}
                            categories={Array.from(balanceDateSet).sort()}
                            series={balanceSeries}
                        />
                        <MultyStatsChart
                            title={"Historical Transactions"}
                            categories={Array.from(transactionDateSet).sort()}
                            series={transactionSeries}
                        />
                    </Grid>
                </Box>
            )}

            {/* TAB 1: Spending Analysis */}
            {activeTab === 1 && (
                <Box>
                    {/* Breakdown 2x2 grid */}
                    <Typography variant="h5" mb={2}>Where does it go?</Typography>
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <DashboardBarChart
                                title={`Transaction Breakdown (MTD)`}
                                categories={spendByTransactionType.rows.map(c => c.type)}
                                series={[{
                                    name: '',
                                    data: spendByTransactionType.rows.map(c => c.total)
                                }]}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <DashboardBarChart
                                title={`Category Breakdown (MTD) — Total: ${cat.totalAll}`}
                                categories={cat.rows.map(c => c.categoryName)}
                                series={[{
                                    name: '',
                                    data: cat.rows.map(c => c.total)
                                }]}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <DashboardBarChart
                                title={`Top Stores (MTD)`}
                                categories={topStores.map(s => s.storeName)}
                                series={[{
                                    name: '',
                                    data: topStores.map(s => s.total)
                                }]}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <DashboardBarChart
                                title={`Spend by Person (MTD)`}
                                categories={spendByPerson.map(s => s.personName)}
                                series={[{
                                    name: '',
                                    data: spendByPerson.map(s => s.total)
                                }]}
                            />
                        </Grid>
                    </Grid>

                    <Typography variant="h5" mt={4} mb={2}>Spending Habits</Typography>
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <DashboardBarChart
                                title="Weekday Spend"
                                categories={weekday.labels}
                                series={[{ name: 'Expense', data: weekday.series }]}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <DashboardBarChart
                                title="Transaction Size Histogram"
                                categories={hist.labels}
                                series={[{ name: 'Count', data: hist.series }]}
                            />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <HeatmapChartCard
                                title="Weekday × Hour Heatmap"
                                series={heatmap.series}
                            />
                        </Grid>
                    </Grid>
                </Box>
            )}

            {/* TAB 2: Accounts */}
            {activeTab === 2 && (
                <Box>
                    <Typography variant="h5" mb={2}>Accounts Overview</Typography>
                    <DashboardTopCards
                        accounts={accounts}
                        balances={balances}
                    />
                </Box>
            )}
        </Box>
    );
};