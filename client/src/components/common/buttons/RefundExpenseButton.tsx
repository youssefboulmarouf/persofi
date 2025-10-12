import * as React from "react";
import SyncIcon from "@mui/icons-material/Sync";
import IconActionButton from "./IconActionButton";

type Props = {
    tooltipText?: string;
    openDialogWithType?: () => void;
    disable?: boolean;
};

const RefundExpenseButton: React.FC<Props> = ({ tooltipText, openDialogWithType, disable = false }) => (
    <IconActionButton
        tooltip={tooltipText}
        onClick={openDialogWithType}
        disabled={disable}
        color="secondary"
        icon={<SyncIcon />}
        iconSize={22}
        aria-label="refund"
    />
);

export default RefundExpenseButton;
