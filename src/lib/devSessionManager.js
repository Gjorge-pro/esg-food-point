/**
 * Development Session Manager
 * 
 * DEVELOPMENT-ONLY utility for multi-role testing
 * Provides isolated session storage keys per role
 * 
 * Production auth remains on 'sb-auth-token' (untouched)
 * Dev sessions use: sb-auth-token-{role}
 * 
 * This allows simultaneous testing of:
 * - Admin Dashboard
 * - Service Desk Dashboard  
 * - Customer Interface
 * 
 * WITHOUT breaking production authentication
 */

const isDevelopment = import.meta.env.DEV;

const DEV_ROLES = {
  admin: 'admin',
  service_desk: 'service_desk',
  customer: 'customer'
};

const STORAGE_KEYS = {
  production: 'sb-auth-token',
  admin: 'sb-auth-token-admin',
  service_desk: 'sb-auth-token-service-desk',
  customer: 'sb-auth-token-customer'
};

/**
 * Get storage key based on role
 * In development mode, returns role-specific key
 * In production, always returns production key
 */
export function getStorageKeyForRole(role) {
  if (!isDevelopment || !role) {
    return STORAGE_KEYS.production;
  }
  
  return STORAGE_KEYS[role] || STORAGE_KEYS.production;
}

/**
 * Check if we're in dev testing mode
 */
export function isDevTestingMode() {
  return isDevelopment;
}

/**
 * Get current dev role from URL or localStorage
 */
export function getCurrentDevRole() {
  if (!isDevelopment) return null;
  
  const params = new URLSearchParams(window.location.search);
  const urlRole = params.get('devRole');
  
  if (urlRole && Object.values(DEV_ROLES).includes(urlRole)) {
    return urlRole;
  }
  
  const storedRole = localStorage.getItem('dev-current-role');
  return storedRole && Object.values(DEV_ROLES).includes(storedRole) ? storedRole : null;
}

/**
 * Set current dev role
 */
export function setCurrentDevRole(role) {
  if (!isDevelopment) return;
  
  if (Object.values(DEV_ROLES).includes(role)) {
    localStorage.setItem('dev-current-role', role);
  }
}

/**
 * Clear all dev sessions
 */
export function clearAllDevSessions() {
  if (!isDevelopment) return;
  
  Object.values(STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  });
  localStorage.removeItem('dev-current-role');
}

/**
 * Get all active dev sessions
 */
export function getActiveDevSessions() {
  if (!isDevelopment) return [];
  
  const active = [];
  
  Object.entries(DEV_ROLES).forEach(([key, role]) => {
    const storageKey = STORAGE_KEYS[role];
    const sessionData = localStorage.getItem(storageKey);
    if (sessionData) {
      try {
        const parsed = JSON.parse(sessionData);
        active.push({
          role,
          hasSession: !!parsed.access_token,
          user: parsed.user?.email || 'Unknown'
        });
      } catch (e) {
        // Ignore parse errors
      }
    }
  });
  
  return active;
}

/**
 * Open a dev role in new window
 */
export function openDevRoleWindow(role) {
  if (!isDevelopment) return;
  
  const url = `${window.location.origin}/?devRole=${role}`;
  window.open(url, `dev-${role}-window`);
}

export default {
  getStorageKeyForRole,
  isDevTestingMode,
  getCurrentDevRole,
  setCurrentDevRole,
  clearAllDevSessions,
  getActiveDevSessions,
  openDevRoleWindow,
  DEV_ROLES,
  STORAGE_KEYS
};
