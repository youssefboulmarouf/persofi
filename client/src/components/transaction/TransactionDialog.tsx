import React, {FC, useEffect, useState} from "react";
import {
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Stack,
    Tabs,
    TextField
} from "@mui/material";
import Button from "@mui/material/Button";
import LoadingComponent from "../common/LoadingComponent";
import FormLabel from "../common/FormLabel";
import {getActionButton} from "../common/Utilities";
import {
    AccountJson,
    ModalTypeEnum, PersonJson, StoreJson,
    TransactionItemJson,
    TransactionJson,
    TransactionTypeEnum
} from "../../model/PersofiModels";
import { useTransactions, useAddTransaction, useUpdateTransaction, useDeleteTransaction } from "../../hooks/useTransactions";
import { useAccounts } from "../../hooks/useAccounts";
import { useStores } from "../../hooks/useStores";
import { usePersons } from "../../hooks/usePersons";
import {TabContext, TabPanel} from "@mui/lab";
import Tab from "@mui/material/Tab";
import Box from "@mui/material/Box";
import {IncomeForm} from "./transaction-forms/IncomeForm";
import {TransferForm} from "./transaction-forms/TransferForm";
import {CreditPaymentForm} from "./transaction-forms/CreditPaymentForm";
import {TransactionItemDialog} from "./TransactionItemDialog";
import {useDialogController} from "../common/useDialogController";
import {ExpenseForm} from "./transaction-forms/ExpenseForm";

interface TransactionDialogProps {
    selectedTransaction: TransactionJson;
    dialogType: ModalTypeEnum;
    openDialog: boolean;
    closeDialog: () => void;
}

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

