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
import { ModalTypeEnum, PersonJson } from "../../model/PersofiModels";

interface PersonsListProps {
    persons: PersonJson[];
    openDialogWithType: (type: ModalTypeEnum, person: PersonJson) => void;
    isLoading: boolean;
}

export const PersonsList: React.FC<PersonsListProps> = ({ persons, openDialogWithType,isLoading }) => {
    const paginationController = usePaginationController<PersonJson>(persons);

    if (isLoading) return <LoadingComponent message="Loading Persons" />;
    if (persons.length === 0) return <Typography>No Person Found</Typography>;

    return (
        <Table>
            <TableHead>
                <TableRow>
                    <TableCell><Typography>ID</Typography></TableCell>
                    <TableCell><Typography>Name</Typography></TableCell>
                    <TableCell><Typography>Active</Typography></TableCell>
                    <TableCell align="right"><Typography>Actions</Typography></TableCell>
                </TableRow>
            </TableHead>

        <TableBody>
            {paginationController.data.map((person) => (
                <TableRow key={person.id} hover>
                    <TableCell>{person.id}</TableCell>
                    <TableCell>{person.name}</TableCell>
                    <TableCell>
                        <IconButton color={person.active ? "success" : "error"}>
                            {person.active ? (
                                <CheckIcon width={22} />
                            ) : (
                                <ClearIcon width={22} />
                            )}
                        </IconButton>
                    </TableCell>
                    <TableCell align="right">
                        <EditButton
                            tooltipText={"Edit Person"}
                            openDialogWithType={() => openDialogWithType(ModalTypeEnum.UPDATE, person)}
                        />
                        <DeleteButton
                            tooltipText={"Delete Person"}
                            openDialogWithType={() => openDialogWithType(ModalTypeEnum.DELETE, person)}
                        />
                    </TableCell>
          </TableRow>
        ))}
      </TableBody>

      <Pagination paginationController={paginationController} />
    </Table>
  );
};
