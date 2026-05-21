import {
  Bar,
  BarChart,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ChartFrame } from './ChartFrame';

export function TopItemsChart({ data }) {
  if (!data.length) {
    return <EmptyChart message="No top-selling item data available for this period." />;
  }

  return (
    <ChartFrame>
        <BarChart data={data} margin={{ top: 12, right: 16, left: 0, bottom: 40 }}>
          <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 12, fill: 'var(--text-secondary)' }}
            angle={-20}
            textAnchor="end"
            interval={0}
            height={64}
          />
          <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} />
          <Tooltip formatter={(value) => [value, 'Total sold']} />
          <Bar dataKey="quantity" fill="var(--color-primary)" radius={[10, 10, 0, 0]} />
        </BarChart>
    </ChartFrame>
  );
}

function EmptyChart({ message }) {
  return <p className="flex h-80 items-center justify-center text-sm text-ink/60">{message}</p>;
}
