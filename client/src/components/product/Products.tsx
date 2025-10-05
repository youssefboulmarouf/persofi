import {FC, useMemo, useState} from "react";
import Breadcrumb from "../common/Breadcrumb";
import {Card, CardContent, Grid} from "@mui/material";
import {Stack} from "@mui/system";
import {useDialogController} from "../common/useDialogController";
import {ModalTypeEnum, ProductJson, ProductVariantJson, UintTypeEnum} from "../../model/PersofiModels";
import TableCallToActionButton from "../common/TableCallToActionButton";
import Box from "@mui/material/Box";
import {useProductContext} from "../../context/ProductContext";
import ProductsFilter from "./ProductsFilter";
import {useCategoryContext} from "../../context/CategoryContext";
import {ProductsList} from "./ProductsList";
import {ProductDialog} from "./ProductDialog";
import {useTransactionContext} from "../../context/TransactionContext";
import {ProductVariantDialog} from "./ProductVariantDialog";

interface FilterProps {
    searchTerm: string;
    active: boolean;
    categoryId: number | null;
}

const bCrumb = [
    {to: "/", title: "Home"},
    {title: "Products"},
];

const emptyProduct: ProductJson = {
    id: 0,
    name: "",
    active: true,
    categoryId: 0,
    variants: []
};

const emptyVariant: ProductVariantJson = {
    id: 0,
    productId: 0,
    unitSize: 0,
    unitType: UintTypeEnum.KG,
    description: "",
    active: true
};

export const Products: FC = () => {
    const [filters, setFilters] = useState<FilterProps>({searchTerm: "", active: true, categoryId: 0});
    const transactionContext = useTransactionContext();
    const categoryContext = useCategoryContext();
    const productContext = useProductContext();
    const productDialog = useDialogController<ProductJson>(emptyProduct);
    const variantDialog = useDialogController<ProductVariantJson>(emptyVariant);

    const filteredProducts = useMemo(() => {
        const search = filters.searchTerm.toLowerCase();

        const selectedCategories = categoryContext
            .categories
            .filter(ct => ct.id === filters.categoryId || ct.parentCategoryId === filters.categoryId)

        return (
            productContext.products.filter((p) => {
                const nameMatch = filters.searchTerm ? p.name.toLowerCase().includes(search) : true;
                const activeMatch = filters.active ? p.active : true;
                const categoryMatch = filters.categoryId
                    ? selectedCategories.filter(sct => sct.id === p.categoryId).length > 0
                    : true;
                return nameMatch && categoryMatch && activeMatch;
            }) || []
        );
    }, [productContext.products, filters]);

    return (
        <>
            <Breadcrumb title="Products" items={bCrumb} />
            <Grid container mt={3}>
                <Card sx={{padding: 0, borderColor: (theme) => theme.palette.divider}} variant="outlined">
                    <CardContent>
                        <Stack justifyContent="space-between" direction={{ xs: "column", sm: "row" }} spacing={{ xs: 1, sm: 2, md: 4 }}>
                            <ProductsFilter categoryContext={categoryContext} filters={filters} setFilters={setFilters} />
                            <Box display="flex" gap={1}>
                                <TableCallToActionButton
                                    fullwidth={false}
                                    callToActionText="Add Product"
                                    callToActionFunction={() => productDialog.openDialog(ModalTypeEnum.ADD, emptyProduct)}
                                />
                            </Box>
                        </Stack>

                        <Box sx={{ overflowX: "auto" }} mt={3}>
                            <ProductsList
                                products={filteredProducts}
                                openProductDialogWithType={productDialog.openDialog}
                                openVariantDialogWithType={variantDialog.openDialog}
                                isLoading={productContext.loading}
                            />
                        </Box>
                    </CardContent>
                </Card>
            </Grid>

            <ProductDialog
                selectedProduct={productDialog.data}
                dialogType={productDialog.type}
                openDialog={productDialog.open}
                closeDialog={productDialog.closeDialog}
                productContext={productContext}
                categoryContext={categoryContext}
                transactionContext={transactionContext}
            />

            <ProductVariantDialog
                selectedVariant={variantDialog.data}
                dialogType={variantDialog.type}
                openDialog={variantDialog.open}
                closeDialog={variantDialog.closeDialog}
                productContext={productContext}
                transactionContext={transactionContext}
            />
        </>
    );
}
