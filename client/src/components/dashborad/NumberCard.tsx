import { Card, CardContent, Stack, Typography } from '@mui/material';

type Props = {
    label: string;
    value: string | number;
    hint?: string;
};

export default function NumberCard({ label, value, hint }: Props) {
    return (
        <Card>
            <CardContent>
                <Stack spacing={0.5}>
                    <Typography variant="body2" color="text.secondary">
                        {label}
                    </Typography>
                    <Typography variant="h5">{value}</Typography>
                    {hint && (
                        <Typography variant="caption" color="text.secondary">
                            {hint}
                        </Typography>
                    )}
                </Stack>
            </CardContent>
        </Card>
    );
}
