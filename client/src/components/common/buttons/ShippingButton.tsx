import IconButton from "@mui/material/IconButton";
import {Tooltip} from "@mui/material";
import React from "react";
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import {ButtonProps} from "./ButtonProps";

const ShippingButton: React.FC<ButtonProps> = ({tooltipText, openDialogWithType, disable = false}) => {
    return (
        <Tooltip title={tooltipText}>
            <IconButton
                color="primary"
                onClick={openDialogWithType}
                disabled={disable}
            >
                <LocalShippingIcon width={22} />
            </IconButton>
        </Tooltip>
    )
}

export default ShippingButton;