export const TransactionDialog: FC<TransactionDialogProps> = ({
    selectedTransaction,
    dialogType,
    openDialog,
    closeDialog,
}) => {
    const [dateStr, setDateStr] = useState<string>("");
    const [type, setType] = useState<TransactionTypeEnum>(TransactionTypeEnum.EXPENSE);
    const [notes, setNotes] = useState<string>("");
    const [processed, setProcessed] = useState<boolean>(false);

    const [payAccount, setPayAccount] = useState<AccountJson | null>(null);
    const [counterPartyAccount, setCounterPartyAccount] = useState<AccountJson | null>(null);
    const [items, setItems] = useState<TransactionItemJson[]>([]);
    const [subtotal, setSubtotal] = useState<number>(0);
    const [taxTotal, setTaxTotal] = useState<number>(0);
    const [grandTotal, setGrandTotal] = useState<number>(0);
    const [amount, setAmount] = useState<number>(0);
    const [refundOf, setRefundOf] = useState<TransactionJson | null>(null);
    const [store, setStore] = useState<StoreJson | null>(null);
    const [person, setPerson] = useState<PersonJson | null>(null);

    const [isLoading, setIsLoading] = useState<boolean>(false);

    const itemDialog = useDialogController<TransactionItemJson>(emptyItem);

    const { mutateAsync: addTransaction } = useAddTransaction();
    const { mutateAsync: updateTransaction } = useUpdateTransaction();
    const { mutateAsync: deleteTransaction } = useDeleteTransaction();

    const { data: transactionsData } = useTransactions();
    const transactions = transactionsData || [];
    const { data: accountsData } = useAccounts();
    const accounts = accountsData || [];
    const { data: storesData } = useStores();
    const stores = storesData || [];
    const { data: personsData } = usePersons();
    const persons = personsData || [];

    useEffect(() => {
        setDateStr(
            selectedTransaction?.date
                ? new Date(selectedTransaction.date).toISOString().slice(0, 10)
                : new Date().toISOString().slice(0, 10)
        );
        setPayAccount(accounts.find(a => a.id === selectedTransaction.payAccountId) ?? null);
        setCounterPartyAccount(accounts.find(a => a.id === selectedTransaction.counterpartyAccountId) ?? null);
        setType(selectedTransaction.type);
        setNotes(selectedTransaction.notes);
        setProcessed(selectedTransaction.processed);
        setItems(selectedTransaction.items);
        setSubtotal(selectedTransaction.subtotal);
        setTaxTotal(selectedTransaction.taxTotal);
        setGrandTotal(selectedTransaction.grandTotal);
        setAmount(selectedTransaction.amount);
        setStore(stores.filter(st => st.id === selectedTransaction.storeId)[0] ?? null);
        setPerson(persons.filter(pr => pr.id === selectedTransaction.personId)[0] ?? null);
        setRefundOf(transactions.filter(tr => tr.id === selectedTransaction.refundOfId)[0] ?? null);
    }, [openDialog, selectedTransaction, accounts, stores, persons, transactions]);

    useEffect(() => {
        const newSubtotal = (items ?? []).reduce((acc, i) => acc + (i.lineTotal || 0), 0);
        setSubtotal(parseFloat(newSubtotal.toFixed(2)));
    }, [items]);

    useEffect(() => {
        const newGrand = (subtotal || 0) + (taxTotal || 0);
        setGrandTotal(parseFloat(newGrand.toFixed(2)));
    }, [subtotal, taxTotal]);

    const handleRemoveItem = (itemToRemove: TransactionItemJson) => {
        setItems((prev) => prev.filter((item) => item !== itemToRemove));
    }

    const handleAddItem = (itemToAdd: TransactionItemJson) => {
        setItems((prev) => [...prev, itemToAdd]);
    }

    const emptyForm = () => {
        setDateStr(new Date().toISOString().slice(0, 10));
        setType(TransactionTypeEnum.EXPENSE);
        setNotes("");
        setProcessed(false);
        setItems([]);
        setSubtotal(0);
        setTaxTotal(0);
        setGrandTotal(0);
        setAmount(0);

        closeDialog();
    }

    const onConfirm = async () => {
        if (processed || type === null) return;

        setIsLoading(true);
        const tx: TransactionJson = {
            id: 0,
            date: new Date(dateStr),
            type: type,
            notes: notes.trim(),
            processed: false,
            items,
            payAccountId: payAccount?.id ?? null,
            counterpartyAccountId: counterPartyAccount?.id ?? null,
            storeId: store?.id ?? null,
            personId: person?.id ?? null,
            refundOfId: refundOf?.id ?? null,
            subtotal,
            taxTotal,
            grandTotal,
            amount
        };

        if (dialogType === ModalTypeEnum.ADD) {
            await addTransaction(tx);
        } else if (dialogType === ModalTypeEnum.UPDATE) {
            if (selectedTransaction.processed) {
                console.log("Transaction processed, cannot update");
                return;
            }
            await updateTransaction({...tx, id: selectedTransaction.id});
        } else if (dialogType === ModalTypeEnum.DELETE) {
            if (selectedTransaction.processed) {
                console.log("Transaction processed, cannot delete");
                return;
            }
            await deleteTransaction(tx);
        }
        setIsLoading(false);
        emptyForm();
    }

    const handleTabChange = (event: React.SyntheticEvent, newValue: TransactionTypeEnum) => {
        setType(newValue);
    }

    const validateForm = (): boolean => {
        if (processed) return false;

        switch (type) {
            case TransactionTypeEnum.EXPENSE:
                return payAccount !== null
                    && counterPartyAccount === null
                    && subtotal > 0
                    && taxTotal >= 0
                    && grandTotal === subtotal + taxTotal
                    && amount === 0
                    && refundOf === null;
            case TransactionTypeEnum.INCOME:
                return payAccount == null
                    && counterPartyAccount !== null
                    && subtotal === 0
                    && taxTotal === 0
                    && grandTotal === 0
                    && amount > 0
                    && refundOf === null;
            case TransactionTypeEnum.CREDIT_PAYMENT:
            case TransactionTypeEnum.TRANSFER:
                return payAccount !== null
                    && counterPartyAccount !== null
                    && subtotal === 0
                    && taxTotal === 0
                    && grandTotal === 0
                    && amount > 0
                    && refundOf === null;
                case TransactionTypeEnum.REFUND:
                    return payAccount == null
                        && counterPartyAccount !== null
                        && subtotal > 0
                        && taxTotal >= 0
                        && grandTotal === subtotal + taxTotal
                        && amount === 0
                        && refundOf !== null;
            default: return false;
        }
    }

    return (
        <>
            <Dialog open={openDialog} onClose={() => emptyForm()} PaperProps={{sx: {width: '900px', maxWidth: '900px'}}}>
                <DialogTitle sx={{ mt: 2, pb: 0 }}>
                    {dialogType} Transaction
                </DialogTitle>

                <DialogContent>
                    {isLoading ? (
                        <LoadingComponent message={"Processing..."} />
                    ) : (
                        <Stack spacing={2} sx={{ mt: 1 }}>

                            {/* ── Date + Notes side by side ── */}
                            <Stack direction="row" spacing={2}>
                                <Box sx={{ width: '35%' }}>
                                    <FormLabel>Date</FormLabel>
                                    <TextField
                                        fullWidth
                                        type="date"
                                        value={dateStr}
                                        onChange={(e) => setDateStr(e.target.value)}
                                        disabled={dialogType === ModalTypeEnum.DELETE || processed}
                                        size="small"
                                    />
                                </Box>
                                <Box sx={{ flex: 1 }}>
                                    <FormLabel>Notes <span style={{ fontWeight: 400, opacity: 0.55, fontSize: '0.8em' }}>(optional)</span></FormLabel>
                                    <TextField
                                        fullWidth
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        placeholder="e.g. Monthly groceries run"
                                        disabled={dialogType === ModalTypeEnum.DELETE || processed}
                                        size="small"
                                    />
                                </Box>
                            </Stack>

                            {/* ── Type tabs ── */}
                            <TabContext value={type ?? TransactionTypeEnum.EXPENSE}>
                                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                                    <Tabs
                                        value={type}
                                        onChange={handleTabChange}
                                        variant="scrollable"
                                        scrollButtons="auto"
                                    >
                                        <Tab
                                            label="🛒 Expense"
                                            value={TransactionTypeEnum.EXPENSE}
                                            disabled={dialogType === ModalTypeEnum.UPDATE || dialogType === ModalTypeEnum.DELETE}
                                        />
                                        <Tab
                                            label="💰 Income"
                                            value={TransactionTypeEnum.INCOME}
                                            disabled={dialogType === ModalTypeEnum.UPDATE || dialogType === ModalTypeEnum.DELETE}
                                        />
                                        <Tab
                                            label="↔️ Transfer"
                                            value={TransactionTypeEnum.TRANSFER}
                                            disabled={dialogType === ModalTypeEnum.UPDATE || dialogType === ModalTypeEnum.DELETE}
                                        />
                                        <Tab
                                            label="💳 Credit Payment"
                                            value={TransactionTypeEnum.CREDIT_PAYMENT}
                                            disabled={dialogType === ModalTypeEnum.UPDATE || dialogType === ModalTypeEnum.DELETE}
                                        />
                                    </Tabs>
                                </Box>
                                <TabPanel value={TransactionTypeEnum.EXPENSE}>
                                    <ExpenseForm
                                        selectedTransaction={selectedTransaction}
                                        payAccount={payAccount}
                                        setPayAccount={setPayAccount}
                                        person={person}
                                        setPerson={setPerson}
                                        store={store}
                                        setStore={setStore}
                                        items={items}
                                        subtotal={subtotal}
                                        taxTotal={taxTotal}
                                        setTaxTotal={setTaxTotal}
                                        grandTotal={grandTotal}
                                        handleRemoveItem={handleRemoveItem}
                                        openItemDialogWithType={itemDialog.openDialog}
                                        dialogType={dialogType}
                                    />
                                </TabPanel>
                                <TabPanel value={TransactionTypeEnum.INCOME}>
                                    <IncomeForm
                                        selectedTransaction={selectedTransaction}
                                        counterPartyAccount={counterPartyAccount}
                                        setCounterPartyAccount={setCounterPartyAccount}
                                        amount={amount}
                                        setAmount={setAmount}
                                        dialogType={dialogType}
                                    />
                                </TabPanel>
                                <TabPanel value={TransactionTypeEnum.TRANSFER}>
                                    <TransferForm
                                        selectedTransaction={selectedTransaction}
                                        payAccount={payAccount}
                                        setPayAccount={setPayAccount}
                                        counterPartyAccount={counterPartyAccount}
                                        setCounterPartyAccount={setCounterPartyAccount}
                                        amount={amount}
                                        setAmount={setAmount}
                                        dialogType={dialogType}
                                    />
                                </TabPanel>
                                <TabPanel value={TransactionTypeEnum.CREDIT_PAYMENT}>
                                    <CreditPaymentForm
                                        selectedTransaction={selectedTransaction}
                                        payAccount={payAccount}
                                        setPayAccount={setPayAccount}
                                        counterPartyAccount={counterPartyAccount}
                                        setCounterPartyAccount={setCounterPartyAccount}
                                        amount={amount}
                                        setAmount={setAmount}
                                        dialogType={dialogType}
                                    />
                                </TabPanel>
                            </TabContext>

                            {/* ── Live total summary ── */}
                            {validateForm() && (
                                <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 1 }}>
                                    <Chip
                                        label={`Total: ${(grandTotal > 0 ? grandTotal : amount).toFixed(2)}`}
                                        color="primary"
                                        variant="outlined"
                                        sx={{ fontWeight: 700, fontSize: '1rem', px: 1 }}
                                    />
                                </Box>
                            )}

                        </Stack>
                    )}
                </DialogContent>

                <DialogActions>{
                    getActionButton(
                        dialogType,
                        onConfirm,
                        `${dialogType} Transaction`,
                        !validateForm())
                    }
                    <Button variant="outlined" onClick={emptyForm}>Cancel</Button>
                </DialogActions>
            </Dialog>

            <TransactionItemDialog
                selectedTransaction={selectedTransaction}
                selectedItem={itemDialog.data}
                dialogType={itemDialog.type}
                openDialog={itemDialog.open}
                closeDialog={itemDialog.closeDialog}
                handleAddItem={handleAddItem}
            />
        </>
    );
};
