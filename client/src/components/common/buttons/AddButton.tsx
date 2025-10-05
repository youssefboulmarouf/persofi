import IconButton from "@mui/material/IconButton";
import {Tooltip} from "@mui/material";
import React from "react";
import AddIcon from '@mui/icons-material/Add';
import {ButtonProps} from "./ButtonProps";

const AddButton: React.FC<ButtonProps> = ({tooltipText, openDialogWithType, disable = false}) => {
    return (
        <Tooltip title={tooltipText}>
            <IconButton
                color="primary"
                onClick={openDialogWithType}
                disabled={disable}
            >
                <AddIcon width={22} />
            </IconButton>
        </Tooltip>
    )
}

export default AddButton;