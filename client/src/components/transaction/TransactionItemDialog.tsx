import { FC, useEffect, useState } from "react";
import {Autocomplete, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField} from "@mui/material";
import Button from "@mui/material/Button";
import { getActionButton } from "../common/Utilities";
import LoadingComponent from "../common/LoadingComponent";
import FormLabel from "../common/FormLabel";
import {
    CategoryJson,
    ModalTypeEnum,
    ProductJson,
    ProductVariantJson,
    TransactionItemJson,
    TransactionJson
} from "../../model/PersofiModels";
import {CategoryContextValue} from "../../context/CategoryContext";
import {ProductContextValue} from "../../context/ProductContext";

interface TransactionItemDialogProps {
    selectedTransaction: TransactionJson;
    selectedItem: TransactionItemJson;
    dialogType: ModalTypeEnum;
    openDialog: boolean;
    closeDialog: () => void;
    handleAddItem: (itemToAdd: TransactionItemJson) => void;
    categoryContext: CategoryContextValue;
    productContext: ProductContextValue;
}

export const TransactionItemDialog: FC<TransactionItemDialogProps> = ({
    selectedTransaction,
    selectedItem,
    dialogType,
    openDialog,
    closeDialog,
    handleAddItem,
    productContext,
    categoryContext,
}) => {
    const [description, setDescription] = useState<string>("");
    const [quantity, setQuantity] = useState<number>(1);
    const [unitPrice, setUnitPrice] = useState<number>(0);
    const [lineTotal, setLineTotal] = useState<number>(0);
    const [variant, setVariant] = useState<ProductVariantJson | null>(null);
    const [category, setCategory] = useState<CategoryJson | null>(null);
    const [product, setProduct] = useState<ProductJson | null>(null);
    const [brandId, setBrandId] = useState<number | null>(null);

    useEffect(() => {
        setDescription(selectedItem.description);
        setQuantity(selectedItem.quantity);
        setUnitPrice(selectedItem.unitPrice);
        setLineTotal(selectedItem.lineTotal);
        setVariant(
            productContext
                .products
                .flatMap(p => p.variants)
                .filter(v => v.id === selectedItem.variantId)[0] ?? null
        );
        setCategory(
            categoryContext
                .categories
                .filter(cat => cat.id === selectedItem.categoryId)[0] ?? null
        );
        setBrandId(selectedItem.brandId);
    }, [selectedItem, dialogType]);

    useEffect(() => {
        // auto compute line total
        const total = (quantity || 0) * (unitPrice || 0);
        setLineTotal(Number.isFinite(total) ? parseFloat(total.toFixed(2)) : 0);
    }, [quantity, unitPrice]);

    useEffect(() => {
        setDescription(description === "" && variant
            ? `${variant?.description} (${variant?.unitSize}/${variant?.unitType})`
            : description);
    }, [variant]);


    const emptyForm = () => {
        setDescription("");
        setQuantity(0);
        setUnitPrice(0);
        setLineTotal(0);
        setVariant(null);
        setCategory(null);
        setBrandId(null);


        closeDialog();
    }

    const onAddConfirm = async () => {
        handleAddItem({
            id: 0,
            description: description === ""
                ? `${variant?.description} (${variant?.unitSize}/${variant?.unitType})`
                : description,
            quantity: quantity,
            unitPrice: unitPrice,
            lineTotal: lineTotal,
            transactionId: selectedTransaction.id,
            variantId: variant?.id ?? null,
            brandId: brandId,
            categoryId: category?.id ?? null,
        });
        emptyForm();
    }

    return (
        <Dialog open={openDialog} onClose={() => emptyForm()} PaperProps={{sx: {width: '600px', maxWidth: '600px'}}}>
            <DialogTitle sx={{ mt: 2 }}>{dialogType} Item: {productContext.products.filter(pr => pr.id === variant?.productId)[0]?.name ?? ""}</DialogTitle>


            <DialogContent>
                <Stack spacing={2} sx={{ mt: 1 }}>
                    <FormLabel>Product</FormLabel>
                    <Autocomplete
                        options={productContext.products.filter(p => p.active)}
                        fullWidth
                        getOptionKey={(options) => options.id}
                        getOptionLabel={(options) => options.name}
                        value={product}
                        onChange={(event: React.SyntheticEvent, newValue: ProductJson | null) => {
                            setProduct(newValue)
                        }}
                        renderInput={(params) => <TextField {...params} placeholder="Produit" />}
                    />

                    <FormLabel>Variant</FormLabel>
                    <Autocomplete
                        options={productContext.products.flatMap(p => p.variants).filter(v => v.active && v.productId === product?.id)}
                        fullWidth
                        getOptionKey={(options) => options.id}
                        getOptionLabel={(options) => `${options.description} (${options.unitSize}/${options.unitType})`}
                        value={variant}
                        onChange={(event: React.SyntheticEvent, newValue: ProductVariantJson | null) => {
                            setVariant(newValue)
                        }}
                        renderInput={(params) => <TextField {...params} placeholder="Produit" />}
                    />

                    <FormLabel>Description</FormLabel>
                    <TextField
                        fullWidth
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />

                    <FormLabel>Quantity</FormLabel>
                    <TextField
                        type="number"
                        fullWidth
                        value={quantity}
                        onChange={(e) => setQuantity(parseFloat(e.target.value))}
                    />

                    <FormLabel>Unit Price</FormLabel>
                    <TextField
                        type="number"
                        fullWidth
                        value={unitPrice}
                        onChange={(e) => setUnitPrice(parseFloat(e.target.value))}
                    />

                    <FormLabel>Line Total</FormLabel>
                    <TextField fullWidth value={lineTotal} disabled />
                </Stack>
            </DialogContent>

            <DialogActions>
                {
                    getActionButton(
                        dialogType,
                        onAddConfirm,
                        `${dialogType} Item`,
                        quantity === 0 || unitPrice === 0 || variant === null)
                }
                <Button variant="outlined" onClick={emptyForm}>
                    Cancel
                </Button>
            </DialogActions>
        </Dialog>
    );
};
