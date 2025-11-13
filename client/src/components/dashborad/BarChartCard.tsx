import { Card, CardHeader, CardContent } from '@mui/material';
import Chart from 'react-apexcharts';

type Series = { name: string; data: number[] };

type Props = {
    title: string;
    categories: (string | number)[];
    series: Series[];
    height?: number;
};

export default function BarChartCard({ title, categories, series, height = 320 }: Props) {
    const options: ApexCharts.ApexOptions = {
        chart: { toolbar: { show: false }, animations: { enabled: true } },
        xaxis: { categories },
        plotOptions: { bar: { columnWidth: '55%' } },
        dataLabels: { enabled: false },
        grid: { strokeDashArray: 4 }
    };
    return (
        <Card>
            <CardHeader title={title} />
            <CardContent>
                <Chart type="bar" options={options} series={series} height={height} />
            </CardContent>
        </Card>
    );
}
