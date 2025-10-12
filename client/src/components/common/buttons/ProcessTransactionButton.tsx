import * as React from "react";
import SettingsIcon from "@mui/icons-material/Settings";
import IconActionButton from "./IconActionButton";

type Props = {
    tooltipText?: string;
    openDialogWithType?: () => void;
    disable?: boolean;
};

const ProcessTransactionButton: React.FC<Props> = ({ tooltipText, openDialogWithType, disable = false }) => (
    <IconActionButton
        tooltip={tooltipText}
        onClick={openDialogWithType}
        disabled={disable}
        color="primary"
        icon={<SettingsIcon />}
        iconSize={22}
        aria-label="process"
    />
);

export default ProcessTransactionButton;
