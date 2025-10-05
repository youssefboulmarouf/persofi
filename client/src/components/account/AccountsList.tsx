import React from "react";
import Typography from "@mui/material/Typography";
import {Table, TableBody, TableCell, TableHead, TableRow} from "@mui/material";
import EditButton from "../common/buttons/EditButton";
import DeleteButton from "../common/buttons/DeleteButton";
import {usePaginationController} from "../common/usePaginationController";
import Pagination from "../common/Pagination";
import IconButton from "@mui/material/IconButton";
import CheckIcon from "@mui/icons-material/Check";
import ClearIcon from "@mui/icons-material/Clear";
import {AccountJson, ModalTypeEnum} from "../../model/PersofiModels";
import LoadingComponent from "../common/LoadingComponent";

interface AccountsListProps {
    accounts: AccountJson[];
    openDialogWithType: (type: ModalTypeEnum, account: AccountJson) => void;
    isLoading: boolean;
}

export const AccountsList: React.FC<AccountsListProps> = ({
    accounts,
    openDialogWithType,
    isLoading
}) => {
    const paginationController = usePaginationController<AccountJson>(accounts);

    if (isLoading) return <LoadingComponent message="Loading Accounts" />;
    if (accounts.length === 0) return <Typography>No Account Found</Typography>;

    return (
        <Table>
            <TableHead>
                <TableRow>
                    <TableCell><Typography variant="h6" fontSize="14px">Id</Typography></TableCell>
                    <TableCell><Typography variant="h6" fontSize="14px">Account Name</Typography></TableCell>
                    <TableCell><Typography variant="h6" fontSize="14px">Account Type</Typography></TableCell>
                    <TableCell><Typography variant="h6" fontSize="14px">Currency</Typography></TableCell>
                    <TableCell><Typography variant="h6" fontSize="14px">Active</Typography></TableCell>
                    <TableCell align="right"><Typography variant="h6" fontSize="14px">Actions</Typography></TableCell>
                </TableRow>
            </TableHead>
            <TableBody>
                {paginationController.data.map((account) => (
                    <TableRow key={account.id}>
                        <TableCell>{account.id}</TableCell>
                        <TableCell>{account.name}</TableCell>
                        <TableCell>{account.accountType}</TableCell>
                        <TableCell>{account.currency}</TableCell>
                        <TableCell>
                            <IconButton color={account.active ? "success" : "error"}>
                                {account.active ? (
                                    <CheckIcon width={22} />
                                ) : (
                                    <ClearIcon width={22} />
                                )}
                            </IconButton>
                        </TableCell>
                        <TableCell align="right">
                            <EditButton
                                tooltipText={"Update Account"}
                                openDialogWithType={() => openDialogWithType(ModalTypeEnum.UPDATE, account)}
                            />
                            <DeleteButton
                                tooltipText={"Delete Account"}
                                openDialogWithType={() => openDialogWithType(ModalTypeEnum.DELETE, account)}
                            />
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
            <Pagination paginationController={paginationController} />
        </Table>
    );
}
