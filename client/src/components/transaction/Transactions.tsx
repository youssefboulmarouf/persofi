import { FC, useMemo, useState } from "react";
import Breadcrumb from "../common/Breadcrumb";
import { Card, CardContent, Grid } from "@mui/material";
import { Stack } from "@mui/system";
import TableCallToActionButton from "../common/TableCallToActionButton";
import Box from "@mui/material/Box";
import { useDialogController } from "../common/useDialogController";
import { ModalTypeEnum, TransactionItemJson, TransactionJson, TransactionTypeEnum } from "../../model/PersofiModels";
import { useTransactions, useProcessTransaction } from "../../hooks/useTransactions";
import TransactionsFilter from "./TransactionsFilter";
import { TransactionsList } from "./TransactionsList";
import { TransactionDialog } from "./TransactionDialog";
import { TransactionRefundDialog } from "./TransactionRefundDialog";
import { getFirstDayOfCurrentMonth } from "../common/Utilities";
import { useAccounts } from "../../hooks/useAccounts";
import { useProducts } from "../../hooks/useProducts";

interface FilterProps {
    searchTerm: string;
    type: TransactionTypeEnum | null;
    unprocessed: boolean;
    startDate: Date | null;
    endDate: Date | null;
}

const bCrumb = [
    { to: "/", title: "Home" },
    { title: "Transactions" },
];

const emptyTransaction: TransactionJson = {
    id: 0,
    date: new Date(),
    type: TransactionTypeEnum.EXPENSE,
    notes: "",
    processed: false,
    items: [],
    payAccountId: null,
    counterpartyAccountId: null,
    storeId: null,
    personId: null,
    refundOfId: null,
    subtotal: 0,
    taxTotal: 0,
    grandTotal: 0,
    amount: 0,
};

export const Transactions: FC = () => {
    const [filters, setFilters] = useState<FilterProps>({
        searchTerm: "",
        type: null,
        unprocessed: false,
        startDate: getFirstDayOfCurrentMonth(),
        endDate: null
    });
    const transactionDialog = useDialogController<TransactionJson>(emptyTransaction);
    const refundTransactionDialog = useDialogController<TransactionJson>(emptyTransaction);

    const { data: transactionsData, isLoading: isTransactionsLoading } = useTransactions();
    const transactions = transactionsData || [];
    const { mutateAsync: processTx } = useProcessTransaction();

    const { data: accountsData } = useAccounts();
    const accounts = accountsData || [];

    const { data: productsData } = useProducts();
    const products = productsData || [];

    const filteredTransactions = useMemo(() => {
        const q = (filters.searchTerm ?? "").toLowerCase().trim();

        // Normalize date bounds
        const startTs =
            filters.startDate ? new Date(filters.startDate).setHours(0, 0, 0, 0) : null;
        const endTs =
            filters.endDate ? new Date(filters.endDate).setHours(23, 59, 59, 999) : null;

        const typeIsSet = filters.type !== undefined && filters.type !== null;

        const results = transactions.filter((t) => {
            // The date field is typed as Date but arrives as an ISO string from JSON.
            // Slice to YYYY-MM-DD and append local midnight to avoid UTC→local day shift.
            const dateStr = String(t.date).slice(0, 10);
            const tTime = new Date(dateStr + 'T00:00:00').getTime();
            if (Number.isNaN(tTime)) return false;

            const nonInitBalance = t.type !== TransactionTypeEnum.INIT_BALANCE;
            const notesMatch = q ? (t.notes ?? "").toLowerCase().includes(q) : true;
            const typeMatch = typeIsSet ? t.type === filters.type : true;
            const unprocessedMatch = filters.unprocessed ? !t.processed : true;

            const startMatch = startTs != null ? tTime >= startTs : true;
            const endMatch = endTs != null ? tTime <= endTs : true;

            return (
                nonInitBalance &&
                notesMatch &&
                typeMatch &&
                unprocessedMatch &&
                startMatch &&
                endMatch
            );
        });

        // Sort by date descending (newest first)
        return results.sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );
    }, [transactions, filters]);

    const processTransaction = async (tx: TransactionJson) => {
        await processTx(tx);
    }

    return (
        <>
            <Breadcrumb title="Transactions" items={bCrumb} />
            <Grid container mt={3}>
                <Card sx={{ padding: 0, borderColor: (theme) => theme.palette.divider }} variant="outlined">
                    <CardContent>
                        <Stack justifyContent="space-between" direction={{ xs: "column", sm: "row" }} spacing={{ xs: 1, sm: 2, md: 4 }}>
                            <TransactionsFilter filters={filters} setFilters={setFilters} />
                            <TableCallToActionButton
                                fullwidth={false}
                                callToActionText="Add Transaction"
                                callToActionFunction={() => transactionDialog.openDialog(ModalTypeEnum.ADD, emptyTransaction)}
                            />
                        </Stack>
                        <Box sx={{ overflowX: "auto" }} mt={3}>
                            <TransactionsList
                                transactions={filteredTransactions}
                                products={products}
                                accounts={accounts}
                                openTransactionDialogWithType={transactionDialog.openDialog}
                                openRefundTransactionDialog={refundTransactionDialog.openDialog}
                                isLoading={isTransactionsLoading}
                                processTransaction={processTransaction}
                            />
                        </Box>
                    </CardContent>
                </Card>
            </Grid>

            <TransactionDialog
                selectedTransaction={transactionDialog.data}
                dialogType={transactionDialog.type}
                openDialog={transactionDialog.open}
                closeDialog={transactionDialog.closeDialog}
            />

            <TransactionRefundDialog
                transactionToRefund={refundTransactionDialog.data}
                openDialog={refundTransactionDialog.open}
                closeDialog={refundTransactionDialog.closeDialog}
                accounts={accounts}
                products={products}
            />
        </>
    );
};
