import {FC, useMemo, useState} from "react";
import Breadcrumb from "../common/Breadcrumb";
import {Card, CardContent, Grid} from "@mui/material";
import {Stack} from "@mui/system";
import {useDialogController} from "../common/useDialogController";
import {AccountJson, AccountTypeEnum, CurrencyEnum, ModalTypeEnum} from "../../model/PersofiModels";
import TableCallToActionButton from "../common/TableCallToActionButton";
import Box from "@mui/material/Box";
import AccountsFilter from "./AccountsFilter";
import {useAccounts} from "../../hooks/useAccounts";
import {useBalances} from "../../hooks/useBalances";
import {AccountsList} from "./AccountsList";
import {AccountDialog} from "./AccountDialog";

interface FilterProps {
    searchTerm: string;
    accountType: AccountTypeEnum | null;
    active: boolean;
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
    const [filters, setFilters] = useState<FilterProps>({searchTerm: "", accountType: null, active: true});
    const { data: accountsData, isLoading: isAccountsLoading } = useAccounts();
    const accounts = accountsData || [];
    const { data: balancesData } = useBalances();
    const balances = balancesData || [];
    const accountDialog = useDialogController<AccountJson>(emptyAccount);

    const filteredAccounts = useMemo(() => {
        return accounts.filter(account => {
            const searchTerm = filters.searchTerm.toLowerCase();

            const accountNameMatchSearchTerm = filters.searchTerm ? account.name.toLowerCase().includes(searchTerm) : true;
            const accountCurrencyMatchSearchTerm = filters.searchTerm ? account.currency.toLowerCase().includes(searchTerm) : true;
            const accountTypeMatchMatchSearchTerm = filters.searchTerm ? account.accountType.toLowerCase().includes(searchTerm) : true;
            const accountTypeMatchFilterType = filters.accountType ? account.accountType === filters.accountType : true;
            const activeAccounts = filters.active ? account.active : true;

            return (accountNameMatchSearchTerm || accountCurrencyMatchSearchTerm || accountTypeMatchMatchSearchTerm) && accountTypeMatchFilterType && activeAccounts;
        }) || [];
    }, [accounts, filters]);

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
                                balances={balances}
                                openDialogWithType={accountDialog.openDialog}
                                isLoading={isAccountsLoading}
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
            />
        </>
    );
}