import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingBag, BellDot, LayoutDashboard, Clock, LogIn, Moon, Sun } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { LogoutButton } from './LogoutButton';

const navItems = [
  { path: '/', label: 'Customer', icon: ShoppingBag, public: true },
  { path: '/order-history', label: 'Order History', icon: Clock, public: true },
  { path: '/login', label: 'Staff Login', icon: LogIn, public: true, staffOnlyWhenLoggedOut: true },
  { path: '/service-desk', label: 'Service Desk', icon: BellDot, public: false },
  { path: '/admin', label: 'Admin', icon: LayoutDashboard, public: false },
];

export function Navbar() {
  const location = useLocation();
  const auth = useAuth();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
  }, []);

  const toggleTheme = () => {
    const nextIsDark = document.documentElement.classList.toggle('dark');
    window.localStorage.setItem('theme', nextIsDark ? 'dark' : 'light');
    setIsDark(nextIsDark);
  };

  const getAccessibleItems = () => {
    // If admin - only show admin
    if (auth.isAdmin) {
      return navItems.filter((item) => item.path === '/admin');
    }

    // If staff - only show service desk
    if (auth.isStaff) {
      return navItems.filter((item) => item.path === '/service-desk');
    }

    // If not authenticated - show public items and login link
    return navItems.filter((item) => {
      if (item.staffOnlyWhenLoggedOut && auth.isAuthenticated) return false;
      if (item.public) return true;
      return false;
    });
  };

  return (
    <nav className="fixed left-0 top-0 h-screen w-60 border-r border-[var(--border)] bg-[var(--bg-card)]/90 p-6 shadow-lg backdrop-blur flex flex-col">
      <div className="mb-8 flex items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-[var(--text-primary)]">ESG Food Point</h2>
        <button
          type="button"
          onClick={toggleTheme}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--bg-main)] text-[var(--text-primary)] transition-all duration-200 hover:bg-[var(--bg-main)] active:scale-95"
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>

      <div className="flex-1 mb-8 space-y-2">
        {getAccessibleItems().map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-200 ${
                isActive
                  ? 'bg-[var(--color-primary)] text-white shadow-md font-semibold'
                  : 'text-[var(--text-primary)] hover:bg-[var(--bg-main)] font-medium'
              }`}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      {auth.isAuthenticated && auth.profile && (
        <div className="mt-auto rounded-xl border border-[var(--border)] bg-[var(--bg-main)] p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-secondary)] font-semibold">
            {auth.isAdmin ? '🔐 Admin' : '👤 Staff'} Session
          </p>
          <p className="mt-2 font-bold text-[var(--text-primary)]">
            {auth.profile.name}
          </p>
          <p className="text-xs text-[var(--text-secondary)] capitalize">
            {auth.profile.role.replace('_', ' ')}
          </p>
          <div className="mt-4">
            <LogoutButton className="w-full" />
          </div>
        </div>
      )}
    </nav>
  );
}
