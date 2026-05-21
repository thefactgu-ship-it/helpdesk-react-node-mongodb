import { ROLE_PERMISSION_MATRIX, ROLES, TICKET_MANAGER_ROLES } from "./rolePolicy";

export const groupRoles = [ROLES.GROUP_ADMIN, ROLES.ADMIN, ROLES.REGIONAL_MANAGER];

export const adminRoles = [...ROLE_PERMISSION_MATRIX.canManageUsers];

export const ticketManagerRoles = [...TICKET_MANAGER_ROLES];

export const ticketAssignmentRoles = [...ROLE_PERMISSION_MATRIX.canAssignTickets];

export const departmentManagerRoles = [...ROLE_PERMISSION_MATRIX.canManageDepartments];

export const hotelSettingsManagerRoles = [...ROLE_PERMISSION_MATRIX.canManageHotelSettings];

export const pageTitles = {
  dashboard: {
    title: "Dashboard",
    subtitle: "Important issues and problem patterns for helpdesk analysis",
  },
  tickets: {
    title: "Helpdesk Tickets",
    subtitle: "Search, review, update, and manage all tickets",
  },
  "add-ticket": {
    title: "Add Ticket",
    subtitle: "Create a new helpdesk request",
  },
  "monthly-report": {
    title: "Monthly Report",
    subtitle: "Review helpdesk performance by month",
  },
  "quarterly-report": {
    title: "Quarterly / Yearly",
    subtitle: "Compare ticket trends across longer periods",
  },
  assets: {
    title: "Asset Management",
    subtitle: "Prepare and track IT assets for each department",
  },
  hotels: {
    title: "Hotel Management",
    subtitle: "Create hotels and control group-level tenant setup",
  },
  departments: {
    title: "Department Management",
    subtitle: "Maintain hotel departments for tickets, users, and reports",
  },
  "user-management": {
    title: "User Management",
    subtitle: "Create accounts and manage system access",
  },
  "problem-types": {
    title: "Problem Types",
    subtitle: "Maintain common helpdesk categories",
  },
  profile: {
    title: "Profile",
    subtitle: "Update your account details and password",
  },
};
