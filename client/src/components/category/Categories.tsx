
import {FC, useMemo, useState} from "react";
import Breadcrumb from "../common/Breadcrumb";
import {Card, CardContent, Grid} from "@mui/material";
import {Stack} from "@mui/system";
import {useDialogController} from "../common/useDialogController";
import {CategoryJson, ModalTypeEnum} from "../../model/PersofiModels";
import TableCallToActionButton from "../common/TableCallToActionButton";
import Box from "@mui/material/Box";
import CategoriesFilter from "./CategoriesFilter";
import {useCategoryContext} from "../../context/CategoryContext";
import {CategoriesList} from "./CategoriesList";
import {CategoryDialog} from "./CategoryDialog";
import {useTransactionContext} from "../../context/TransactionContext";

interface FilterProps {
    searchTerm: string;
    parentCategoryName: string | null;
    active: boolean;
}

const bCrumb = [
    {to: "/", title: "Home"},
    {title: "Categories"},
];

const emptyCategory: CategoryJson = {
    id: 0,
    name: "",
    active: true,
    parentCategoryId: null,
};

export const Categories: FC = () => {
    const [filters, setFilters] = useState<FilterProps>({searchTerm: "", parentCategoryName: null, active: true});
    const categoryContext = useCategoryContext();
    const transactionContext = useTransactionContext();
    const categoryDialog = useDialogController<CategoryJson>(emptyCategory);

    const filteredCategories = useMemo(() => {
        const searchLower = filters.searchTerm.toLowerCase();

        // resolve selected parent by name (must be a top-level category: parentCategoryId === null)
        const selectedParent = filters.parentCategoryName
            ? categoryContext.categories.find(c => c.parentCategoryId === null && c.name === filters.parentCategoryName)
            : null;

        return categoryContext.categories.filter(category => {
            const nameMatch = filters.searchTerm ? category.name.toLowerCase().includes(searchLower) : true;
            const activeMatch = filters.active ? category.active : true;
            const parentMatch = selectedParent ? category.parentCategoryId === selectedParent.id : true;
            return nameMatch && activeMatch && parentMatch;
        }) || [];
    }, [categoryContext.categories, filters]);

    return (
        <>
            <Breadcrumb title="Categories" items={bCrumb} />
            <Grid container mt={3}>
                <Card sx={{padding: 0, borderColor: (theme) => theme.palette.divider}} variant="outlined">
                    <CardContent>
                        <Stack justifyContent="space-between" direction={{ xs: "column", sm: "row" }} spacing={{ xs: 1, sm: 2, md: 4 }}>
                            <CategoriesFilter filters={filters} setFilters={setFilters} />
                            <TableCallToActionButton
                                fullwidth={false}
                                callToActionText="Add Category"
                                callToActionFunction={() => categoryDialog.openDialog(ModalTypeEnum.ADD, emptyCategory)}
                            />
                        </Stack>
                        <Box sx={{ overflowX: "auto" }} mt={3}>
                            <CategoriesList
                                categories={filteredCategories}
                                openDialogWithType={categoryDialog.openDialog}
                                isLoading={categoryContext.loading}
                            />
                        </Box>
                    </CardContent>
                </Card>
            </Grid>

            <CategoryDialog
                selectedCategory={categoryDialog.data}
                dialogType={categoryDialog.type}
                openDialog={categoryDialog.open}
                closeDialog={categoryDialog.closeDialog}
                categoryContext={categoryContext}
                transactionContext={transactionContext}
            />
        </>
    );
}
