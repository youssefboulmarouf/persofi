import {FC, useMemo, useState} from "react";
import Breadcrumb from "../common/Breadcrumb";
import {Card, CardContent, Grid} from "@mui/material";
import {Stack} from "@mui/system";
import {useDialogController} from "../common/useDialogController";
import {ModalTypeEnum, StoreJson} from "../../model/PersofiModels";
import TableCallToActionButton from "../common/TableCallToActionButton";
import Box from "@mui/material/Box";
import StoresFilter from "./StoresFilter";
import {StoresList} from "./StoresList";
import {StoreDialog} from "./StoreDialog";
import { useStores } from "../../hooks/useStores";

interface FilterProps {
    searchTerm: string;
    active: boolean;
}

const bCrumb = [
    {to: "/", title: "Home"},
    {title: "Stores"},
];

const emptyStore: StoreJson = {
    id: 0,
    name: "",
    url: "",
    active: true,
};

export const Stores: FC = () => {
    const [filters, setFilters] = useState<FilterProps>({searchTerm: "", active: true});
    const storeDialog = useDialogController<StoreJson>(emptyStore);
    const { data: storesData, isLoading: isStoresLoading } = useStores();
    const stores = storesData || [];

    const filteredStores = useMemo(() => {
        return stores.filter(store => {
            const search = filters.searchTerm.toLowerCase();
            const nameMatch = filters.searchTerm ? store.name.toLowerCase().includes(search) : true;
            const activeMatch = filters.active ? store.active : true;
            return nameMatch && activeMatch;
        }) || [];
    }, [stores, filters]);

    return (
        <>
            <Breadcrumb title="Stores" items={bCrumb} />
            <Grid container mt={3}>
                <Card sx={{padding: 0, borderColor: (theme) => theme.palette.divider}} variant="outlined">
                    <CardContent>
                        <Stack justifyContent="space-between" direction={{ xs: "column", sm: "row" }} spacing={{ xs: 1, sm: 2, md: 4 }}>
                            <StoresFilter filters={filters} setFilters={setFilters} />
                            <TableCallToActionButton
                                fullwidth={false}
                                callToActionText="Add Store"
                                callToActionFunction={() => storeDialog.openDialog(ModalTypeEnum.ADD, emptyStore)}
                            />
                        </Stack>
                        <Box sx={{ overflowX: "auto" }} mt={3}>
                            <StoresList
                                stores={filteredStores}
                                openDialogWithType={storeDialog.openDialog}
                                isLoading={isStoresLoading}
                            />
                        </Box>
                    </CardContent>
                </Card>
            </Grid>

            <StoreDialog
                selectedStore={storeDialog.data}
                dialogType={storeDialog.type}
                openDialog={storeDialog.open}
                closeDialog={storeDialog.closeDialog}
            />
        </>
    );
}
