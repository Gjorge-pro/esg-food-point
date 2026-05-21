import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { currency } from '../../../../lib/formatters';
import { formatChartDateLabel, formatCompactNumber } from './chartUtils';
import { ChartFrame } from './ChartFrame';

export function IncomeExpenseChart({ data }) {
  if (!data.length) {
    return <EmptyChart message="No income and expense trend data available for this period." />;
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
            tickFormatter={formatCompactNumber}
            tick={{ fontSize: 12, fill: 'var(--text-secondary)' }}
          />
          <Tooltip
            formatter={(value, label) => {
              const labels = { income: 'Income', expenses: 'Expenses', profit: 'Profit' };
              return [currency(value), labels[label] || label];
            }}
            labelFormatter={formatChartDateLabel}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="income"
            stroke="var(--success)"
            strokeWidth={3}
            dot={{ r: 3 }}
          />
          <Line
            type="monotone"
            dataKey="expenses"
            stroke="var(--error)"
            strokeWidth={3}
            dot={{ r: 3 }}
          />
          <Line
            type="monotone"
            dataKey="profit"
            stroke="var(--info)"
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
