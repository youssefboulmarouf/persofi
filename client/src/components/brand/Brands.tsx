import { FC, useMemo, useState } from "react";
import Breadcrumb from "../common/Breadcrumb";
import { Card, CardContent, Grid } from "@mui/material";
import { Stack } from "@mui/system";
import { useDialogController } from "../common/useDialogController";
import TableCallToActionButton from "../common/TableCallToActionButton";
import Box from "@mui/material/Box";
import BrandsFilter from "./BrandsFilter";
import { BrandsList } from "./BrandsList";
import { BrandDialog } from "./BrandDialog";
import { ModalTypeEnum, BrandJson } from "../../model/PersofiModels";
import { useBrands } from "../../hooks/useBrands";

interface FilterProps {
    searchTerm: string;
    active: boolean;
}

const bCrumb = [
  {to: "/", title: "Home"},
  {title: "Brands"},
];

const emptyBrand: BrandJson = {
    id: 0,
    name: "",
    url: "",
    active: true,
};

export const Brands: FC = () => {
    const [filters, setFilters] = useState<FilterProps>({ searchTerm: "", active: true });
    const brandDialog = useDialogController<BrandJson>(emptyBrand);
    const { data: brandsData, isLoading: isBrandsLoading } = useBrands();
    const brands = brandsData || [];

    const filteredBrands = useMemo(() => {
        const searchTerm = filters.searchTerm.toLowerCase();
        return brands.filter((b) => {
            const nameMatches = filters.searchTerm ? b.name.toLowerCase().includes(searchTerm) : true;
            const activeMatches = filters.active ? b.active : true;
            return nameMatches && activeMatches;
        });
    }, [filters, brands]);

    return (
        <>
            <Breadcrumb title="Brands" items={bCrumb} />
            <Grid container mt={3}>
                <Card sx={{padding: 0, borderColor: (theme) => theme.palette.divider}} variant="outlined">
                      <CardContent>
                          <Stack direction="row" justifyContent="space-between" alignItems="center">
                              <BrandsFilter filters={filters} setFilters={setFilters} />
                              <TableCallToActionButton
                                    callToActionText={"New Brand"}
                                    callToActionFunction={() => brandDialog.openDialog(ModalTypeEnum.ADD, emptyBrand)}
                                    fullwidth={false}
                              />
                          </Stack>
                          <Box sx={{ overflowX: "auto" }} mt={3}>
                              <BrandsList
                                  brands={filteredBrands}
                                  openDialogWithType={brandDialog.openDialog}
                                  isLoading={isBrandsLoading}
                              />
                          </Box>
                      </CardContent>
                </Card>
            </Grid>

            <BrandDialog
                selectedBrand={brandDialog.data}
                dialogType={brandDialog.type}
                openDialog={brandDialog.open}
                closeDialog={brandDialog.closeDialog}
            />
      </>
    );
};
