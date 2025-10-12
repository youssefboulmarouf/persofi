import * as React from "react";
import Typography from "@mui/material/Typography";

type FormLabelProps = {
    children: React.ReactNode;
    htmlFor?: string;
    required?: boolean;
    hint?: string;
    sx?: any; // keep light; or import SxProps<Theme> if you prefer
};

const FormLabel: React.FC<FormLabelProps> = ({ children, htmlFor, required, hint, sx }) => (
    <Typography
        component="label"
        variant="subtitle1"
        fontWeight={600}
        htmlFor={htmlFor}
        sx={{ display: "flex", alignItems: "baseline", mt: 2, gap: 1, ...sx }}
    >
        <span>{children}{required ? " *" : ""}</span>
        {hint ? (
            <Typography component="span" variant="caption" color="text.secondary">
                {hint}
            </Typography>
        ) : null}
    </Typography>
);

export default React.memo(FormLabel);
