// User roles
const USER_ROLES = ["Admin", "Manager", "Agent", "User"];
const DEFAULT_ROLE = "User";
const DEFAULT_TEAM = "Support";

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
const PUBLIC_USER_FIELDS = "name email role team createdAt updatedAt";
const TICKET_POPULATE_CONFIG = [
  { path: "createdBy", select: "name email role team" },
  { path: "assignedTo", select: "name email role team" },
  { path: "updatedBy", select: "name email role team" },
  { path: "comments.author", select: "name email role team" },
  { path: "activityLog.user", select: "name email role team" },
  { path: "attachments.uploadedBy", select: "name email role team" },
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
