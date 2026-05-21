// devSessionManager.js – provides isolated mock sessions for development testing
// It does NOT affect production authentication flow.
// Usage: import { getMockSession } from '../devSessionManager';
// getMockSession(role) returns { user, profile } objects used by AuthContext.

// Define supported roles and mock profile data
const mockProfiles = {
  admin: {
    id: 'dev-admin-id',
    name: 'Dev Admin',
    role: 'admin',
  },
  service_desk: {
    id: 'dev-service-desk-id',
    name: 'Dev Service Desk',
    role: 'service_desk', // can be any staff role
  },
  staff: {
    id: 'dev-service-desk-id',
    name: 'Dev Service Desk',
    role: 'service_desk',
  },
  customer: {
    id: 'dev-customer-id',
    name: 'Dev Customer',
    role: 'customer',
  },
};

/**
 * Returns a mock session for the given role.
 * If role is unknown, defaults to a generic customer session.
 */
export function getMockSession(role) {
  const profile = mockProfiles[role] || mockProfiles.customer;
  const user = {
    id: profile.id,
    email: `${profile.role}@dev.local`,
    // supabase user object shape (minimal required fields)
    user_metadata: { name: profile.name },
  };
  return { user, profile };
}

/**
 * Helper to generate a URL with a devRole query parameter.
 */
export function buildDevUrl(basePath, role) {
  const url = new URL(window.location.origin);
  url.pathname = basePath;
  url.searchParams.set('devRole', role);
  return url.toString();
}
