import IconButton from "@mui/material/IconButton";
import {Tooltip} from "@mui/material";
import React from "react";
import SyncIcon from '@mui/icons-material/Sync';
import {ButtonProps} from "./ButtonProps";

const SyncInventoryButton: React.FC<ButtonProps> = ({tooltipText, openDialogWithType, disable = false}) => {
    return (
        <Tooltip title={tooltipText}>
            <IconButton
                color="primary"
                onClick={openDialogWithType}
                disabled={disable}
            >
                <SyncIcon width={22} />
            </IconButton>
        </Tooltip>
    )
}

export default SyncInventoryButton;