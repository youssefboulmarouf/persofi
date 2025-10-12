import * as React from "react";
import { IconButton, Tooltip } from "@mui/material";
import {cloneElement} from "react";

type MuiIconEl = React.ReactElement<{ sx?: any; style?: React.CSSProperties }>;

export type IconActionButtonProps = {
    tooltip?: string;
    onClick?: () => void;
    disabled?: boolean;
    color?:
        | "inherit"
        | "default"
        | "primary"
        | "secondary"
        | "error"
        | "info"
        | "success"
        | "warning";
    "aria-label"?: string;
    iconSize?: number;
    icon: MuiIconEl;
};

const IconActionButton: React.FC<IconActionButtonProps> = ({
    tooltip,
    onClick,
    disabled = false,
    color = "primary",
    "aria-label": ariaLabel,
    iconSize,
    icon,
}) => {
    const sizedIcon = iconSize
        ? cloneElement(icon, {sx: { ...(icon.props.sx || {}), fontSize: iconSize }})
        : icon;

    const button = (
        <IconButton
            color={color}
            onClick={onClick}
            disabled={disabled}
            aria-label={ariaLabel || tooltip}
            size="small"
        >
            {sizedIcon}
        </IconButton>
    );

    return tooltip ? <Tooltip title={tooltip} arrow>{button}</Tooltip> : button;
};

export default React.memo(IconActionButton);
