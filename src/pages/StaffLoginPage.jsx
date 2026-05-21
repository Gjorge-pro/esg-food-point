import { useState } from 'react';
import { Eye, EyeOff, LockKeyhole } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useStaffAuth } from '../hooks/useStaffAuth';
import { ThemeToggle } from '../components/ThemeToggle';

export function StaffLoginPage() {
  const auth = useAuth(); // Global auth context
  const staffAuth = useStaffAuth(); // For sign in
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [feedback, setFeedback] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Still loading - show loading state
  if (auth.loading) {
    return (
      <div className="app-hero flex min-h-screen items-center justify-center">
        <p className="text-sm font-medium text-white dark:text-gray-200">Loading...</p>
      </div>
    );
  }

  // Already logged in - redirect to appropriate dashboard
  if (auth.isAuthenticated && auth.isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  if (auth.isAuthenticated && auth.isStaff) {
    return <Navigate to="/service-desk" replace />;
  }

  // Invalid role but logged in
  const hasUnsupportedRole = Boolean(
    auth.isAuthenticated && !auth.isAdmin && !auth.isStaff,
  );

  const submit = async (event) => {
    event.preventDefault();
    setFeedback('');

    const result = await staffAuth.signIn(email, password);
    if (result?.error) {
      setFeedback(result.error);
    }
  };

  return (
    <div className="app-hero flex min-h-screen items-center justify-center px-4 py-8">
      <div className="fixed top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md rounded-[2rem] border border-[var(--border)] bg-[var(--bg-card)] p-8 shadow-2xl">
        <div className="mb-5 inline-flex rounded-2xl bg-[var(--color-primary)] p-3 text-white">
          <LockKeyhole size={22} />
        </div>

        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-secondary)]">
          ESG FOOD POINT
        </p>
        <h1 className="mt-3 text-3xl font-bold text-[var(--text-primary)]">Staff Login</h1>
        <p className="mt-3 text-sm text-[var(--text-secondary)]">
          Use one login form for both Service Desk and Admin. We&apos;ll open the right dashboard
          based on your role.
        </p>

        {hasUnsupportedRole ? (
          <div className="mt-8 space-y-4">
            <p className="rounded-xl bg-red-50 dark:bg-red-900/20 px-3 py-2 text-sm text-red-700 dark:text-red-200">
              This account does not have access to the Service Desk or Admin dashboard.
            </p>
            <button
              type="button"
              onClick={() => auth.logout()}
              className="w-full rounded-2xl border border-[var(--border)] bg-[var(--bg-main)] px-5 py-3 font-semibold text-[var(--text-primary)] transition-all duration-200 hover:bg-[var(--border)] active:scale-95"
            >
              Sign out
            </button>
          </div>
        ) : (
          <form className="mt-8 space-y-4" onSubmit={submit}>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]">
              Email
            </span>
            <input
              type="email"
              autoComplete="username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--bg-main)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] px-4 py-3 outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] transition-all duration-200"
              placeholder="staff@esgfoodpoint.com"
            />
          </label>

          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]">
              Password
            </span>
            <div className="relative mt-2">
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-main)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] px-4 py-3 pr-12 outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] transition-all duration-200"
                placeholder="Enter your staff password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 transition hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>

          {feedback || staffAuth.error ? (
            <p className="rounded-xl bg-red-50 dark:bg-red-900/20 px-3 py-2 text-sm text-red-700 dark:text-red-200">
              {feedback || staffAuth.error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={staffAuth.pending || !staffAuth.isConfigured}
            className="app-btn-primary w-full rounded-2xl px-5 py-3 font-semibold transition disabled:opacity-50"
          >
            {staffAuth.pending ? 'Signing in...' : 'Open Dashboard'}
          </button>
          </form>
        )}
      </div>
    </div>
  );
}
