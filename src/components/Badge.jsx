import { statusConfig } from '../lib/constants';

const badgeClassByStatus = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200',
  accepted: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200',
  cooking: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200',
  ready: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200',
  served: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200',
  delivered: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200',
  on_the_way: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200',
  waste: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200',
};

export function Badge({ status }) {
  const config = statusConfig[status] ?? statusConfig.pending;
  const statusClassName = badgeClassByStatus[status] ?? badgeClassByStatus.pending;

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] transition-all duration-200 shadow-sm ${statusClassName}`}
    >
      {config.label}
    </span>
  );
}
