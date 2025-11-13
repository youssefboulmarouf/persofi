import Chart from "react-apexcharts";
import React from "react";
import { ApexOptions } from "apexcharts";
import { Card, CardContent, CardHeader, Divider } from "@mui/material";

interface MultyStatsChartProps {
    title: string;
    categories: string[];
    series: {name: string, data: number[]}[];
}

const MultyStatsChart: React.FC<MultyStatsChartProps> = ({title, categories, series}) => {
    const options: ApexOptions = {
        chart: {
            height: 350,
            type: "line",
            foreColor: "#adb0bb",
            toolbar: { show: false },
            dropShadow: {
                enabled: true,
                color: "rgba(0,0,0,0.2)",
                top: 12,
                left: 4,
                blur: 3,
                opacity: 0.4,
            },
        },
        stroke: {
            width: 3,
            curve: "smooth",
        },
        xaxis: {
            type: "category",
            categories,
            labels: {
                rotate: -45,
                datetimeUTC: false,
            },
        },
        markers: {
            size: 3,
            strokeOpacity: 0.9,
            strokeColors: "#fff",
            strokeWidth: 2,
            hover: { size: 6 },
        },
        tooltip: {
            theme: "dark",
        },
        grid: {
            show: true,
        },
        legend: {
            position: "top",
            horizontalAlign: "right",
        },
    };

    return (
        <Card sx={{ p: 0, borderColor: (t) => t.palette.divider, width: "49%" }} variant="outlined">
            <CardHeader title={title} />
            <Divider />
            <CardContent>
                <Chart options={options} series={series} type="line" height="500px" width="100%" />
            </CardContent>
        </Card>
    );
};

export default MultyStatsChart;
