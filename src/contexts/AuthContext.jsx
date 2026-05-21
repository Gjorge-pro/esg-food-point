import { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

/**
 * AuthContext – Global authentication state.
 *
 * Production flow: uses Supabase auth subscription.
 * Development flow: when URL includes `?devRole=admin|service_desk|customer`
 *   the context loads a mock session from devSessionManager.
 */
const AuthContext = createContext();

function getRequestedDevRole() {
  if (!import.meta.env.DEV) return null;

  const params = new URLSearchParams(window.location.search);
  return params.get('devRole');
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // ---- Development mock session handling ----
  useEffect(() => {
    const devRole = getRequestedDevRole();
    if (!devRole) return;

    import('../devSessionManager').then(({ getMockSession }) => {
      const { user: mockUser, profile: mockProfile } = getMockSession(devRole);
      setUser(mockUser);
      setProfile(mockProfile);
      setLoading(false);
    });
  }, []);

  // ---- Production Supabase auth subscription ----
  useEffect(() => {
    if (getRequestedDevRole()) {
      return;
    }

    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }
    let active = true;
    let profileLoadTimeout;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      clearTimeout(profileLoadTimeout);
      if (session?.user) {
        setUser(session.user);
        profileLoadTimeout = setTimeout(() => {
          if (active) loadUserProfile(session.user.id);
        }, 0);
      } else {
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    });
    return () => {
      active = false;
      clearTimeout(profileLoadTimeout);
      subscription?.unsubscribe();
    };
  }, []);

  async function loadUserProfile(userId) {
    try {
      const { data, error: profileError } = await supabase
        .from('users')
        .select('id, name, role')
        .eq('id', userId)
        .maybeSingle();
      if (profileError) throw profileError;
      setProfile(data);
      setError('');
    } catch (err) {
      console.error('Failed to load profile:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    try {
      setError('');
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      return { success: true };
    } catch (err) {
      console.error('Logout failed:', err);
      setError(err.message);
      return { success: false, error: err.message };
    }
  }

  const isAuthenticated = Boolean(user);
  const isAdmin = profile?.role === 'admin' || profile?.role === 'manager';
  const isStaff = ['admin', 'manager', 'service_desk', 'waiter', 'kitchen'].includes(profile?.role);

  const value = { user, profile, loading, error, logout, isAuthenticated, isAdmin, isStaff };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
