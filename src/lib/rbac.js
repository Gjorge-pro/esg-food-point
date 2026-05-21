export const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  SERVICE_DESK: 'service_desk',
  WAITER: 'waiter',
  KITCHEN: 'kitchen',
};

export function canAccessAdmin(role) {
  return [ROLES.ADMIN, ROLES.MANAGER].includes(role);
}

export function canAccessServiceDesk(role) {
  return [ROLES.ADMIN, ROLES.SERVICE_DESK, ROLES.WAITER, ROLES.MANAGER].includes(role);
}

export function canManageAdmin(role) {
  return role === ROLES.ADMIN;
}

export function canViewReports(role) {
  return [ROLES.ADMIN, ROLES.MANAGER].includes(role);
}

export function canManageOrders(role) {
  return [ROLES.ADMIN, ROLES.SERVICE_DESK, ROLES.WAITER].includes(role);
}
