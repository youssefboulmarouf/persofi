import Typography from "@mui/material/Typography";

const FormLabel: React.FC<{children: React.ReactNode}> = ({children}) => (
    <Typography variant="subtitle1" fontWeight={600} component="label" sx={{ display: "flex", mt: 2 }}>
        {children}
    </Typography>
);
export default FormLabel;