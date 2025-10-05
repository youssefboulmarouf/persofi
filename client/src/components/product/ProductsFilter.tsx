import React, { useMemo } from "react";
import {Checkbox, FormControlLabel, Stack, TextField} from "@mui/material";
import TableSearch from "../common/TableSearch";
import {CategoryContextValue, useCategoryContext} from "../../context/CategoryContext";
import Autocomplete from "@mui/material/Autocomplete";

interface FilterProps {
    searchTerm: string;
    active: boolean;
    categoryId: number | null;
}

interface ProductsFilterProps {
    categoryContext: CategoryContextValue;
    filters: FilterProps;
    setFilters: (filters: FilterProps) => void;
}

const ProductsFilter: React.FC<ProductsFilterProps> = ({categoryContext, filters, setFilters}) => {

    const categoryOptions = useMemo(
        () =>
            [{ label: "All categories", value: 0 }].concat(
                categoryContext
                    .categories
                    .filter((c) => c.active)
                    .map((c) => ({ label: c.name, value: c.id }))
            ),
        [categoryContext.categories]
    );

    const selectedOption =
        categoryOptions.find((o) => o.value === filters.categoryId) ?? categoryOptions[0];

    return (
        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
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
                label="Show Only Active Products"
            />

            <Autocomplete
                options={categoryOptions}
                getOptionLabel={(o) => o.label}
                value={selectedOption}
                onChange={(e, nv) => setFilters({ ...filters, categoryId: nv?.value ?? null })}
                renderInput={(params) => <TextField {...params} label="Categories" />}
                sx={{ minWidth: 180 }}
                size="small"
            />
        </Stack>
    );
};

export default ProductsFilter;
