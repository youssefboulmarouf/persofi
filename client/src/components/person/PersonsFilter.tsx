import React from "react";
import { Checkbox, FormControlLabel, Stack } from "@mui/material";
import TableSearch from "../common/TableSearch";

interface FilterProps {
    searchTerm: string;
    active: boolean;
}

interface PersonFiltersProps {
    filters: FilterProps;
    setFilters: (filters: FilterProps) => void;
}

const PersonsFilter: React.FC<PersonFiltersProps> = ({ filters, setFilters }) => {
    return (
        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
            <TableSearch
                searchTerm={filters.searchTerm}
                setSearchTerm={(newValue) =>
                  setFilters({ ...filters, searchTerm: newValue || "" })
                }
            />

            <FormControlLabel
                control={
                    <Checkbox
                        checked={filters.active}
                        onChange={(e) => setFilters({ ...filters, active: e.target.checked })}
                    />
                }
                label="Show Only Active People"
            />
        </Stack>
    );
};

export default PersonsFilter;
