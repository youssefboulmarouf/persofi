import {FC, useMemo, useState} from "react";
import Breadcrumb from "../common/Breadcrumb";
import {Card, CardContent, Grid} from "@mui/material";
import {Stack} from "@mui/system";
import {useDialogController} from "../common/useDialogController";
import {ModalTypeEnum, ProductJson, ProductVariantJson, UintTypeEnum} from "../../model/PersofiModels";
import TableCallToActionButton from "../common/TableCallToActionButton";
import Box from "@mui/material/Box";
import { useProducts } from "../../hooks/useProducts";
import ProductsFilter from "./ProductsFilter";
import { useCategories } from "../../hooks/useCategories";
import {ProductsList} from "./ProductsList";
import {ProductDialog} from "./ProductDialog";
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
    const productDialog = useDialogController<ProductJson>(emptyProduct);
    const variantDialog = useDialogController<ProductVariantJson>(emptyVariant);

    const { data: productsData, isLoading: isProductsLoading } = useProducts();
    const products = productsData || [];
    
    const { data: categoriesData } = useCategories();
    const categories = categoriesData || [];

    const filteredProducts = useMemo(() => {
        const search = filters.searchTerm.toLowerCase();

        const selectedCategories = categories
            .filter(ct => ct.id === filters.categoryId || ct.parentCategoryId === filters.categoryId)

        return (
            products.filter((p) => {
                const nameMatch = filters.searchTerm ? p.name.toLowerCase().includes(search) : true;
                const activeMatch = filters.active ? p.active : true;
                const categoryMatch = filters.categoryId
                    ? selectedCategories.filter(sct => sct.id === p.categoryId).length > 0
                    : true;
                return nameMatch && categoryMatch && activeMatch;
            }) || []
        );
    }, [products, categories, filters]);

    return (
        <>
            <Breadcrumb title="Products" items={bCrumb} />
            <Grid container mt={3}>
                <Card sx={{padding: 0, borderColor: (theme) => theme.palette.divider}} variant="outlined">
                    <CardContent>
                        <Stack justifyContent="space-between" direction={{ xs: "column", sm: "row" }} spacing={{ xs: 1, sm: 2, md: 4 }}>
                            <ProductsFilter filters={filters} setFilters={setFilters} />
                            <TableCallToActionButton
                                fullwidth={false}
                                callToActionText="Add Product"
                                callToActionFunction={() => productDialog.openDialog(ModalTypeEnum.ADD, emptyProduct)}
                            />
                        </Stack>

                        <Box sx={{ overflowX: "auto" }} mt={3}>
                            <ProductsList
                                products={filteredProducts}
                                openProductDialogWithType={productDialog.openDialog}
                                openVariantDialogWithType={variantDialog.openDialog}
                                isLoading={isProductsLoading}
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
            />

            <ProductVariantDialog
                selectedVariant={variantDialog.data}
                dialogType={variantDialog.type}
                openDialog={variantDialog.open}
                closeDialog={variantDialog.closeDialog}
            />
        </>
    );
}
