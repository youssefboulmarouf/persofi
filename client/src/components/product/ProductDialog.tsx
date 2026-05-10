import {FC, useEffect, useMemo, useState} from "react";
import {ModalTypeEnum, ProductJson, UintTypeEnum} from "../../model/PersofiModels";
import {getActionButton} from "../common/Utilities";
import {Autocomplete, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Switch, TextField} from "@mui/material";
import LoadingComponent from "../common/LoadingComponent";
import FormLabel from "../common/FormLabel";
import Button from "@mui/material/Button";
import { useAddProduct, useUpdateProduct, useDeleteProduct, useUpdateVariant } from "../../hooks/useProducts";
import { useCategories } from "../../hooks/useCategories";
import { useTransactions } from "../../hooks/useTransactions";

interface ProductDialogProps {
    selectedProduct: ProductJson;
    dialogType: ModalTypeEnum;
    openDialog: boolean;
    closeDialog: () => void;
}

export const ProductDialog: FC<ProductDialogProps> = ({
    selectedProduct,
    dialogType,
    openDialog,
    closeDialog,
}) => {
    const [productName, setProductName] = useState<string>("");
    const [isActive, setIsActive] = useState<boolean>(true);
    const [categoryId, setCategoryId] = useState<number>(0);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const { mutateAsync: addProduct } = useAddProduct();
    const { mutateAsync: updateProduct } = useUpdateProduct();
    const { mutateAsync: deleteProduct } = useDeleteProduct();
    const { mutateAsync: updateVariant } = useUpdateVariant();
    
    const { data: categoriesData } = useCategories();
    const categories = categoriesData || [];
    
    const { data: transactionsData } = useTransactions();
    const transactions = transactionsData || [];

    const categoryOptions = useMemo(() => {
        return categories
            .filter(c => c.active)
            .map(c => ({ label: c.name, value: c.id }));
    }, [categories]);

    useEffect(() => {
        setProductName(selectedProduct.name ?? "");
        setIsActive(selectedProduct.active ?? true);
        setCategoryId(selectedProduct.categoryId ?? 0);
    }, [selectedProduct, dialogType]);

    const handleSubmit = async () => {
        if (productName == "") return;

        setIsLoading(true);
        try {
            if (dialogType === ModalTypeEnum.ADD) {
                await addProduct({
                    id: 0,
                    name: productName.trim(),
                    active: isActive,
                    categoryId: categoryId,
                    variants: []
                });
            } else if (dialogType === ModalTypeEnum.UPDATE) {
                await updateProduct({
                    id: selectedProduct.id,
                    name: productName.trim(),
                    active: isActive,
                    categoryId: categoryId,
                    variants: selectedProduct.variants ?? []
                });

                if (!isActive) {
                    await Promise.all(
                        selectedProduct
                            .variants
                            .map(async vr => await updateVariant({
                                id: vr.id,
                                productId: vr.productId,
                                unitSize: vr.unitSize,
                                unitType: vr.unitType,
                                description: vr.description,
                                active: false,
                            }))
                    );
                }
            } else if (dialogType === ModalTypeEnum.DELETE) {
                const productTransactions = transactions
                    .flatMap(tr => tr.items)
                    .filter(item =>
                        item.variantId
                        && selectedProduct
                            .variants
                            .map(vr => vr.id).includes(item.variantId))
                if (selectedProduct.variants.length > 0 || productTransactions.length > 0) {
                    console.log(`Product with [id=${selectedProduct.id}] have ${selectedProduct.variants.length} variants, and have ${productTransactions.length} transactions, deactivate instead of delete`)
                    await Promise.all(
                        selectedProduct
                            .variants
                            .map(async vr => await updateVariant({
                                id: vr.id,
                                productId: vr.productId,
                                unitSize: vr.unitSize,
                                unitType: vr.unitType,
                                description: vr.description,
                                active: false,
                            }))
                    );

                    await updateProduct({
                        id: selectedProduct.id,
                        name: selectedProduct.name.trim(),
                        active: false,
                        categoryId: selectedProduct.categoryId,
                        variants: selectedProduct.variants ?? []
                    });
                } else {
                    await deleteProduct(selectedProduct);
                }
            }
        } catch (err) {
            console.log(`Error while ${dialogType} product`, err);
        } finally {
            setIsLoading(false);
            emptyForm();
        }
    };

    const emptyForm = () => {
        setProductName("");
        setCategoryId(categoryOptions[0].value);
        setIsActive(true);

        closeDialog();
    }

    return (
        <Dialog open={openDialog} onClose={() => emptyForm()} PaperProps={{sx: {width: '500px', maxWidth: '500px'}}}>
            <DialogTitle sx={{ mt: 2 }}>{dialogType} Product: {selectedProduct.name}</DialogTitle>

            <DialogContent>
                {isLoading ? (
                    <LoadingComponent message={"Processing..."} />
                ) : (
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <FormLabel>Name</FormLabel>
                        <TextField
                            fullWidth
                            value={productName}
                            onChange={(e) => setProductName(e.target.value)}
                            placeholder={"e.g., Olive Oil"}
                        />

                        <FormLabel>Category</FormLabel>
                        <Autocomplete
                            options={categoryOptions}
                            getOptionLabel={(opt) => opt.label}
                            value={categoryOptions.find(o => o.value === categoryId) ?? null}
                            onChange={(e, nv) => setCategoryId(nv?.value ?? 0)}
                            renderInput={(params) => <TextField {...params} fullWidth />}
                        />

                        <FormLabel>Active</FormLabel>
                        <Stack direction="row" alignItems="center" spacing={1}>
                            <Switch checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
                        </Stack>
                    </Stack>
                )}
            </DialogContent>

            <DialogActions>
                {
                    getActionButton(
                        dialogType,
                        handleSubmit,
                        `${dialogType} Product`,
                        productName === "" || isLoading)
                }
                <Button variant="outlined" onClick={closeDialog}>
                    Cancel
                </Button>
            </DialogActions>
        </Dialog>
    );
};
