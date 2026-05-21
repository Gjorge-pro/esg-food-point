import {
  Bar,
  BarChart,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ChartFrame } from './ChartFrame';

export function HourlyOrdersChart({ data }) {
  if (!data.length) {
    return <p className="flex h-80 items-center justify-center text-sm text-ink/60">No hourly order data available.</p>;
  }

  return (
    <ChartFrame>
        <BarChart data={data} margin={{ top: 12, right: 16, left: 0, bottom: 28 }}>
          <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" />
          <XAxis
            dataKey="hour"
            tick={{ fontSize: 11, fill: 'var(--text-secondary)' }}
            interval={2}
          />
          <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} />
          <Tooltip formatter={(value) => [value, 'Orders']} />
          <Bar dataKey="orders" fill="var(--info)" radius={[8, 8, 0, 0]} />
        </BarChart>
    </ChartFrame>
  );
}

export default HourlyOrdersChart;
