import Box from "@mui/material/Box";
import {CardContent, Stack} from "@mui/material";
import Typography from "@mui/material/Typography";
import LoadingComponent from "../common/LoadingComponent";
import {FC} from "react";

interface DashboardCardProps {
    title: string;
    currentMonth?: string;
    currentMonthStats?: string | number;
    pastMonth?: string;
    pastMonthStats?: string | number;
    color: string;
    isLoading?: boolean;
}

const DashboardCard: FC<DashboardCardProps> = ({
    title,
    currentMonth,
    currentMonthStats,
    pastMonth,
    pastMonthStats,
    color,
    isLoading = false
}) => {
    return (
        <Box bgcolor={color + ".light"} textAlign="center">
            <CardContent>
                {isLoading ? (
                    <LoadingComponent message={"Processing ..."}/>
                ) : (
                    <>
                        <Typography variant={"h3"} color={color + ".main"}>{`${title}`}</Typography>
                        <Stack direction={"row"} spacing={2} justifyContent="space-between">
                            <Typography color={color + ".main"} mt={1} variant="subtitle1" fontWeight={600}>
                                {currentMonth}
                            </Typography>
                            <Typography color={color + ".main"} variant="h4" fontWeight={600}>
                                {currentMonthStats}
                            </Typography>
                        </Stack>

                        <Stack direction={"row"} spacing={2} justifyContent="space-between">
                            <Typography color={color + ".main"} mt={1} variant="caption" fontWeight={300}>
                                {pastMonth}
                            </Typography>
                            <Typography color={color + ".main"} variant="caption" fontWeight={300}>
                                {pastMonthStats}
                            </Typography>
                        </Stack>
                    </>
                )}
            </CardContent>
        </Box>
    );
};
export default DashboardCard;