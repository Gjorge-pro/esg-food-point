import {
  CartesianGrid,
  Line,
  LineChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatChartDateLabel } from './chartUtils';
import { ChartFrame } from './ChartFrame';

export function OrdersChart({ data }) {
  if (!data.length) {
    return <EmptyChart message="No order trend data available for this period." />;
  }

  return (
    <ChartFrame>
        <LineChart data={data} margin={{ top: 12, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tickFormatter={formatChartDateLabel}
            tick={{ fontSize: 12, fill: 'var(--text-secondary)' }}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 12, fill: 'var(--text-secondary)' }}
          />
          <Tooltip
            formatter={(value) => [value, 'Orders']}
            labelFormatter={formatChartDateLabel}
          />
          <Line
            type="monotone"
            dataKey="orders"
            stroke="var(--color-primary)"
            strokeWidth={3}
            dot={{ r: 3 }}
          />
        </LineChart>
    </ChartFrame>
  );
}

function EmptyChart({ message }) {
  return <p className="flex h-80 items-center justify-center text-sm text-ink/60">{message}</p>;
}
