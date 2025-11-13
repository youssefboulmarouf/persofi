import { Card, CardContent, CardHeader } from '@mui/material';
import Chart from 'react-apexcharts';

type Series = { name: string; data: number[] };

type Props = {
    title: string;
    categories: (string | number)[];
    series: Series[];
    height?: number;
};

export default function ChartCard({ title, categories, series, height = 300 }: Props) {
    const options: ApexCharts.ApexOptions = {
        chart: { toolbar: { show: false }, animations: { enabled: true } },
        xaxis: { categories },
        stroke: { width: 2, curve: 'smooth' },
        dataLabels: { enabled: false },
        grid: { strokeDashArray: 4 }
    };

    return (
        <Card>
            <CardHeader title={title} />
            <CardContent>
                <Chart type="line" options={options} series={series} height={height} />
            </CardContent>
        </Card>
    );
}
