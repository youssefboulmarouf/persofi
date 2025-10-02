import IconButton from "@mui/material/IconButton";
import DeleteIcon from "@mui/icons-material/Delete";
import {Tooltip} from "@mui/material";
import React from "react";
import {ButtonProps} from "./ButtonProps";

const DeleteButton: React.FC<ButtonProps> = ({tooltipText, openDialogWithType, disable = false}) => {
    return (
        <Tooltip title={tooltipText}>
            <IconButton
                color="error"
                onClick={openDialogWithType}
                disabled={disable}
            >
                <DeleteIcon width={22} />
            </IconButton>
        </Tooltip>
    )
}

export default DeleteButton;