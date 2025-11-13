import Chart from "react-apexcharts";
import React from "react";
import { ApexOptions } from "apexcharts";
import { Card, CardContent, CardHeader, Divider } from "@mui/material";
import {useTheme} from "@mui/material/styles";

interface MultyStatsChartProps {
    title: string;
    categories: string[];
    series: {name: string, data: number[]}[];
}

const DashboardBarChart: React.FC<MultyStatsChartProps> = ({title, categories, series}) => {
    const theme = useTheme();
    const primary = theme.palette.primary.main;
    const primarylight = theme.palette.grey[100];

    const options: ApexOptions = {
        chart: {
            height: 350,
            type: 'bar',
            foreColor: "#adb0bb",
            toolbar: { show: false },
        },
        colors: [primary],
        plotOptions: {
            bar: {
                borderRadius: 4,
                columnWidth: '45%',
                distributed: true,
            },
        },
        dataLabels: {
            enabled: false,
        },
        legend: {
            show: false,
        },
        grid: {
            yaxis: {
                lines: {
                    show: false,
                },
            },
        },
        xaxis: {
            type: "category",
            categories,
            labels: {
                rotate: -45,
                datetimeUTC: false,
            },
        },
        yaxis: {
            labels: {
                show: true,
            },
        },
        tooltip: {
            theme: "dark",
        },
    };

    return (
        <Card sx={{ p: 0, borderColor: (t) => t.palette.divider, width: 500 }} variant="outlined">
            <CardHeader title={title} />
            <Divider />
            <CardContent>
                <Chart options={options} series={series} type="bar" height="500" width="100%" />
            </CardContent>
        </Card>
    );
};

export default DashboardBarChart;
