import { useEffect } from 'react';
import { ShieldCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { AdminView } from '../features/admin/AdminView';
import { canManageAdmin } from '../lib/rbac';
import { LogoutButton } from '../components/LogoutButton';
import { ThemeToggle } from '../components/ThemeToggle';

export function AdminPage() {
  const auth = useAuth();
  const role = auth.profile?.role;

  // STRICT BACK BUTTON PREVENTION
  // Replace history so browser back button cannot exit dashboard
  useEffect(() => {
    // Replace current history entry - this removes the "back" destination
    window.history.replaceState({ page: 'admin' }, '', window.location.href);

    const handlePopState = (event) => {
      // If user somehow triggers popstate, push back to admin
      window.history.pushState({ page: 'admin' }, '', window.location.href);
    };

    window.addEventListener('popstate', handlePopState, false);

    return () => {
      window.removeEventListener('popstate', handlePopState, false);
    };
  }, []);

  return (
    <div className="min-h-screen">
      <div className="w-full flex min-h-screen flex-col px-4 py-6 sm:px-6 lg:px-8 pt-16 sm:pt-6">
        <header className="app-hero mb-6 overflow-hidden rounded-lg sm:rounded-[2rem] border border-white/10 px-4 sm:px-6 py-4 sm:py-6 shadow-panel">
          <div className="flex flex-col gap-4 sm:gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <p className="mb-2 inline-flex items-center rounded-full bg-white/10 dark:bg-gray-700/50 px-2 sm:px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-brand-100 dark:text-brand-300 whitespace-nowrap">
                ESG FOOD POINT
              </p>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-white dark:text-gray-100">
                Admin Dashboard
              </h1>
              <p className="mt-2 sm:mt-3 max-w-xl text-xs sm:text-sm text-white/75 dark:text-gray-300">
                Owner tools for menu control, financial tracking, operational analysis, and reporting.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:gap-3 rounded-lg sm:rounded-2xl bg-white/10 dark:bg-gray-700/50 px-4 sm:px-5 py-3 sm:py-4 flex-shrink-0">
              <div className="flex items-start justify-between gap-3 sm:gap-4">
                <div className="min-w-0">
                  <ShieldCheck size={18} className="mb-1 sm:mb-2 text-brand-100 dark:text-brand-300 flex-shrink-0" />
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-100 dark:text-brand-300">
                    Access
                  </p>
                  <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-white/80 dark:text-gray-300">
                    {canManageAdmin(role) ? 'Admin access granted.' : 'Manager report access granted.'}
                  </p>
                </div>
                {/* Theme toggle and logout button in top-right */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <ThemeToggle />
                  <LogoutButton variant="icon" />
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="grid flex-1 gap-4 sm:gap-6 lg:grid-cols-[200px_1fr] xl:grid-cols-[260px_1fr]">
          <aside className="rounded-lg sm:rounded-[1.75rem] border border-brand-100 bg-[var(--bg-card)]/90 p-3 sm:p-4 shadow-panel backdrop-blur">
            <div className="rounded-xl sm:rounded-2xl bg-brand-50 p-3 sm:p-4">
              {auth.profile ? (
                <div className="rounded-lg sm:rounded-xl bg-[var(--bg-card)] p-2 sm:p-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">Staff session</p>
                  <p className="mt-1 sm:mt-2 font-semibold text-gray-900 dark:text-gray-100 text-sm truncate">
                    {auth.profile.name} - {auth.profile.role.replace('_', ' ')}
                  </p>
                  {/* Secondary logout button */}
                  <div className="mt-3 sm:mt-4">
                    <LogoutButton className="w-full text-xs" />
                  </div>
                </div>
              ) : (
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  Sign in with an admin account to access owner tools and reports.
                </p>
              )}
            </div>
          </aside>

          <section className="rounded-lg sm:rounded-[1.75rem] border border-brand-100 bg-[var(--bg-card)]/90 p-3 sm:p-4 md:p-6 shadow-panel backdrop-blur overflow-x-auto">
            <AdminView role={role} />
          </section>
        </main>
      </div>
    </div>
  );
}
