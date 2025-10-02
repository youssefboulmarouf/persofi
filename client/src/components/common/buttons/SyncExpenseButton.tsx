import IconButton from "@mui/material/IconButton";
import {Tooltip} from "@mui/material";
import React from "react";
import CurrencyExchangeIcon from '@mui/icons-material/CurrencyExchange';
import {ButtonProps} from "./ButtonProps";

const SyncExpenseButton: React.FC<ButtonProps> = ({tooltipText, openDialogWithType, disable = false}) => {
    return (
        <Tooltip title={tooltipText}>
            <IconButton
                color="primary"
                onClick={openDialogWithType}
                disabled={disable}
            >
                <CurrencyExchangeIcon width={22} />
            </IconButton>
        </Tooltip>
    )
}

export default SyncExpenseButton;