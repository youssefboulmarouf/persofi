import React from "react";
import {Stack} from "@mui/system";
import TableSearch from "../common/TableSearch";
import {Checkbox, FormControlLabel} from "@mui/material";

interface FilterProps {
    searchTerm: string;
    active: boolean;
}

interface StoresFilterProps {
    filters: FilterProps;
    setFilters: (filters: FilterProps) => void;
}

const StoresFilter: React.FC<StoresFilterProps> = ({filters, setFilters}) => {
    return (
        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
            <TableSearch
                searchTerm={filters.searchTerm}
                setSearchTerm={(term: string) => setFilters({...filters, searchTerm: term})}
            />
            <FormControlLabel
                control={
                    <Checkbox
                        checked={filters.active}
                        onChange={(e) => {
                            setFilters({...filters, active: e.target.checked})
                        }}
                    />
                }
                label="Show Only Active Categories"
            />
        </Stack>
    );
}

export default StoresFilter;
