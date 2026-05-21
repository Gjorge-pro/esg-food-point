import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

/**
 * LogoutButton Component
 * 
 * Centralized logout handler
 * Usage: <LogoutButton /> or <LogoutButton variant="text" />
 * 
 * Variants:
 * - "button" (default) - Full button with icon and text
 * - "icon" - Just the icon
 * - "text" - Just the text
 */
export function LogoutButton({ variant = 'button', className = '' }) {
  const auth = useAuth();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      const result = await auth.logout();
      
      if (result.success) {
        // Redirect to login after successful logout
        navigate('/login', { replace: true });
      } else {
        console.error('Logout failed:', result.error);
        alert('Failed to logout. Please try again.');
      }
    } catch (err) {
      console.error('Logout error:', err);
      alert('An error occurred during logout.');
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (variant === 'icon') {
    return (
      <button
        onClick={handleLogout}
        disabled={isLoggingOut}
        className={`inline-flex items-center justify-center h-10 w-10 rounded-lg border border-[var(--border)] bg-[var(--bg-main)] text-[var(--text-primary)] transition-all duration-200 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-700 active:scale-95 disabled:opacity-50 ${className}`}
        title="Logout"
        aria-label="Logout"
      >
        <LogOut size={18} />
      </button>
    );
  }

  if (variant === 'text') {
    return (
      <button
        onClick={handleLogout}
        disabled={isLoggingOut}
        className={`text-sm font-semibold text-[var(--text-primary)] transition-all duration-200 hover:text-red-600 active:scale-95 disabled:opacity-50 ${className}`}
      >
        {isLoggingOut ? 'Logging out...' : 'Logout'}
      </button>
    );
  }

  // Default: button variant
  return (
    <button
      onClick={handleLogout}
      disabled={isLoggingOut}
      className={`flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-sm font-semibold text-[var(--text-primary)] transition-all duration-200 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-700 active:scale-95 disabled:opacity-50 ${className}`}
    >
      <LogOut size={16} />
      <span>{isLoggingOut ? 'Logging out...' : 'Sign out'}</span>
    </button>
  );
}
