import {FC, useEffect, useMemo, useState} from "react";
import {CategoryJson, ModalTypeEnum} from "../../model/PersofiModels";
import {getActionButton} from "../common/Utilities";
import {Autocomplete, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Switch, TextField} from "@mui/material";
import LoadingComponent from "../common/LoadingComponent";
import FormLabel from "../common/FormLabel";
import Button from "@mui/material/Button";
import {CategoryContextValue} from "../../context/CategoryContext";
import {TransactionContextValue} from "../../context/TransactionContext";

interface CategoryDialogProps {
    selectedCategory: CategoryJson;
    dialogType: ModalTypeEnum;
    openDialog: boolean;
    closeDialog: () => void;
    categoryContext: CategoryContextValue;
    transactionContext: TransactionContextValue;
}

export const CategoryDialog: FC<CategoryDialogProps> = ({
    selectedCategory,
    dialogType,
    openDialog,
    closeDialog,
    categoryContext,
    transactionContext,
}) => {
    const [categoryName, setCategoryName] = useState<string>("");
    const [isActive, setIsActive] = useState<boolean>(true);
    const [parent, setParent] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const parentOptions = useMemo(() => {
        // Allow selecting no parent (null) or any other category (excluding self when updating)
        const options = categoryContext.categories
            .filter(c => dialogType !== ModalTypeEnum.UPDATE || c.id !== selectedCategory.id)
            .map(c => ({ label: c.name + ` (#${c.id})`, value: c.id }));
        return [{ label: "No Parent", value: null }, ...options];
    }, [categoryContext.categories, dialogType, selectedCategory.id]);

    useEffect(() => {
        setCategoryName(selectedCategory.name ?? "");
        setIsActive(selectedCategory.active ?? true);
        setParent(selectedCategory.parentCategoryId ?? null);
    }, [selectedCategory, dialogType]);

    const handleSubmit = async () => {
        if (categoryName == "") return;

        setIsLoading(true);
        if (dialogType === ModalTypeEnum.ADD) {
            await categoryContext.addCategory({
                id: 0,
                name: categoryName.trim(),
                active: isActive,
                parentCategoryId: parent,
            });
        } else if (dialogType === ModalTypeEnum.UPDATE) {
            await categoryContext.editCategory({
                id: selectedCategory.id,
                name: categoryName.trim(),
                active: isActive,
                parentCategoryId: parent,
            });
        } else if (dialogType === ModalTypeEnum.DELETE) {
            const categoryTransactions = transactionContext
                .transactions
                .flatMap(tr => tr.items)
                .filter(item => item.categoryId === selectedCategory.id);

            if (categoryTransactions.length > 1) {
                console.log(`Category with [id=${selectedCategory.id}] have ${categoryTransactions.length} transactions, deactivate instead of delete`)
                await categoryContext.editCategory({
                    id: selectedCategory.id,
                    name: categoryName.trim(),
                    active: false,
                    parentCategoryId: parent,
                });
            } else {
                await categoryContext.removeCategory(selectedCategory);
            }
        }
        setIsLoading(false);
        emptyForm();
    };

    const emptyForm = () => {
        setCategoryName("");
        setParent(parentOptions[0].value);
        setIsActive(true);

        closeDialog();
    }

    return (
        <Dialog open={openDialog} onClose={() => emptyForm()} PaperProps={{sx: {width: '500px', maxWidth: '500px'}}}>
            <DialogTitle sx={{ mt: 2 }}>{dialogType} Account: {selectedCategory.name}</DialogTitle>

            <DialogContent>
                {isLoading ? (
                    <LoadingComponent message={"Processing..."} />
                ) : (
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <FormLabel>Name</FormLabel>
                        <TextField
                            fullWidth
                            value={categoryName}
                            onChange={(e) => setCategoryName(e.target.value)}
                            placeholder={"e.g., Groceries"}
                        />

                        <FormLabel>Parent Category</FormLabel>
                        <Autocomplete
                            options={parentOptions}
                            getOptionLabel={(opt) => opt.label}
                            value={
                                parent === null
                                    ? parentOptions[0]
                                    : parentOptions.find(o => o.value === parent) ?? parentOptions[0]
                            }
                            onChange={(e, newValue) => setParent(newValue?.value ?? null)}
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
                        `${dialogType} Category`,
                        categoryName === "" || isLoading)
                }
                <Button variant="outlined" onClick={emptyForm}>
                    Cancel
                </Button>
            </DialogActions>
        </Dialog>
    );
};
