import {FC, useMemo, useState} from "react";
import Breadcrumb from "../common/Breadcrumb";
import {Card, CardContent, Grid} from "@mui/material";
import {Stack} from "@mui/system";
import {useDialogController} from "../common/useDialogController";
import {AccountJson, AccountTypeEnum, CurrencyEnum, ModalTypeEnum} from "../../model/PersofiModels";
import TableCallToActionButton from "../common/TableCallToActionButton";
import Box from "@mui/material/Box";
import AccountsFilter from "./AccountsFilter";
import {useAccountContext} from "../../context/AccountContext";
import {AccountsList} from "./AccountsList";
import {AccountDialog} from "./AccountDialog";
import {useTransactionContext} from "../../context/TransactionContext";
import {useBalanceContext} from "../../context/BalanceContext";

interface FilterProps {
    searchTerm: string;
    accountType: AccountTypeEnum | null;
    inactive: boolean;
}

const bCrumb = [
    {to: "/", title: "Home"},
    {title: "Accounts"},
];

const emptyAccount: AccountJson = {
    id: 0,
    name: "",
    accountType: AccountTypeEnum.CASH,
    currency: CurrencyEnum.CAD,
    active: true
};

export const Accounts: FC = () => {
    const [filters, setFilters] = useState<FilterProps>({searchTerm: "", accountType: null, inactive: false});
    const accountContext = useAccountContext();
    const transactionContext = useTransactionContext();
    const balanceContext = useBalanceContext();
    const accountDialog = useDialogController<AccountJson>(emptyAccount);

    const filteredAccounts = useMemo(() => {
        return accountContext.accounts.filter(account => {
            const searchTerm = filters.searchTerm.toLowerCase();

            const accountNameMatchSearchTerm = filters.searchTerm ? account.name.toLowerCase().includes(searchTerm) : true;
            const accountCurrencyMatchSearchTerm = filters.searchTerm ? account.currency.toLowerCase().includes(searchTerm) : true;
            const accountTypeMatchMatchSearchTerm = filters.searchTerm ? account.accountType.toLowerCase().includes(searchTerm) : true;
            const accountTypeMatchFilterType = filters.accountType ? account.accountType === filters.accountType : true;
            const inactiveAccounts = filters.inactive ? !account.active : true;

            return (accountNameMatchSearchTerm || accountCurrencyMatchSearchTerm || accountTypeMatchMatchSearchTerm) && accountTypeMatchFilterType && inactiveAccounts;
        }) || [];
    }, [accountContext.accounts, filters]);

    return (
        <>
            <Breadcrumb title="Accounts" items={bCrumb} />
            <Grid container mt={3}>
                <Card sx={{padding: 0, borderColor: (theme) => theme.palette.divider}} variant="outlined">
                    <CardContent>
                        <Stack justifyContent="space-between" direction={{ xs: "column", sm: "row" }} spacing={{ xs: 1, sm: 2, md: 4 }}>
                            <AccountsFilter filters={filters} setFilters={setFilters}/>
                            <TableCallToActionButton
                                fullwidth={false}
                                callToActionText="Add Account"
                                callToActionFunction={() => accountDialog.openDialog(ModalTypeEnum.ADD, emptyAccount)}
                            />
                        </Stack>
                        <Box sx={{ overflowX: "auto" }} mt={3}>
                            <AccountsList
                                accounts={filteredAccounts}
                                openDialogWithType={accountDialog.openDialog}
                                isLoading={accountContext.loading}
                            />
                        </Box>
                    </CardContent>
                </Card>
            </Grid>

            <AccountDialog
                selectedAccount={accountDialog.data}
                dialogType={accountDialog.type}
                openDialog={accountDialog.open}
                closeDialog={accountDialog.closeDialog}
                accountContext={accountContext}
                transactionContext={transactionContext}
                balanceContext={balanceContext}
            />
        </>
    );
}