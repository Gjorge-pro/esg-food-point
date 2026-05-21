export function formatCompactNumber(value) {
  if (Math.abs(value) >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }

  if (Math.abs(value) >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }

  return `${value}`;
}

export function formatChartDateLabel(value) {
  return new Date(value).toLocaleDateString('en-TZ', {
    month: 'short',
    day: 'numeric',
  });
}

export const chartColors = [
  'var(--color-primary)',
  'var(--info)',
  'var(--success)',
  'var(--warning)',
  'rgb(var(--text-primary-rgb) / 0.72)',
  'rgb(var(--text-primary-rgb) / 0.5)',
];
