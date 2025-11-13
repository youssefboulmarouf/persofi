import React from "react";
import {Stack} from "@mui/material";
import {DatePicker, LocalizationProvider} from "@mui/x-date-pickers";
import {AdapterDateFns} from "@mui/x-date-pickers/AdapterDateFns";

interface FilterProps {
    startDate: Date | null;
    endDate: Date | null;
}

interface DashboardFilterProps {
    filters: FilterProps;
    setFilters: (filters: FilterProps) => void;
}

const DashboardFilter: React.FC<DashboardFilterProps> = ({ filters, setFilters }) => {
    return (
        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">

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

        </Stack>
    );
};

export default DashboardFilter;
