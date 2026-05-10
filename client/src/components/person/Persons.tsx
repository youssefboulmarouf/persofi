import { FC, useMemo, useState } from "react";
import Breadcrumb from "../common/Breadcrumb";
import { Card, CardContent, Grid } from "@mui/material";
import { Stack } from "@mui/system";
import { useDialogController } from "../common/useDialogController";
import TableCallToActionButton from "../common/TableCallToActionButton";
import Box from "@mui/material/Box";
import PersonsFilter from "./PersonsFilter";
import { PersonsList } from "./PersonsList";
import { PersonDialog } from "./PersonDialog";
import { ModalTypeEnum, PersonJson } from "../../model/PersofiModels";
import { usePersons } from "../../hooks/usePersons";

interface FilterProps {
  searchTerm: string;
  active: boolean;
}

const bCrumb = [
  {to: "/", title: "Home"},
  {title: "Persons"},
];

const emptyPerson: PersonJson = {
  id: 0,
  name: "",
  active: true,
};

export const Persons: FC = () => {
    const [filters, setFilters] = useState<FilterProps>({ searchTerm: "", active: true });
    const personDialog = useDialogController<PersonJson>(emptyPerson);
    const { data: personsData, isLoading: isPersonsLoading } = usePersons();
    const persons = personsData || [];

    const filteredPersons = useMemo(() => {
        const searchTerm = filters.searchTerm.toLowerCase();
        return persons.filter((person) => {
            const nameMatches = filters.searchTerm ? person.name.toLowerCase().includes(searchTerm) : true;
            const activeMatches = filters.active ? person.active : true;
            return nameMatches && activeMatches;
        });
    }, [filters, persons]);

    return (
        <>
            <Breadcrumb title="Accounts" items={bCrumb} />
            <Grid container spacing={1}>
                <Card sx={{padding: 0, borderColor: (theme) => theme.palette.divider}} variant="outlined">
                    <CardContent>
                        <Stack spacing={2}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                                <PersonsFilter filters={filters} setFilters={setFilters}/>
                                <TableCallToActionButton
                                    fullwidth={false}
                                    callToActionText="Add Account"
                                    callToActionFunction={() => personDialog.openDialog(ModalTypeEnum.ADD, emptyPerson)}
                                />
                            </Stack>

                            <Box sx={{ overflowX: "auto" }} mt={3}>
                                <PersonsList
                                    persons={filteredPersons}
                                    openDialogWithType={personDialog.openDialog}
                                    isLoading={isPersonsLoading}
                                />
                            </Box>
                        </Stack>
                    </CardContent>
                </Card>
            </Grid>

            <PersonDialog
                selectedPerson={personDialog.data}
                dialogType={personDialog.type}
                openDialog={personDialog.open}
                closeDialog={personDialog.closeDialog}
            />
        </>
    );
};
