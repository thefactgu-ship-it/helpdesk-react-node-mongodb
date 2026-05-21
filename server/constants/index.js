// User roles
const USER_ROLES = [
  "GroupAdmin",
  "RegionalManager",
  "HotelAdmin",
  "Admin",
  "Manager",
  "Agent",
  "User",
];
const DEFAULT_ROLE = "User";
const DEFAULT_TEAM = "Support";
const GROUP_ROLES = ["GroupAdmin", "Admin"];
const HOTEL_ADMIN_ROLES = ["GroupAdmin", "Admin", "HotelAdmin"];
const MANAGER_ROLES = ["GroupAdmin", "Admin", "RegionalManager", "HotelAdmin", "Manager"];
const STAFF_ROLES = ["GroupAdmin", "Admin", "RegionalManager", "HotelAdmin", "Manager", "Agent"];
const ROLE_PERMISSION_MATRIX = Object.freeze({
  canManageTickets: MANAGER_ROLES,
  canAssignTickets: MANAGER_ROLES,
  canManageUsers: HOTEL_ADMIN_ROLES,
  canManageDepartments: MANAGER_ROLES,
  canManageHotelSettings: HOTEL_ADMIN_ROLES,
});

// Ticket priorities and SLA hours mapping
const TICKET_PRIORITIES = ["low", "medium", "high", "critical"];
const SLA_HOURS_MAP = {
  low: 72,
  medium: 24,
  high: 8,
  critical: 4,
};
const DEFAULT_PRIORITY = "medium";
const DEFAULT_SLA_HOURS = 24;

// Ticket statuses
const TICKET_STATUSES = ["open", "in_progress", "resolved", "closed"];
const DEFAULT_STATUS = "open";

// Ticket categories and departments
const DEFAULT_CATEGORY = "General";
const DEFAULT_DEPARTMENT = "IT";

// API response fields
const PUBLIC_USER_FIELDS = "name email role team departmentId departmentName active hotelId hotelAccess createdAt updatedAt";
const TICKET_POPULATE_CONFIG = [
  { path: "hotelId", select: "name code region timezone active" },
  { path: "requesterUserId", select: "name email role team departmentId departmentName hotelId" },
  { path: "departmentId", select: "name code active hotelId" },
  { path: "createdBy", select: "name email role team departmentId departmentName hotelId" },
  { path: "assignedTo", select: "name email role team departmentId departmentName hotelId" },
  { path: "updatedBy", select: "name email role team departmentId departmentName hotelId" },
  { path: "satisfactionSubmittedBy", select: "name email role team departmentId departmentName hotelId" },
  { path: "comments.author", select: "name email role team departmentId departmentName hotelId" },
  { path: "activityLog.user", select: "name email role team departmentId departmentName hotelId" },
  { path: "attachments.uploadedBy", select: "name email role team departmentId departmentName hotelId" },
];

// Activity log actions
const ACTIVITY_ACTIONS = {
  CREATED: "created",
  UPDATED: "updated",
  STATUS_CHANGED: "status",
  COMMENTED: "commented",
  ATTACHMENT_ADDED: "attachment_added",
};

module.exports = {
  USER_ROLES,
  DEFAULT_ROLE,
  DEFAULT_TEAM,
  GROUP_ROLES,
  HOTEL_ADMIN_ROLES,
  MANAGER_ROLES,
  ROLE_PERMISSION_MATRIX,
  STAFF_ROLES,
  TICKET_PRIORITIES,
  SLA_HOURS_MAP,
  DEFAULT_PRIORITY,
  DEFAULT_SLA_HOURS,
  TICKET_STATUSES,
  DEFAULT_STATUS,
  DEFAULT_CATEGORY,
  DEFAULT_DEPARTMENT,
  PUBLIC_USER_FIELDS,
  TICKET_POPULATE_CONFIG,
  ACTIVITY_ACTIONS,
};
