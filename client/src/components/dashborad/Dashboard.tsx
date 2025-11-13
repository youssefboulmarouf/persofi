import {FC, useEffect, useMemo, useState} from "react";
import Box from "@mui/material/Box";
import {Container, Grid} from "@mui/material";
import DashboardTopCards from "./DashboardTopCards";
import {useAccountContext} from "../../context/AccountContext";
import {useBalanceContext} from "../../context/BalanceContext";
import MultyStatsChart from "./MultyStatsChart";
import {useTransactionContext} from "../../context/TransactionContext";
import {TransactionTypeEnum} from "../../model/PersofiModels";
import {
    useNetWorthByCurrency,
    useSpendByTransactionTypeInRange,
    useKpisInRange,
    useCashflowDailyInRange,
    useCategoryBreakdownInRange,
    useTopStoresInRange,
    useSpendByPersonInRange,
    useSavingsRateInRange,
    useRefundRateInRange,
    useWeekdaySpendDistributionInRange,
    useWeekdayHourHeatmap,
    useTransactionSizeHistogram
} from './DashboardSelectors';
import DashboardFilter from "./DashboardFilter";
import {Stack} from "@mui/system";
import DashboardBarChart from "./DashboardBarChart";
import HeatmapChartCard from "./HeatmapChartCard";
import DashboardCard from "./DashboardCard";
import {getCurrentMonthKey} from "../common/Utilities";

interface FilterProps {
    startDate: Date | null;
    endDate: Date | null;
}

const dayKey = (d: Date): string => {
    const date = new Date(d);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
};

