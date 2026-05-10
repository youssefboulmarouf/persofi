import {
    AccountJson,
    AccountTypeEnum,
    CurrencyEnum,
    ModalTypeEnum,
    TransactionTypeEnum
} from "../../model/PersofiModels";
import {FC, useEffect, useState} from "react";
import {getActionButton} from "../common/Utilities";
import {Autocomplete, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Switch, TextField} from "@mui/material";
import LoadingComponent from "../common/LoadingComponent";
import FormLabel from "../common/FormLabel";
import Button from "@mui/material/Button";
import { useAddAccount, useUpdateAccount, useDeleteAccount } from "../../hooks/useAccounts";
import { useTransactions, useAddTransaction, useDeleteTransaction, useProcessTransaction } from "../../hooks/useTransactions";
import { useBalances, useDeleteBalance } from "../../hooks/useBalances";

interface AccountDialogProps {
    selectedAccount: AccountJson;
    dialogType: ModalTypeEnum;
    openDialog: boolean;
    closeDialog: () => void;
}

export const AccountDialog: FC<AccountDialogProps> = ({
    selectedAccount,
    dialogType,
    openDialog,
    closeDialog
}) => {
    const [accountName, setAccountName] = useState<string>("");
    const [accountInitBalance, setAccountInitBalance] = useState<number>(0);
    const [accountType, setAccountType] = useState<AccountTypeEnum | null>(null);
    const [accountCurrency, setAccountCurrency] = useState<CurrencyEnum | null>(null);
    const [isActive, setIsActive] = useState<boolean>(true);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const { mutateAsync: addAccount } = useAddAccount();
    const { mutateAsync: updateAccount } = useUpdateAccount();
    const { mutateAsync: deleteAccount } = useDeleteAccount();
    
    const { data: transactionsData } = useTransactions();
    const transactions = transactionsData || [];
    const { mutateAsync: addTransaction } = useAddTransaction();
    const { mutateAsync: deleteTransaction } = useDeleteTransaction();
    const { mutateAsync: processTransaction } = useProcessTransaction();

    const { data: balancesData } = useBalances();
    const balances = balancesData || [];
    const { mutateAsync: deleteBalance } = useDeleteBalance();

    useEffect(() => {
        setAccountName(selectedAccount.name);
        setAccountInitBalance(0);
        setAccountType(selectedAccount.accountType);
        setAccountCurrency(selectedAccount.currency);
        setIsActive(selectedAccount.active ?? true);
    }, [selectedAccount, dialogType]);

    const emptyForm = () => {
        setAccountName("");
        setAccountInitBalance(0);
        setAccountType(AccountTypeEnum.CREDIT);
        setAccountCurrency(CurrencyEnum.CAD);
        setIsActive(true);

        closeDialog();
    }

    const handleSubmit = async () => {
        if (!accountName || !accountCurrency || !accountType) {
            // show error
            console.log(`Missing accountName, accountCurrency and/or accountType`)
            return;
        }
        setIsLoading(true);

        try {
            if (dialogType === ModalTypeEnum.DELETE) {
                const accountTransactions = transactions
                    .filter(tr => tr.payAccountId == selectedAccount.id || tr.counterpartyAccountId == selectedAccount.id);

                if (accountTransactions.length > 1) {
                    console.log(`Account with [id=${selectedAccount.id}] have ${accountTransactions.length} transactions, deactivate instead of delete`)
                    await updateAccount({
                        id: selectedAccount.id,
                        name: selectedAccount.name,
                        accountType: selectedAccount.accountType,
                        active: false,
                        currency: selectedAccount.currency
                    });
                } else {
                    if (accountTransactions.length === 1) {
                        const accountBalance = balances
                            .filter(bl => bl.accountId === selectedAccount.id && bl.transactionId === accountTransactions[0].id);

                        await Promise.all(accountBalance.map(async ab => await deleteBalance(ab)))
                        await deleteTransaction(accountTransactions[0])
                    }

                    await deleteAccount(selectedAccount);
                }
            } else if (dialogType === ModalTypeEnum.ADD) {
                const newAccount = await addAccount({
                    id: 0,
                    name: accountName,
                    accountType: accountType,
                    active: isActive,
                    currency: accountCurrency
                });

                if (newAccount != undefined) {
                    const newTransaction = await addTransaction({
                        id: 0,
                        date: new Date(),
                        type: TransactionTypeEnum.INIT_BALANCE,
                        notes: "",
                        processed: false,
                        items: [],
                        payAccountId: null,
                        counterpartyAccountId: newAccount.id,
                        storeId: null,
                        personId: null,
                        refundOfId: null,
                        subtotal: 0,
                        taxTotal: 0,
                        grandTotal: 0,
                        amount: accountInitBalance
                    });

                    if (newTransaction != undefined) {
                        await processTransaction(newTransaction);
                    }
                }
            } else {
                await updateAccount({
                    id: selectedAccount.id,
                    name: accountName,
                    accountType: accountType,
                    active: isActive,
                    currency: accountCurrency
                });
            }
            emptyForm();
        } catch (err) {
            console.log(`Error while ${dialogType} account`, err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={openDialog} onClose={() => emptyForm()} PaperProps={{sx: {width: '500px', maxWidth: '500px'}}}>
            <DialogTitle sx={{ mt: 2 }}>{dialogType} Account: {selectedAccount.name}</DialogTitle>
            <DialogContent>
                {isLoading ? (
                    <LoadingComponent message="Loading Accounts..." />
                ) : (
                    <Stack spacing={2}>
                        <FormLabel>Id</FormLabel>
                        <TextField fullWidth value={selectedAccount.id === 0 ? "" : selectedAccount.id} disabled />

                        <FormLabel>Account Name</FormLabel>
                        <TextField
                            fullWidth
                            value={accountName}
                            onChange={(e: any) => setAccountName(e.target.value)}
                            disabled={dialogType === ModalTypeEnum.DELETE}
                        />

                        {dialogType === ModalTypeEnum.ADD ? (
                            <>
                                <FormLabel>Account Initial Balance</FormLabel>
                                <TextField
                                    fullWidth
                                    value={accountInitBalance}
                                    onChange={(e: any) => setAccountInitBalance(e.target.value)}
                                />
                            </>
                        ) : ("")}

                        <FormLabel>Account Type</FormLabel>
                        <Autocomplete
                            options={[AccountTypeEnum.CASH, AccountTypeEnum.SAVING, AccountTypeEnum.CREDIT, AccountTypeEnum.DEBIT]}
                            fullWidth
                            getOptionLabel={(options) => options}
                            value={accountType}
                            onChange={(event: React.SyntheticEvent, newValue: AccountTypeEnum | null) =>
                                setAccountType(newValue)
                            }
                            renderInput={(params) => <TextField {...params} placeholder="Account Type" />}
                            disabled={dialogType === ModalTypeEnum.DELETE}
                        />

                        <FormLabel>Account Currency</FormLabel>
                        <Autocomplete
                            options={[CurrencyEnum.CAD, CurrencyEnum.MAD, CurrencyEnum.USD]}
                            fullWidth
                            getOptionLabel={(options) => options}
                            value={accountCurrency}
                            onChange={(event: React.SyntheticEvent, newValue: CurrencyEnum | null) =>
                                setAccountCurrency(newValue)
                            }
                            renderInput={(params) => <TextField {...params} placeholder="Account Currency" />}
                            disabled={dialogType === ModalTypeEnum.DELETE}
                        />

                        <FormLabel>Activate Account</FormLabel>
                        <Switch
                            checked={isActive}
                            onChange={(event: React.ChangeEvent<HTMLInputElement>, checked: boolean) =>
                                setIsActive(checked)
                            }
                            disabled={dialogType === ModalTypeEnum.DELETE}
                        />
                    </Stack>
                )}
            </DialogContent>
            <DialogActions>
                {
                    getActionButton(
                        dialogType,
                        handleSubmit,
                        `${dialogType} Account`,
                        accountName === "" || isLoading)
                }
                <Button variant="outlined" onClick={() => emptyForm()}>
                    Cancel
                </Button>
            </DialogActions>
        </Dialog>
    )
};