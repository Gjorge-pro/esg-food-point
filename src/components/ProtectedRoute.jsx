import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * ProtectedRoute Component
 * 
 * Ensures:
 * - User must be authenticated
 * - User must have required role
 * - Waits for loading to complete before redirecting
 * 
 * @param {React.ReactNode} children - Component to render if authorized
 * @param {string} requiredAccess - 'admin' or 'staff'
 */
export function ProtectedRoute({ children, requiredAccess = 'admin' }) {
  const auth = useAuth();

  // Still loading auth state - don't redirect yet
  if (auth.loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg-main)]">
        <div className="text-center">
          <p className="text-sm font-medium text-[var(--text-secondary)]">
            Loading dashboard...
          </p>
        </div>
      </div>
    );
  }

  // No user logged in - redirect to login
  if (!auth.isAuthenticated || !auth.user) {
    return <Navigate to="/login" replace />;
  }

  // Check role access
  if (requiredAccess === 'admin' && !auth.isAdmin) {
    return <Navigate to="/login" replace />;
  }

  if (requiredAccess === 'staff' && !auth.isStaff) {
    return <Navigate to="/login" replace />;
  }

  // User is authorized - render component
  return children;
}

