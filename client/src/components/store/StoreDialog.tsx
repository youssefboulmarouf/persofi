import {FC, useEffect, useState} from "react";
import {ModalTypeEnum, StoreJson} from "../../model/PersofiModels";
import {getActionButton} from "../common/Utilities";
import {Dialog, DialogActions, DialogContent, DialogTitle, Stack, Switch, TextField} from "@mui/material";
import LoadingComponent from "../common/LoadingComponent";
import FormLabel from "../common/FormLabel";
import Button from "@mui/material/Button";
import {StoreContextValue} from "../../context/StoreContext";
import {TransactionContextValue} from "../../context/TransactionContext";

interface StoreDialogProps {
    selectedStore: StoreJson;
    dialogType: ModalTypeEnum;
    openDialog: boolean;
    closeDialog: () => void;
    storeContext: StoreContextValue;
    transactionContext: TransactionContextValue;
}

export const StoreDialog: FC<StoreDialogProps> = ({
    selectedStore,
    dialogType,
    openDialog,
    closeDialog,
    storeContext,
    transactionContext
}) => {
    const [storeName, setStoreName] = useState<string>("");
    const [storeUrl, setStoreUrl] = useState<string>("");
    const [isActive, setIsActive] = useState<boolean>(true);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    useEffect(() => {
        setStoreName(selectedStore.name ?? "");
        setIsActive(selectedStore.active ?? true);
        setStoreUrl(selectedStore.url ?? "");
    }, [selectedStore, dialogType]);

    const handleSubmit = async () => {
        setIsLoading(true);
        if (dialogType === ModalTypeEnum.ADD) {
            await storeContext.addStore({
                id: 0,
                name: storeName.trim(),
                url: storeUrl.trim(),
                active: isActive
            });
        } else if (dialogType === ModalTypeEnum.UPDATE) {
            await storeContext.editStore({
                id: selectedStore.id,
                name: storeName.trim(),
                url: storeUrl.trim(),
                active: isActive
            });
        } else if (dialogType === ModalTypeEnum.DELETE) {
            const storeTransactions = transactionContext
                .transactions
                .filter(tr => tr.storeId === selectedStore.id);

            if (storeTransactions.length > 1) {
                console.log(`Store with [id=${selectedStore.id}] have ${storeTransactions.length} transactions, deactivate instead of delete`)
                await storeContext.editStore({
                    id: selectedStore.id,
                    name: selectedStore.name,
                    url: selectedStore.url,
                    active: false
                });
            } else {
                await storeContext.removeStore(selectedStore);
            }
        }
        setIsLoading(false);
        closeDialog();
    };

    const emptyForm = () => {
        setStoreName("");
        setStoreUrl("");
        setIsActive(true);

        closeDialog();
    }
    return (
        <Dialog open={openDialog} onClose={() => emptyForm()} PaperProps={{sx: {width: '500px', maxWidth: '500px'}}}>
            <DialogTitle sx={{ mt: 2 }}>{dialogType} Store: {selectedStore.name}</DialogTitle>


            <DialogContent>
                {isLoading ? (
                    <LoadingComponent message={"Processing..."} />
                ) : (
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <FormLabel>Name</FormLabel>
                        <TextField
                            fullWidth
                            value={storeName}
                            onChange={(e) => setStoreName(e.target.value)}
                            placeholder={"e.g., Walmart"}
                        />

                        <FormLabel>URL</FormLabel>
                        <TextField
                            fullWidth
                            value={storeUrl}
                            onChange={(e) => setStoreUrl(e.target.value)}
                            placeholder={"e.g., google.com"}
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
                        `${dialogType} Store`,
                        storeName === "" || isLoading)
                }
                <Button variant="outlined" onClick={closeDialog}>
                    Cancel
                </Button>
            </DialogActions>
        </Dialog>
    );
};
