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
import {AccountContextValue} from "../../context/AccountContext";
import {TransactionContextValue} from "../../context/TransactionContext";
import {BalanceContextValue} from "../../context/BalanceContext";

interface AccountDialogProps {
    selectedAccount: AccountJson;
    dialogType: ModalTypeEnum;
    openDialog: boolean;
    closeDialog: () => void;
    accountContext: AccountContextValue;
    transactionContext: TransactionContextValue;
    balanceContext: BalanceContextValue;
}

export const AccountDialog: FC<AccountDialogProps> = ({
    selectedAccount,
    dialogType,
    openDialog,
    closeDialog,
    accountContext,
    transactionContext,
    balanceContext
}) => {
    const [accountName, setAccountName] = useState<string>("");
    const [accountType, setAccountType] = useState<AccountTypeEnum | null>(null);
    const [accountCurrency, setAccountCurrency] = useState<CurrencyEnum | null>(null);
    const [isActive, setIsActive] = useState<boolean>(true);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    useEffect(() => {
        setAccountName(selectedAccount.name);
        setAccountType(selectedAccount.accountType);
        setAccountCurrency(selectedAccount.currency);
        setIsActive(selectedAccount.active);
    }, [selectedAccount, dialogType]);

    const emptyForm = () => {
        setAccountName("");
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

        if (dialogType === ModalTypeEnum.DELETE) {
            let accountTransactions = transactionContext
                .transactions
                .filter(tr => tr.payAccountId == selectedAccount.id || tr.counterpartyAccountId == selectedAccount.id);

            if (accountTransactions.length > 1) {
                console.log(`Account with [id=${selectedAccount.id}] have ${accountTransactions.length} transactions, deactivate instead of delete`)
                await accountContext.editAccount({
                    id: selectedAccount.id,
                    name: selectedAccount.name,
                    accountType: selectedAccount.accountType,
                    active: false,
                    currency: selectedAccount.currency
                });
            } else if (accountTransactions.length === 1) {
                let accountBalance = balanceContext
                    .balances
                    .filter(bl => bl.accountId === selectedAccount.id && bl.transactionId === accountTransactions[0].id);

                await Promise.all(accountBalance.map(async ab => await balanceContext.removeBalance(ab)))
                await transactionContext.removeTransaction(accountTransactions[0])
                await accountContext.removeAccount(selectedAccount);
            } else {
                await accountContext.removeAccount(selectedAccount);
            }


        } else if (dialogType === ModalTypeEnum.ADD) {
            const newAccount = await accountContext.addAccount({
                id: 0,
                name: accountName,
                accountType: accountType,
                active: isActive,
                currency: accountCurrency
            });

            if (newAccount != undefined) {
                const newTransaction = await transactionContext.addTransaction({
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
                    amount: 0
                });

                if (newTransaction != undefined) {
                    await transactionContext.transactionProcessing(newTransaction);
                }
            }
        } else {
            await accountContext.editAccount({
                id: selectedAccount.id,
                name: accountName,
                accountType: accountType,
                active: isActive,
                currency: accountCurrency
            });
        }
        setIsLoading(false);

        if (accountContext.error) {
            // show error
            console.log(`Error while ${dialogType} account`, accountContext.error);
        } else {
            emptyForm();
        }
    };

    const actionButton = getActionButton(
        dialogType,
        handleSubmit,
        `${dialogType} Account`,
        accountName === "" || isLoading
    );

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
                {actionButton}
                <Button variant="outlined" onClick={() => emptyForm()}>
                    Cancel
                </Button>
            </DialogActions>
        </Dialog>
    )
};