export const ROLES = Object.freeze({
  USER: "User",
  AGENT: "Agent",
  MANAGER: "Manager",
  HOTEL_ADMIN: "HotelAdmin",
  REGIONAL_MANAGER: "RegionalManager",
  ADMIN: "Admin",
  GROUP_ADMIN: "GroupAdmin",
});

export const LEGACY_ROLES = Object.freeze([ROLES.ADMIN, ROLES.REGIONAL_MANAGER]);

export const TICKET_MANAGER_ROLES = Object.freeze([
  ROLES.GROUP_ADMIN,
  ROLES.ADMIN,
  ROLES.REGIONAL_MANAGER,
  ROLES.HOTEL_ADMIN,
  ROLES.MANAGER,
]);

export const GROUP_CONTROL_ROLES = Object.freeze([ROLES.GROUP_ADMIN]);

export const DEPARTMENT_MANAGER_ROLES = Object.freeze([
  ROLES.GROUP_ADMIN,
  ROLES.ADMIN,
  ROLES.HOTEL_ADMIN,
]);

export const ROLE_PERMISSION_MATRIX = Object.freeze({
  canManageTickets: TICKET_MANAGER_ROLES,
  canAssignTickets: TICKET_MANAGER_ROLES,
  canManageUsers: Object.freeze([ROLES.GROUP_ADMIN, ROLES.ADMIN, ROLES.HOTEL_ADMIN]),
  canManageDepartments: DEPARTMENT_MANAGER_ROLES,
  canManageHotelSettings: Object.freeze([ROLES.GROUP_ADMIN, ROLES.ADMIN, ROLES.HOTEL_ADMIN]),
});

export function getWorkQueueProfile(role) {
  if (role === ROLES.USER) return "requester";
  if (role === ROLES.GROUP_ADMIN) return "groupAdmin";
  if (role === ROLES.HOTEL_ADMIN) return "hotelAdmin";
  if (role === ROLES.AGENT) return "agent";
  if (role === ROLES.MANAGER) return "manager";
  return "staff";
}

export function canManageTickets(role) {
  return hasRolePermission(role, "canManageTickets");
}

export function canAssignTickets(role) {
  return hasRolePermission(role, "canAssignTickets");
}

export function canManageUsers(role) {
  return hasRolePermission(role, "canManageUsers");
}

export function canManageDepartments(role) {
  return hasRolePermission(role, "canManageDepartments");
}

export function canManageHotelSettings(role) {
  return hasRolePermission(role, "canManageHotelSettings");
}

export function hasRolePermission(role, permission) {
  return (ROLE_PERMISSION_MATRIX[permission] || []).includes(role);
}

export function canUseGroupControlQueue(role) {
  return GROUP_CONTROL_ROLES.includes(role);
}

export function isAgentAssignedToTicket(currentUserId, ticket) {
  const assignedTo = String(ticket?.assignedTo?._id || ticket?.assignedTo?.id || ticket?.assignedTo || "");
  return Boolean(currentUserId) && assignedTo === String(currentUserId);
}

export function canUpdateTicketStatus(role, currentUserId, ticket) {
  return canManageTickets(role) || (role === ROLES.AGENT && isAgentAssignedToTicket(currentUserId, ticket));
}
