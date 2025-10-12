import {FC, useMemo, useState} from "react";
import Breadcrumb from "../common/Breadcrumb";
import {Card, CardContent, Grid} from "@mui/material";
import {Stack} from "@mui/system";
import TableCallToActionButton from "../common/TableCallToActionButton";
import Box from "@mui/material/Box";
import {useDialogController} from "../common/useDialogController";
import {ModalTypeEnum, TransactionItemJson, TransactionJson, TransactionTypeEnum} from "../../model/PersofiModels";
import {useTransactionContext} from "../../context/TransactionContext";
import TransactionsFilter from "./TransactionsFilter";
import {TransactionsList} from "./TransactionsList";
import {TransactionDialog} from "./TransactionDialog";
import {useAccountContext} from "../../context/AccountContext";
import {useCategoryContext} from "../../context/CategoryContext";
import {useProductContext} from "../../context/ProductContext";
import {useStoreContext} from "../../context/StoreContext";
import {usePersonContext} from "../../context/PersonContext";
import {TransactionRefundDialog} from "./TransactionRefundDialog";

interface FilterProps {
    searchTerm: string;
    type: TransactionTypeEnum | null;
    unprocessed: boolean;
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

const emptyItem: TransactionItemJson = {
    id: 0,
    description: "",
    quantity: 0,
    unitPrice: 0,
    lineTotal: 0,
    transactionId: 0,
    variantId: null,
    categoryId: null,
    brandId: null,
};

export const Transactions: FC = () => {
    const [filters, setFilters] = useState<FilterProps>({ searchTerm: "", type: null, unprocessed: false });
    const transactionDialog = useDialogController<TransactionJson>(emptyTransaction);
    const refundTransactionDialog = useDialogController<TransactionJson>(emptyTransaction);
    const transactionContext = useTransactionContext();
    const accountContext = useAccountContext();
    const categoryContext = useCategoryContext();
    const productContext = useProductContext();
    const storeContext = useStoreContext();
    const personContext = usePersonContext();

    const filteredTransactions = useMemo(() => {
        const searchTerm = filters.searchTerm.toLowerCase();

        return transactionContext.transactions.filter((t) => {
            const nonMatchInitBalance = t.type !== TransactionTypeEnum.INIT_BALANCE;
            const notesMatch = filters.searchTerm ? (t.notes ?? "").toLowerCase().includes(searchTerm) : true;
            const typeMatch = filters.type ? filters.type === t.type : true;
            const unprocessedMatch = filters.unprocessed ? !t.processed : true;
            return nonMatchInitBalance && notesMatch && typeMatch && unprocessedMatch;
        });
    }, [transactionContext.transactions, filters]);

    const processTransaction = async (tx: TransactionJson) => {
        await transactionContext.transactionProcessing(tx);
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
                                products={productContext.products}
                                openTransactionDialogWithType={transactionDialog.openDialog}
                                openRefundTransactionDialog={refundTransactionDialog.openDialog}
                                isLoading={transactionContext.loading}
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
                transactionContext={transactionContext}
                accountContext={accountContext}
                categoryContext={categoryContext}
                productContext={productContext}
                storeContext={storeContext}
                personContext={personContext}
            />

            <TransactionRefundDialog
                transactionToRefund={refundTransactionDialog.data}
                openDialog={refundTransactionDialog.open}
                closeDialog={refundTransactionDialog.closeDialog}
                accountContext={accountContext}
                transactionContext={transactionContext}
                products={productContext.products}
            />
        </>
    );
};
