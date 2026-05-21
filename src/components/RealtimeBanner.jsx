export function RealtimeBanner({ isConfigured, isLoading, error }) {
  let message = 'Connected to Supabase. Real-time order updates are active.';
  let tone = 'bg-green-600 dark:bg-green-900 text-white dark:text-green-100';

  if (!isConfigured) {
    message = 'Supabase env vars are missing. The app is running in demo-safe mode until you add them.';
    tone = 'bg-amber-600 dark:bg-amber-900 text-white dark:text-amber-100';
  } else if (isLoading) {
    message = 'Loading menu items and recent orders from Supabase...';
    tone = 'bg-[var(--color-primary)] dark:bg-orange-900 text-white dark:text-orange-100';
  } else if (error) {
    message = error;
    tone = 'bg-red-600 dark:bg-red-900 text-white dark:text-red-100';
  }

  return <div className={`mb-6 rounded-2xl px-4 py-3 text-sm font-medium shadow-sm ${tone}`}>{message}</div>;
}
