import {
  Cell,
  Legend,
  Pie,
  PieChart,
  Tooltip,
} from 'recharts';
import { currency } from '../../../../lib/formatters';
import { chartColors } from './chartUtils';
import { ChartFrame } from './ChartFrame';

export function ExpensePieChart({ data }) {
  if (!data.length) {
    return <EmptyChart message="No expense distribution data available for this period." />;
  }

  return (
    <ChartFrame>
        <PieChart>
          <Pie
            data={data}
            dataKey="amount"
            nameKey="category"
            cx="50%"
            cy="45%"
            outerRadius={92}
            innerRadius={42}
            paddingAngle={2}
            label={({ category }) => category}
          >
            {data.map((entry, index) => (
              <Cell key={entry.category} fill={chartColors[index % chartColors.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => [currency(value), 'Amount']} />
          <Legend verticalAlign="bottom" height={36} />
        </PieChart>
    </ChartFrame>
  );
}

function EmptyChart({ message }) {
  return <p className="flex h-80 items-center justify-center text-sm text-ink/60">{message}</p>;
}
