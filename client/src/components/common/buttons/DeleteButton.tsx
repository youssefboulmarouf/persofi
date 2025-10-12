import * as React from "react";
import DeleteIcon from "@mui/icons-material/Delete";
import IconActionButton from "./IconActionButton";

type Props = {
    tooltipText?: string;
    openDialogWithType?: () => void;
    disable?: boolean;
};

const DeleteButton: React.FC<Props> = ({ tooltipText, openDialogWithType, disable = false }) => (
    <IconActionButton
        tooltip={tooltipText}
        onClick={openDialogWithType}
        disabled={disable}
        color="error"
        icon={<DeleteIcon />}
        iconSize={22}
        aria-label="delete"
    />
);

export default DeleteButton;
