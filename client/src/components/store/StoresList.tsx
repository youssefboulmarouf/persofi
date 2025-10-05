
import React from "react";
import Typography from "@mui/material/Typography";
import {Table, TableBody, TableCell, TableHead, TableRow} from "@mui/material";
import EditButton from "../common/buttons/EditButton";
import DeleteButton from "../common/buttons/DeleteButton";
import {usePaginationController} from "../common/usePaginationController";
import Pagination from "../common/Pagination";
import {ModalTypeEnum, StoreJson} from "../../model/PersofiModels";
import LoadingComponent from "../common/LoadingComponent";
import IconButton from "@mui/material/IconButton";
import CheckIcon from "@mui/icons-material/Check";
import ClearIcon from "@mui/icons-material/Clear";

interface StoresListProps {
    stores: StoreJson[];
    openDialogWithType: (type: ModalTypeEnum, store: StoreJson) => void;
    isLoading: boolean;
}

export const StoresList: React.FC<StoresListProps> = ({stores, openDialogWithType, isLoading}) => {
    const paginationController = usePaginationController<StoreJson>(stores);

    if (isLoading) return <LoadingComponent message="Loading Accounts" />;
    if (stores.length === 0) return <Typography>No Account Found</Typography>;

    return (
        <Table>
            <TableHead>
                <TableRow>
                    <TableCell><Typography variant="h6" fontSize="14px">Id</Typography></TableCell>
                    <TableCell><Typography variant="h6" fontSize="14px">Store Name</Typography></TableCell>
                    <TableCell><Typography variant="h6" fontSize="14px">URL</Typography></TableCell>
                    <TableCell><Typography variant="h6" fontSize="14px">Active</Typography></TableCell>
                    <TableCell align="right"><Typography variant="h6" fontSize="14px">Actions</Typography></TableCell>
                </TableRow>
            </TableHead>

            <TableBody>
                {paginationController.data.map((store) => (
                    <TableRow key={store.id}>
                        <TableCell>{store.id}</TableCell>
                        <TableCell>{store.name}</TableCell>
                        <TableCell>{store.url}</TableCell>
                        <TableCell>
                            <IconButton color={store.active ? "success" : "error"}>
                                {store.active ? (
                                    <CheckIcon width={22} />
                                ) : (
                                    <ClearIcon width={22} />
                                )}
                            </IconButton>
                        </TableCell>
                        <TableCell align="right">
                            <EditButton
                                tooltipText={"Edit Store"}
                                openDialogWithType={() => openDialogWithType(ModalTypeEnum.UPDATE, store)}
                            />
                            <DeleteButton
                                tooltipText={"Delete Store"}
                                openDialogWithType={() => openDialogWithType(ModalTypeEnum.DELETE, store)}
                            />
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
            <Pagination paginationController={paginationController} />
        </Table>
    );
}
