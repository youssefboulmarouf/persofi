import {Grid} from "@mui/material";
import DashboardCard from "./DashboardCard";
import {FC} from "react";
import {AccountJson, AccountTypeEnum, BalanceJson} from "../../model/PersofiModels";
import {getCurrentMonthKey, getPastMonthKey} from "../common/Utilities";

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
    const endOfLastMonth   = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

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

    return (
        <>
            {accounts.map((acc) => (
                <Grid size={{ xs: 12, sm: 6, md: 3, lg: 3 }} key={acc.id}>
                    <DashboardCard
                        title={acc.name}
                        currentMonth={currentMonthKey}
                        currentMonthStats={getLastBalanceAmount(balancesByAccount, acc.id)}
                        pastMonth={pastMonthKey}
                        pastMonthStats={getLatestBalanceAmountInWindow(balancesByAccount, acc.id, startOfLastMonth, endOfLastMonth)}
                        color={deduceCardColor(acc)}
                    />
                </Grid>
            ))}
        </>
    );
};

export default DashboardTopCards;