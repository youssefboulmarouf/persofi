import { FC, useEffect, useState } from "react";
import {Autocomplete, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField, Typography} from "@mui/material";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
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
import { useProducts } from "../../hooks/useProducts";
import { useCategories } from "../../hooks/useCategories";

interface TransactionItemDialogProps {
    selectedTransaction: TransactionJson;
    selectedItem: TransactionItemJson;
    dialogType: ModalTypeEnum;
    openDialog: boolean;
    closeDialog: () => void;
    handleAddItem: (itemToAdd: TransactionItemJson) => void;
}

export const TransactionItemDialog: FC<TransactionItemDialogProps> = ({
    selectedTransaction,
    selectedItem,
    dialogType,
    openDialog,
    closeDialog,
    handleAddItem,
}) => {
    const { data: productsData } = useProducts();
    const products = productsData || [];
    const { data: categoriesData } = useCategories();
    const categories = categoriesData || [];

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
        setQuantity(selectedItem.quantity || 1);
        setUnitPrice(selectedItem.unitPrice);
        setLineTotal(selectedItem.lineTotal);
        setVariant(
            products
                .flatMap(p => p.variants || [])
                .filter(v => v.id === selectedItem.variantId)[0] ?? null
        );
        setCategory(
            categories
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
        setQuantity(1);
        setUnitPrice(0);
        setLineTotal(0);
        setVariant(null);
        setCategory(null);
        setBrandId(null);
        setProduct(null);
        closeDialog();
    }

    const onAddConfirm = async () => {
        handleAddItem({
            id: 0,
            description: description !== ""
                ? description
                : variant
                    ? `${variant?.description} (${variant?.unitSize}/${variant?.unitType})`
                    : "",
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
            <DialogTitle sx={{ mt: 2 }}>
                {dialogType} Item
                {product && <Typography component="span" sx={{ ml: 1, opacity: 0.6, fontSize: '0.9em' }}>— {product.name}</Typography>}
            </DialogTitle>

            <DialogContent>
                <Stack spacing={2} sx={{ mt: 1 }}>

                    {/* ── Category (shown first — useful even without a variant) ── */}
                    <FormLabel>Category <span style={{ fontWeight: 400, opacity: 0.55, fontSize: '0.8em' }}>(optional)</span></FormLabel>
                    <Autocomplete
                        options={categories.filter(c => c.active)}
                        fullWidth
                        getOptionKey={(c) => c.id}
                        getOptionLabel={(c) => c.name}
                        value={category}
                        onChange={(event: React.SyntheticEvent, newValue: CategoryJson | null) => setCategory(newValue)}
                        renderInput={(params) => <TextField {...params} placeholder="e.g. Groceries" size="small" />}
                    />

                    {/* ── Product + Variant ── */}
                    <FormLabel>Product <span style={{ fontWeight: 400, opacity: 0.55, fontSize: '0.8em' }}>(optional)</span></FormLabel>
                    <Autocomplete
                        options={products.filter(p => p.active)}
                        fullWidth
                        getOptionKey={(options) => options.id}
                        getOptionLabel={(options) => options.name}
                        value={product}
                        onChange={(event: React.SyntheticEvent, newValue: ProductJson | null) => {
                            setProduct(newValue);
                            setVariant(null); // reset variant when product changes
                        }}
                        renderInput={(params) => <TextField {...params} placeholder="Search product..." size="small" />}
                    />

                    <FormLabel>Variant <span style={{ fontWeight: 400, opacity: 0.55, fontSize: '0.8em' }}>(optional)</span></FormLabel>
                    <Autocomplete
                        options={products.flatMap(p => p.variants || []).filter(v => v.active && v.productId === product?.id)}
                        fullWidth
                        getOptionKey={(options) => options.id}
                        getOptionLabel={(options) => `${options.description} (${options.unitSize}/${options.unitType})`}
                        value={variant}
                        disabled={!product}
                        onChange={(event: React.SyntheticEvent, newValue: ProductVariantJson | null) => {
                            setVariant(newValue);
                        }}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                placeholder={product ? "Select variant..." : "Select a product first"}
                                size="small"
                            />
                        )}
                    />

                    {/* ── Description ── */}
                    <FormLabel>Description</FormLabel>
                    <TextField
                        fullWidth
                        size="small"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="e.g. Rent – May 2025"
                    />

                    {/* ── Qty + Unit Price + Line Total ── */}
                    <Stack direction="row" spacing={2}>
                        <Box sx={{ flex: 1 }}>
                            <FormLabel>Quantity</FormLabel>
                            <TextField
                                type="number"
                                fullWidth
                                size="small"
                                value={quantity}
                                onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                                inputProps={{ min: 0.01, step: 0.01 }}
                            />
                        </Box>
                        <Box sx={{ flex: 1 }}>
                            <FormLabel>Unit Price</FormLabel>
                            <TextField
                                type="number"
                                fullWidth
                                size="small"
                                value={unitPrice || ""}
                                onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)}
                                placeholder="0.00"
                                inputProps={{ min: 0, step: 0.01 }}
                            />
                        </Box>
                    </Stack>

                    {/* ── Live formula chip ── */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" sx={{ opacity: 0.6 }}>
                            {quantity} × {unitPrice.toFixed(2)} =
                        </Typography>
                        <Chip
                            label={`${lineTotal.toFixed(2)}`}
                            color={lineTotal > 0 ? "primary" : "default"}
                            size="small"
                            sx={{ fontWeight: 700 }}
                        />
                    </Box>

                </Stack>
            </DialogContent>

            <DialogActions>
                {
                    getActionButton(
                        dialogType,
                        onAddConfirm,
                        `${dialogType} Item`,
                        quantity === 0 || unitPrice === 0)
                }
                <Button variant="outlined" onClick={emptyForm}>
                    Cancel
                </Button>
            </DialogActions>
        </Dialog>
    );
};
