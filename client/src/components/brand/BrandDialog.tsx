import { FC, useEffect, useState } from "react";
import { Dialog, DialogActions, DialogContent, DialogTitle, Stack, Switch, TextField } from "@mui/material";
import Button from "@mui/material/Button";
import LoadingComponent from "../common/LoadingComponent";
import FormLabel from "../common/FormLabel";
import { getActionButton } from "../common/Utilities";
import {ModalTypeEnum, BrandJson, AccountTypeEnum, CurrencyEnum} from "../../model/PersofiModels";
import { useAddBrand, useUpdateBrand, useDeleteBrand } from "../../hooks/useBrands";
import { useTransactions } from "../../hooks/useTransactions";

interface BrandDialogProps {
    selectedBrand: BrandJson;
    dialogType: ModalTypeEnum;
    openDialog: boolean;
    closeDialog: () => void;
}

export const BrandDialog: FC<BrandDialogProps> = ({
    selectedBrand,
    dialogType,
    openDialog,
    closeDialog
}) => {
    const [brandName, setBrandName] = useState<string>("");
    const [brandUrl, setBrandUrl] = useState<string>("");
    const [isActive, setIsActive] = useState<boolean>(true);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const { mutateAsync: addBrand } = useAddBrand();
    const { mutateAsync: updateBrand } = useUpdateBrand();
    const { mutateAsync: deleteBrand } = useDeleteBrand();
    
    const { data: transactionsData } = useTransactions();
    const transactions = transactionsData || [];

    useEffect(() => {
        if (openDialog && selectedBrand) {
            setBrandName(selectedBrand.name ?? "");
            setBrandUrl(selectedBrand.url ?? "");
            setIsActive(selectedBrand.active ?? true);
        }
    }, [openDialog, selectedBrand]);

    const handleSubmit = async () => {
        setIsLoading(true);

        try {
            if (dialogType === ModalTypeEnum.ADD) {
                await addBrand({
                    id: 0,
                    name: brandName.trim(),
                    url: brandUrl.trim(),
                    active: isActive,
                });
            } else if (dialogType === ModalTypeEnum.UPDATE) {
                await updateBrand({
                    id: selectedBrand.id,
                    name: brandName.trim(),
                    url: brandUrl.trim(),
                    active: isActive,
                });
            } else if (dialogType === ModalTypeEnum.DELETE) {
                const brandTransactions = transactions
                    .flatMap(tr => tr.items)
                    .filter(item => item.brandId === selectedBrand.id);

                if (brandTransactions.length > 1) {
                    console.log(`Brand with [id=${selectedBrand.id}] have ${brandTransactions.length} transactions, deactivate instead of delete`)
                    await updateBrand({
                        id: selectedBrand.id,
                        name: brandName.trim(),
                        url: brandUrl.trim(),
                        active: isActive,
                    });
                } else {
                    await deleteBrand(selectedBrand);
                }
            }
        } catch (err) {
            console.log(`Error while ${dialogType} brand`, err);
        } finally {
            setIsLoading(false);
            emptyForm();
        }
    };

    const emptyForm = () => {
        setBrandName("");
        setBrandUrl("");
        setIsActive(true);

        closeDialog();
    }

    return (
        <Dialog open={openDialog} onClose={() => emptyForm()} PaperProps={{sx: {width: '500px', maxWidth: '500px'}}}>
            <DialogTitle sx={{ mt: 2 }}>{dialogType} Brand: {selectedBrand.name}</DialogTitle>

            <DialogContent>
                {isLoading ? (
                    <LoadingComponent message={"Processing..."} />
                ) : (
                    <Stack spacing={2}>
                        <FormLabel>Name</FormLabel>
                        <TextField
                            fullWidth
                            value={brandName}
                            onChange={(e) => setBrandName(e.target.value)}
                        />
                        <FormLabel>URL</FormLabel>
                        <TextField
                            fullWidth
                            value={brandUrl}
                            onChange={(e) => setBrandUrl(e.target.value)}
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
                        `${dialogType} Account`,
                        brandName === "" || isLoading)
                }
                <Button variant="outlined" onClick={emptyForm}>
                    Cancel
                </Button>
            </DialogActions>
        </Dialog>
    );
};
