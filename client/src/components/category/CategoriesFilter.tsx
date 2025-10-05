import React, { useMemo } from "react";
import { Autocomplete, Checkbox, FormControlLabel, Stack, TextField } from "@mui/material";
import TableSearch from "../common/TableSearch";
import { useCategoryContext } from "../../context/CategoryContext";

interface FilterProps {
    searchTerm: string;
    parentCategoryName: string | null;
    active: boolean;
}

interface CategoryFiltersProps {
    filters: FilterProps;
    setFilters: (filters: FilterProps) => void;
}

const CategoriesFilter: React.FC<CategoryFiltersProps> = ({filters, setFilters}) => {
    const { categories } = useCategoryContext();

    // Only names of *parent* categories (top-level: parentCategoryId === null), sorted
    const parentNames = useMemo(() => {
        const names = categories
            .filter(c => c.parentCategoryId === null)
            .map(c => c.name);
        return Array.from(new Set(names)).sort((a, b) => a.localeCompare(b));
    }, [categories]);

    return (
        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
            <TableSearch
                searchTerm={filters.searchTerm}
                setSearchTerm={(term: string) => setFilters({...filters, searchTerm: term})}
            />

            <Autocomplete
                options={parentNames}
                value={filters.parentCategoryName}
                onChange={(e, newValue) => setFilters({...filters, parentCategoryName: newValue})}
                renderInput={(params) => <TextField {...params} label="Type Produit" />}
                sx={{ minWidth: 180 }}
                size="small"
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

export default CategoriesFilter;
