import React from "react";
import { Checkbox, FormControlLabel, Stack } from "@mui/material";
import TableSearch from "../common/TableSearch";

interface FilterProps {
    searchTerm: string;
    active: boolean;
}

interface BrandFiltersProps {
    filters: FilterProps;
    setFilters: (filters: FilterProps) => void;
}

const BrandsFilter: React.FC<BrandFiltersProps> = ({ filters, setFilters }) => {
    return (
        <Stack spacing={2}>
            <TableSearch
                searchTerm={filters.searchTerm}
                setSearchTerm={(term: string) => setFilters({ ...filters, searchTerm: term })}
            />

            <FormControlLabel
                control={
                    <Checkbox
                        checked={filters.active}
                        onChange={(e) => setFilters({ ...filters, active: e.target.checked })}
                    />
                }
                label="Show Only Active Brands"
            />
        </Stack>
    );
};

export default BrandsFilter;
