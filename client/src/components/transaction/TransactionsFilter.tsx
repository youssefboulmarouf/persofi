import React from "react";
import {Checkbox, FormControlLabel, Stack, TextField} from "@mui/material";
import TableSearch from "../common/TableSearch";
import {TransactionTypeEnum} from "../../model/PersofiModels";
import Autocomplete from "@mui/material/Autocomplete";

interface FilterProps {
    searchTerm: string;
    type: TransactionTypeEnum | null;
    unprocessed: boolean;
}

interface TransactionsFilterProps {
    filters: FilterProps;
    setFilters: (filters: FilterProps) => void;
}

const TransactionsFilter: React.FC<TransactionsFilterProps> = ({ filters, setFilters }) => {
    return (
        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
            <TableSearch
                searchTerm={filters.searchTerm}
                setSearchTerm={(term: string) => setFilters({ ...filters, searchTerm: term })}
            />

            <Autocomplete
                options={[
                    TransactionTypeEnum.EXPENSE,
                    TransactionTypeEnum.INCOME,
                    TransactionTypeEnum.TRANSFER,
                    TransactionTypeEnum.CREDIT_PAYMENT,
                    TransactionTypeEnum.REFUND,
                ]}
                getOptionLabel={(o) => o}
                value={filters.type}
                onChange={(e, nv) => setFilters({ ...filters, type: nv })}
                renderInput={(params) => <TextField {...params} label="Categories" />}
                sx={{ minWidth: 180 }}
                size="small"
            />

            <FormControlLabel
                control={
                    <Checkbox
                        checked={filters.unprocessed}
                        onChange={(e) => setFilters({ ...filters, unprocessed: e.target.checked })}
                    />
                }
                label="Show only unprocessed"
            />
        </Stack>
    );
};

export default TransactionsFilter;
