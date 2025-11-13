import React from "react";
import {Checkbox, FormControlLabel, Stack, TextField} from "@mui/material";
import TableSearch from "../common/TableSearch";
import {TransactionTypeEnum} from "../../model/PersofiModels";
import Autocomplete from "@mui/material/Autocomplete";
import {DatePicker, LocalizationProvider} from "@mui/x-date-pickers";
import {AdapterDateFns} from "@mui/x-date-pickers/AdapterDateFns";

interface FilterProps {
    searchTerm: string;
    type: TransactionTypeEnum | null;
    unprocessed: boolean;
    startDate: Date | null;
    endDate: Date | null;
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

            <LocalizationProvider dateAdapter={AdapterDateFns}>
                {/* TODO : Move date picker to seperated component*/}
                <DatePicker
                    label="Start Date"
                    value={filters.startDate}
                    onChange={(newValue: Date | null) => setFilters({ ...filters, startDate: newValue })}
                    minDate={new Date("01/01/2024")}
                    maxDate={new Date("01/01/2047")}
                />

                <DatePicker
                    label="End Date"
                    value={filters.endDate}
                    onChange={(newValue: Date | null) => setFilters({ ...filters, endDate: newValue })}
                    minDate={new Date("01/01/2024")}
                    maxDate={new Date("01/01/2047")}
                />
            </LocalizationProvider>

            <FormControlLabel
                control={
                    <Checkbox
                        checked={filters.unprocessed}
                        onChange={(e) => setFilters({ ...filters, unprocessed: e.target.checked })}
                    />
                }
                label="Unprocessed"
            />
        </Stack>
    );
};

export default TransactionsFilter;
