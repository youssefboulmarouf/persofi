import {FC, useEffect, useMemo, useState} from "react";
import {ModalTypeEnum, ProductVariantJson, UintTypeEnum} from "../../model/PersofiModels";
import {getActionButton} from "../common/Utilities";
import {Autocomplete, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Switch, TextField} from "@mui/material";
import LoadingComponent from "../common/LoadingComponent";
import FormLabel from "../common/FormLabel";
import Button from "@mui/material/Button";
import {ProductContextValue} from "../../context/ProductContext";
import {TransactionContextValue} from "../../context/TransactionContext";

interface ProductVariantDialogProps {
    selectedVariant: ProductVariantJson;
    dialogType: ModalTypeEnum;
    openDialog: boolean;
    closeDialog: () => void;
    productContext: ProductContextValue;
    transactionContext: TransactionContextValue;
}

export const ProductVariantDialog: FC<ProductVariantDialogProps> = ({
    selectedVariant,
    dialogType,
    openDialog,
    closeDialog,
    productContext,
    transactionContext
}) => {
    const [productId, setProductId] = useState<number>(0);
    const [unitSize, setUnitSize] = useState<number>(0);
    const [unitType, setUnitType] = useState<UintTypeEnum | null>(null);
    const [description, setDescription] = useState<string>("");
    const [isActive, setIsActive] = useState<boolean>(true);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const productOptions = useMemo(() => {
        return productContext.products
            .filter(p => p.active)
            .map(p => ({ label: p.name, value: p.id }));
    }, [productContext.products]);

    useEffect(() => {
        setProductId(selectedVariant.productId ?? 0);
        setUnitSize(selectedVariant.unitSize ?? 0);
        setUnitType(selectedVariant.unitType ?? UintTypeEnum.KG);
        setDescription(selectedVariant.description ?? "");
        setIsActive(selectedVariant.active ?? true);
    }, [selectedVariant, dialogType]);

    const handleSubmit = async () => {
        if (unitType == null || unitSize == 0 || description == "") return;
        setIsLoading(true);

        if (dialogType === ModalTypeEnum.ADD) {
            await productContext.addVariant({
                id: 0,
                productId,
                unitSize,
                unitType,
                description,
                active: isActive
            });
        } else if (dialogType === ModalTypeEnum.UPDATE) {
            await productContext.editVariant({
                id: selectedVariant.id,
                productId,
                unitSize,
                unitType,
                description,
                active: isActive
            });
        } else if (dialogType === ModalTypeEnum.DELETE) {
            const variantTransactions = transactionContext
                .transactions
                .flatMap(tr => tr.items)
                .filter(item => item.variantId && selectedVariant.id === item.variantId)

            if (variantTransactions.length > 0) {
                console.log(`Variant with [id=${selectedVariant.id}] have ${variantTransactions.length} transactions, deactivate instead of delete`)
                await productContext.editVariant({
                    id: selectedVariant.id,
                    productId: selectedVariant.productId,
                    unitSize: selectedVariant.unitSize,
                    unitType: selectedVariant.unitType,
                    description: selectedVariant.description,
                    active: false
                });
            } else {
                await productContext.removeVariant(selectedVariant);
            }
        }

        setIsLoading(false);
        closeDialog();
    };

    return (
        <Dialog open={openDialog} onClose={closeDialog} fullWidth maxWidth="sm">
            <DialogTitle>
                {dialogType === ModalTypeEnum.ADD && "Add Variation"}
                {dialogType === ModalTypeEnum.UPDATE && "Edit Variation"}
                {dialogType === ModalTypeEnum.DELETE && "Delete Variation"}
            </DialogTitle>

            <DialogContent>
                {isLoading ? (
                    <LoadingComponent message={"Processing..."} />
                ) : (
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <FormLabel>Product</FormLabel>
                        <Autocomplete
                            options={productOptions}
                            getOptionLabel={(opt) => opt.label}
                            value={productOptions.find(o => o.value === productId) ?? null}
                            onChange={(e, nv) => setProductId(nv?.value ?? 0)}
                            renderInput={(params) => <TextField {...params} fullWidth />}
                        />

                        <FormLabel>Unit Size</FormLabel>
                        <TextField
                            type="number"
                            fullWidth
                            value={unitSize}
                            onChange={(e) => setUnitSize(parseFloat(e.target.value))}
                            placeholder={"e.g., 1.5"}
                        />

                        <FormLabel>Unit Type</FormLabel>
                        <Autocomplete
                            fullWidth
                            options={[UintTypeEnum.KG, UintTypeEnum.L, UintTypeEnum.PACK, UintTypeEnum.PIECE]}
                            getOptionLabel={(opt) => opt}
                            value={unitType}
                            onChange={(event: React.SyntheticEvent, nv: UintTypeEnum | null) => setUnitType(nv)}
                            renderInput={(params) => <TextField {...params} fullWidth />}
                        />

                        <FormLabel>Description</FormLabel>
                        <TextField
                            fullWidth
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder={"e.g., Extra virgin glass bottle"}
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
                        `${dialogType} Variant`,
                        unitSize === 0 || isLoading)
                }
                <Button variant="outlined" onClick={closeDialog}>
                    Cancel
                </Button>
            </DialogActions>
        </Dialog>
    );
};
