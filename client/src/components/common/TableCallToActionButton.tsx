import { Box, Button } from "@mui/material";

interface TableCallToActionButtonProps {
    callToActionText: string;
    callToActionFunction: () => void;
    fullwidth: boolean;
    disabled?: boolean;
}

const TableCallToActionButton: React.FC<TableCallToActionButtonProps> = ({callToActionText, callToActionFunction, fullwidth, disabled = false}) => {
    return (
        <Box display="flex" gap={1}>
            <Button fullWidth={fullwidth} variant="contained" color="primary" onClick={callToActionFunction} disabled={disabled}>
                {callToActionText}
            </Button>
        </Box>
    );
};

export default TableCallToActionButton;
