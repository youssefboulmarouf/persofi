import React from "react";
import Typography from "@mui/material/Typography";
import { Table, TableBody, TableCell, TableHead, TableRow } from "@mui/material";
import EditButton from "../common/buttons/EditButton";
import DeleteButton from "../common/buttons/DeleteButton";
import { usePaginationController } from "../common/usePaginationController";
import Pagination from "../common/Pagination";
import IconButton from "@mui/material/IconButton";
import CheckIcon from "@mui/icons-material/Check";
import ClearIcon from "@mui/icons-material/Clear";
import LoadingComponent from "../common/LoadingComponent";
import { ModalTypeEnum, BrandJson } from "../../model/PersofiModels";

interface BrandsListProps {
    brands: BrandJson[];
    openDialogWithType: (type: ModalTypeEnum, brand: BrandJson) => void;
    isLoading: boolean;
}

export const BrandsList: React.FC<BrandsListProps> = ({ brands, openDialogWithType, isLoading }) => {
    const paginationController = usePaginationController<BrandJson>(brands);

    if (isLoading) return <LoadingComponent message="Loading Brands" />;
    if (brands.length === 0) return <Typography>No Brand Found</Typography>;

    return (
        <Table>
            <TableHead>
                <TableRow>
                    <TableCell><Typography>ID</Typography></TableCell>
                    <TableCell><Typography>Name</Typography></TableCell>
                    <TableCell><Typography>URL</Typography></TableCell>
                    <TableCell><Typography>Active</Typography></TableCell>
                    <TableCell align="right"><Typography>Actions</Typography></TableCell>
                </TableRow>
            </TableHead>

            <TableBody>
                {paginationController.data.map((brand) => (
                    <TableRow key={brand.id} hover>
                        <TableCell>{brand.id}</TableCell>
                        <TableCell>{brand.name}</TableCell>
                        <TableCell>{brand.url}</TableCell>
                        <TableCell>
                            <IconButton color={brand.active ? "success" : "error"}>
                                {brand.active ? (
                                    <CheckIcon width={22} />
                                ) : (
                                    <ClearIcon width={22} />
                                )}
                            </IconButton>
                        </TableCell>
                        <TableCell align="right">
                            <EditButton
                                tooltipText={"Edit Brand"}
                                openDialogWithType={() => openDialogWithType(ModalTypeEnum.UPDATE, brand)}
                            />
                            <DeleteButton
                                tooltipText={"Delete Brand"}
                                openDialogWithType={() => openDialogWithType(ModalTypeEnum.DELETE, brand)}
                            />
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
            <Pagination paginationController={paginationController} />
        </Table>
    );
};
