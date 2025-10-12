import * as React from "react";
import EditIcon from "@mui/icons-material/Edit";
import IconActionButton from "./IconActionButton";

type Props = {
    tooltipText?: string;
    openDialogWithType?: () => void;
    disable?: boolean;
};

const EditButton: React.FC<Props> = ({ tooltipText, openDialogWithType, disable = false }) => (
    <IconActionButton
        tooltip={tooltipText}
        onClick={openDialogWithType}
        disabled={disable}
        color="warning"
        icon={<EditIcon />}
        iconSize={22}
        aria-label="edit"
    />
);

export default EditButton;
