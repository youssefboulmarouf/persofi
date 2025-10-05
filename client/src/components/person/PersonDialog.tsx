import { FC, useEffect, useState } from "react";
import { Dialog, DialogActions, DialogContent, DialogTitle, Stack, Switch, TextField } from "@mui/material";
import Button from "@mui/material/Button";
import LoadingComponent from "../common/LoadingComponent";
import FormLabel from "../common/FormLabel";
import { getActionButton } from "../common/Utilities";
import {ModalTypeEnum, PersonJson} from "../../model/PersofiModels";
import { PersonContextValue } from "../../context/PersonContext";
import {TransactionContextValue} from "../../context/TransactionContext";

interface PersonDialogProps {
    selectedPerson: PersonJson;
    dialogType: ModalTypeEnum;
    openDialog: boolean;
    closeDialog: () => void;
    personContext: PersonContextValue;
    transactionContext: TransactionContextValue;
}

export const PersonDialog: FC<PersonDialogProps> = ({
    selectedPerson,
    dialogType,
    openDialog,
    closeDialog,
    personContext,
    transactionContext,
}) => {
    const [personName, setPersonName] = useState<string>("");
    const [isActive, setIsActive] = useState<boolean>(true);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    useEffect(() => {
        if (openDialog && selectedPerson) {
            setPersonName(selectedPerson.name ?? "");
            setIsActive(selectedPerson.active ?? true);
        }
    }, [openDialog, selectedPerson]);

    const emptyForm = () => {
        setPersonName("");
        setIsActive(true);

        closeDialog();
    }

    const handleSubmit = async () => {
        if (!personName) {
            // show error
            console.log(`Missing personName`)
            return;
        }

        setIsLoading(true);

        if (dialogType === ModalTypeEnum.ADD) {
            await personContext.addPerson({
                id: 0,
                name: personName.trim(),
                active: isActive,
            });
        } else if (dialogType === ModalTypeEnum.UPDATE) {
            await personContext.editPerson({
                id: selectedPerson.id,
                name: personName.trim(),
                active: isActive,
            });
        } else if (dialogType === ModalTypeEnum.DELETE) {
            const personTransactions = transactionContext
                .transactions
                .filter(tr => tr.personId == selectedPerson.id);
            console.log(`personTransactions: ${personTransactions.length}`)

            if (personTransactions.length > 0) {
                console.log(`Person with [id=${selectedPerson.id}] have ${personTransactions.length} transactions, deactivate instead of delete`)
                await personContext.editPerson({
                    id: selectedPerson.id,
                    name: personName.trim(),
                    active: false,
                });
            } else {
              await personContext.removePerson(selectedPerson);
            }
        }
        closeDialog();

        setIsLoading(false);

        if (personContext.error) {
            // show error
            console.log(`Error while ${dialogType} person`, personContext.error);
        } else {
            emptyForm();
        }
    };

    const actionButton = getActionButton(
        dialogType,
        handleSubmit,
        `${dialogType} Person`,
        personName === "" || isLoading
    );

    return (
        <Dialog open={openDialog} onClose={() => emptyForm()} PaperProps={{sx: {width: '500px', maxWidth: '500px'}}}>
            <DialogTitle sx={{ mt: 2 }}>{dialogType} Person: {selectedPerson.name}</DialogTitle>
            <DialogContent>
                {isLoading ? (
                    <LoadingComponent message={"Loading Persons..."} />
                ) : (
                    <Stack spacing={2}>
                        <FormLabel>Id</FormLabel>
                        <TextField fullWidth value={selectedPerson.id === 0 ? "" : selectedPerson.id} disabled />

                        <FormLabel>Name</FormLabel>
                        <TextField
                            fullWidth
                            value={personName}
                            onChange={(e) => setPersonName(e.target.value)}
                            disabled={dialogType === ModalTypeEnum.DELETE}
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
                        `${dialogType} Person`,
                        personName === "" || isLoading)
                }
                <Button variant="outlined" onClick={emptyForm}>
                  Cancel
                </Button>
            </DialogActions>
    </Dialog>
  );
};
