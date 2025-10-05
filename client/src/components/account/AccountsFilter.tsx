import React from "react";
import {Autocomplete, Checkbox, FormControlLabel, Stack, TextField} from "@mui/material";
import TableSearch from "../common/TableSearch";
import {AccountTypeEnum} from "../../model/PersofiModels";

interface FilterProps {
    searchTerm: string;
    accountType: AccountTypeEnum | null;
    active: boolean;
}

interface AccountFiltersProps {
    filters: FilterProps;
    setFilters: (filters: FilterProps) => void;
}

const AccountsFilter: React.FC<AccountFiltersProps> = ({ filters, setFilters }) => {
    return (
        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
            <TableSearch
                searchTerm={filters.searchTerm}
                setSearchTerm={(newValue) =>
                    setFilters({ ...filters, searchTerm: newValue || "" })
                }
            />
            <Autocomplete
                options={[
                    AccountTypeEnum.CASH,
                    AccountTypeEnum.CREDIT,
                    AccountTypeEnum.DEBIT,
                    AccountTypeEnum.SAVING
                ]}
                value={filters.accountType}
                getOptionKey={(options) => options}
                getOptionLabel={(options) => options}
                onChange={(e, newValue) =>
                    setFilters({ ...filters, accountType: newValue || null })
                }
                renderInput={(params) => <TextField {...params} label="Type Produit" />}
                sx={{ minWidth: 180 }}
                size="small"
            />
            <FormControlLabel
                control={
                    <Checkbox
                        checked={filters.active}
                        onChange={(e) => {
                            setFilters({...filters, active: e.target.checked })
                        }}
                    />
                }
                label="Show Only Active Accounts"
            />
        </Stack>
    );
}

export default AccountsFilter;