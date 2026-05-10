import { Grid, Typography, Box } from "@mui/material";
import DashboardCard from "./DashboardCard";
import { FC } from "react";
import { AccountJson, AccountTypeEnum, BalanceJson } from "../../model/PersofiModels";
import { getCurrentMonthKey, getPastMonthKey } from "../common/Utilities";

interface DashboardTopCardsProps {
    accounts: AccountJson[];
    balances: BalanceJson[];
}

const indexBalancesByAccount = (balances: BalanceJson[]): Map<number, BalanceJson[]> => {
    const sortedBalances = balances.slice().sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const byAcc = new Map<number, BalanceJson[]>();

    for (const balance of sortedBalances) {
        const accountBalances = byAcc.get(balance.accountId);
        if (accountBalances) accountBalances.push(balance);
        else byAcc.set(balance.accountId, [balance]);
    }

    return byAcc;
}

const getLastBalanceAmount = (byAcc: Map<number, BalanceJson[]>, accountId: number): number => {
    const accountBalances = byAcc.get(accountId);

    if (!accountBalances || accountBalances.length === 0) return 0;

    return accountBalances[accountBalances.length - 1].amount;
}

const getLatestBalanceAmountInWindow = (byAcc: Map<number, BalanceJson[]>, accountId: number, start: Date, end: Date): number => {
    const accountBalances = byAcc.get(accountId);
    if (!accountBalances || accountBalances.length === 0) return 0;

    const startTs = start.getTime();
    const endTs = end.getTime();

    let latestAmount = 0;
    let latestTs = 0;

    for (const balance of accountBalances) {
        const ts = new Date(balance.date).getTime();

        if (ts >= startTs && ts <= endTs && ts > latestTs) {
            latestTs = ts;
            latestAmount = balance.amount;
        }
    }
    return latestAmount;
}

const DashboardTopCards: FC<DashboardTopCardsProps> = ({ accounts, balances }) => {
    const balancesByAccount = indexBalancesByAccount(balances);

    const now = new Date();
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    const currentMonthKey = getCurrentMonthKey();
    const pastMonthKey = getPastMonthKey();

    const deduceCardColor = (account: AccountJson): string => {
        switch (account.accountType) {
            case AccountTypeEnum.CASH: return "secondary";
            case AccountTypeEnum.DEBIT: return "primary";
            case AccountTypeEnum.CREDIT: return "error";
            case AccountTypeEnum.SAVING: return "success";
            default: return "info";
        }
    }

    // Group accounts by type
    const accountTypes = [AccountTypeEnum.CASH, AccountTypeEnum.DEBIT, AccountTypeEnum.CREDIT, AccountTypeEnum.SAVING];

    const typeSummaries = accountTypes.map(type => {
        const typeAccounts = accounts.filter(a => a.accountType === type);
        let currentTotal = 0;
        let pastTotal = 0;

        typeAccounts.forEach(acc => {
            currentTotal += getLastBalanceAmount(balancesByAccount, acc.id);
            pastTotal += getLatestBalanceAmountInWindow(balancesByAccount, acc.id, startOfLastMonth, endOfLastMonth);
        });

        return {
            type,
            currentTotal,
            pastTotal,
            accounts: typeAccounts
        };
    });

    return (
        <>
            {/* Top Summaries */}
            <Grid container spacing={3} sx={{ width: '100%', mb: 4 }}>
                {typeSummaries.map(summary => (
                    <Grid size={{ xs: 12, sm: 6, md: 3 }} key={summary.type + "_summary"}>
                        <DashboardCard
                            title={`${summary.type} Total`}
                            currentMonth={currentMonthKey}
                            currentMonthStats={Number(summary.currentTotal).toFixed(2)}
                            pastMonth={pastMonthKey}
                            pastMonthStats={Number(summary.pastTotal).toFixed(2)}
                            color={deduceCardColor({ accountType: summary.type } as any)}
                        />
                    </Grid>
                ))}
            </Grid>
        </>
    );
};

export default DashboardTopCards;