export const Dashboard: FC = () => {
    const [filters, setFilters] = useState<FilterProps>({startDate: null , endDate: null });

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

    const cashflow = useCashflowDailyInRange({
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
    const heatmap = useWeekdayHourHeatmap({ range: {
        start: filters.startDate,
        end: filters.endDate
    }});

    const hist = useTransactionSizeHistogram({ range: {
        start: filters.startDate,
        end: filters.endDate
    }});

    // ------------------------------------------------
    const accountContext = useAccountContext();
    const transactionContext = useTransactionContext();
    const balanceContext = useBalanceContext();

    const [balanceDateSet, setBalanceDateSet] = useState<Set<string>>(new Set<string>());
    const [balanceSeries, setBalanceSerires] = useState<{name: string, data: number[]}[]>([]);
    const [transactionDateSet, setTransactionDateSet] = useState<Set<string>>(new Set<string>());
    const [transactionSeries, setTransactionSerires] = useState<{name: TransactionTypeEnum, data: number[]}[]>([]);

    const filteredBalances = useMemo(() => {
        // Normalize date bounds
        const startTs =
            filters.startDate ? new Date(filters.startDate).setHours(0, 0, 0, 0) : null;
        const endTs =
            filters.endDate ? new Date(filters.endDate).setHours(23, 59, 59, 999) : null;

        const results = (balanceContext.balances ?? []).filter((t) => {
            const tTime = new Date(t.date as any).getTime();
            if (Number.isNaN(tTime)) return false;

            const startMatch = startTs != null ? tTime >= startTs : true;
            const endMatch = endTs != null ? tTime <= endTs : true;

            return (
                startMatch &&
                endMatch
            );
        });

        // Sort by date descending (newest first)
        return results.sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );
    }, [balanceContext.balances, filters]);

    const filteredTransactions = useMemo(() => {
        // Normalize date bounds
        const startTs =
            filters.startDate ? new Date(filters.startDate).setHours(0, 0, 0, 0) : null;
        const endTs =
            filters.endDate ? new Date(filters.endDate).setHours(23, 59, 59, 999) : null;

        const results = (transactionContext.transactions ?? []).filter((t) => {
            const tTime = new Date(t.date as any).getTime();
            if (Number.isNaN(tTime)) return false;

            const startMatch = startTs != null ? tTime >= startTs : true;
            const endMatch = endTs != null ? tTime <= endTs : true;

            return (
                startMatch &&
                endMatch
            );
        });

        // Sort by date descending (newest first)
        return results.sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );
    }, [transactionContext.transactions, filters]);

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

        setBalanceSerires(accountContext.accounts.map((acc) => {
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

        setTransactionSerires(TYPE_LABELS.map(type => {
            const m = txByTypeByDay.get(type)!;
            const data = categories.map(d => m.get(d) ?? 0);
            return { name: type, data };
        }));

    }, [filteredTransactions])

    const currentMonthKey = getCurrentMonthKey();

    return (
        <>
            <Box>
                <Grid container spacing={3}>
                    <DashboardTopCards
                        accounts={accountContext.accounts}
                        balances={balanceContext.balances}
                    />
                </Grid>

                <Stack
                    justifyContent="space-between"
                    direction={{ xs: "column", sm: "row" }}
                    spacing={{ xs: 1, sm: 2, md: 4}}
                    mt={3}
                >
                    <DashboardFilter filters={filters} setFilters={setFilters}/>
                </Stack>

                <Grid container spacing={3} mt={3}>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <DashboardCard
                            title="Income"
                            currentMonth={currentMonthKey}
                            currentMonthStats={income}
                            pastMonth={""}
                            pastMonthStats={""}
                            color="primary"
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <DashboardCard
                            title="Spend"
                            currentMonth={currentMonthKey}
                            currentMonthStats={spend}
                            pastMonth={""}
                            pastMonthStats={""}
                            color="error"
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <DashboardCard
                            title="Net Cashflow"
                            currentMonth={currentMonthKey}
                            currentMonthStats={netCashFlow}
                            pastMonth={""}
                            pastMonthStats={""}
                            color="secondary"
                        />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <DashboardCard
                            title="Processed %"
                            currentMonth={currentMonthKey}
                            currentMonthStats={`${Math.round(processedPct * 100)}%`}
                            pastMonth={""}
                            pastMonthStats={""}
                            color=""
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

                <Grid container spacing={1} mt={3}>
                    <DashboardBarChart
                        title={`Transaction Breakdown (MTD)`}
                        categories={spendByTransactionType.rows.map(c => c.type)}
                        series={[{
                            name: '',
                            data: spendByTransactionType.rows.map(c => c.total)
                        }]}
                    />
                    <DashboardBarChart
                        title={`Category Breakdown (MTD) — Total: ${cat.totalAll}`}
                        categories={cat.rows.map(c => c.categoryName)}
                        series={[{
                            name: '',
                            data: cat.rows.map(c => c.total)
                        }]}
                    />
                    <DashboardBarChart
                        title={`Top Stores (MTD)`}
                        categories={topStores.map(s => s.storeName)}
                        series={[{
                            name: '',
                            data: topStores.map(s => s.total)
                        }]}
                    />
                    <DashboardBarChart
                        title={`Spend by Person (MTD)`}
                        categories={spendByPerson.map(s => s.personName)}
                        series={[{
                            name: '',
                            data: spendByPerson.map(s => s.total)
                        }]}
                    />

                    <DashboardBarChart
                        title="Weekday Spend"
                        categories={weekday.labels}
                        series={[{ name: 'Expense', data: weekday.series }]}
                    />

                    <DashboardBarChart
                        title="Transaction Size Histogram"
                        categories={hist.labels}
                        series={[{ name: 'Count', data: hist.series }]}
                    />
                </Grid>
            </Box>
            <Container sx={{ py: 3 }}>
                <Grid container spacing={2}>

                    {/* Net worth by currency */}
                    {/*<Grid size={12}>*/}
                    {/*    <Card>*/}
                    {/*        <CardHeader title="Net Worth by Currency (latest balances)" />*/}
                    {/*        <CardContent>*/}
                    {/*            <List dense>*/}
                    {/*                {netWorth.map((r) => (*/}
                    {/*                    <ListItem key={r.currency} disableGutters>*/}
                    {/*                        <ListItemText primary={r.currency} secondary={r.value.toFixed(2)} />*/}
                    {/*                    </ListItem>*/}
                    {/*                ))}*/}
                    {/*            </List>*/}
                    {/*        </CardContent>*/}
                    {/*    </Card>*/}
                    {/*</Grid>*/}

                    {/*<NumberCard*/}
                    {/*    label="Savings"*/}
                    {/*    value={`${savings.saved.toFixed(2)} (${Math.round(savings.rate * 100)}%)`}*/}
                    {/*    hint={`Income ${savings.income.toFixed(2)} • Expense ${savings.expense.toFixed(2)}`}*/}
                    {/*/>*/}

                    <HeatmapChartCard
                        title="Weekday × Hour Heatmap"
                        series={heatmap.series}
                    />
                </Grid>
            </Container>
        </>
    );
}