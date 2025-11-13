import {Card, CardHeader, CardContent, Divider} from '@mui/material';
import Chart from 'react-apexcharts';
import React from "react";

type Point = { x: string | number; y: number };
type Series = { name: string; data: Point[] };

type Props = {
    title: string;
    series: Series[];
    height?: number;
};

export default function HeatmapChartCard({ title, series, height = 360 }: Props) {
    const options: ApexCharts.ApexOptions = {
        chart: {
            height: 350,
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
        plotOptions: {
            heatmap: {
                shadeIntensity: 0.45,
                radius: 2,
                useFillColorAsStroke: false
            }
        },
        dataLabels: { enabled: false },
        xaxis: { type: 'category' },
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
        <Card sx={{ p: 0, borderColor: (t) => t.palette.divider, width: "100%",}} variant="outlined">
            <CardHeader title={title} />
            <Divider />
            <CardContent>
                <Chart type="heatmap" options={options} series={series} height={height} />
            </CardContent>
        </Card>
    );
}
