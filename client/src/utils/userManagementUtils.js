import {
  LEGACY_ROLES,
  ROLES,
  TICKET_MANAGER_ROLES,
  canManageUsers,
} from "../config/rolePolicy";

const emptyForm = {
  name: "",
  email: "",
  password: "",
  role: ROLES.USER,
  team: "Support",
  departmentId: "",
  hotelId: "",
  hotelAccess: [],
};

const activeRoles = [ROLES.GROUP_ADMIN, ROLES.HOTEL_ADMIN, ROLES.MANAGER, ROLES.AGENT, ROLES.USER];
const hotelAdminAssignableRoles = new Set([ROLES.MANAGER, ROLES.AGENT, ROLES.USER]);

export const legacyRoles = new Set(LEGACY_ROLES);
export const staffRoles = new Set(TICKET_MANAGER_ROLES.concat(ROLES.AGENT));

const multiHotelRoles = new Set(TICKET_MANAGER_ROLES);
const roleRank = {
  [ROLES.USER]: 10,
  [ROLES.AGENT]: 20,
  [ROLES.MANAGER]: 30,
  [ROLES.HOTEL_ADMIN]: 40,
  [ROLES.REGIONAL_MANAGER]: 45,
  [ROLES.ADMIN]: 50,
  [ROLES.GROUP_ADMIN]: 60,
};

export function canUseMultiHotelAccess(role) {
  return multiHotelRoles.has(role);
}

function getRoleRank(role) {
  return roleRank[role] || 0;
}

export function canManageUserRole(currentUser, targetUser) {
  if (currentUser?.role && canManageUsers(currentUser.role) && currentUser.role !== ROLES.HOTEL_ADMIN) {
    return getRoleRank(currentUser?.role) >= getRoleRank(targetUser?.role);
  }

  if (currentUser?.role === ROLES.HOTEL_ADMIN) {
    return hotelAdminAssignableRoles.has(targetUser?.role);
  }

  return getRoleRank(currentUser?.role) >= getRoleRank(targetUser?.role);
}

export function buildAccountStats(users) {
  return users.reduce(
    (stats, user) => {
      if (staffRoles.has(user.role)) stats.staff += 1;
      if (user.role === ROLES.USER) stats.requesters += 1;
      if (getHotelAccessIds(user).length > 1) stats.multiHotel += 1;
      if (legacyRoles.has(user.role)) stats.legacy += 1;
      if (getUserSetupIssues(user).length > 0) stats.needsReview += 1;
      return stats;
    },
    { legacy: 0, multiHotel: 0, needsReview: 0, requesters: 0, staff: 0 },
  );
}

export function matchesUserFilters(user, filters) {
  const keyword = filters.search.trim().toLowerCase();
  const hotelIds = [
    getEntityId(user.hotelId),
    ...getHotelAccessIds(user),
  ].filter(Boolean);
  const userDepartmentId = getEntityId(user.departmentId);
  const setupIssues = getUserSetupIssues(user);
  const text = [
    user.name,
    user.email,
    user.role,
    user.team,
    user.departmentName,
    user.departmentId?.name,
    getHotelLabel(user.hotelId),
  ]
    .join(" ")
    .toLowerCase();

  if (keyword && !text.includes(keyword)) return false;
  if (filters.roleFilter !== "all" && user.role !== filters.roleFilter) return false;
  if (filters.hotelFilter !== "all" && !hotelIds.includes(filters.hotelFilter)) return false;
  if (
    filters.departmentFilter !== "all" &&
    userDepartmentId !== filters.departmentFilter &&
    String(user.departmentName || user.team || "") !== filters.departmentFilter
  ) {
    return false;
  }
  if (filters.setupFilter === "needs-review" && setupIssues.length === 0) return false;
  if (filters.setupFilter === "ready" && setupIssues.length > 0) return false;
  if (filters.setupFilter === "legacy" && !legacyRoles.has(user.role)) return false;
  if (filters.setupFilter === "pending-hotel" && getEntityId(user.hotelId)) return false;

  return true;
}

export function buildRoleFilterOptions(users) {
  const roles = [...new Set(users.map((user) => user.role).filter(Boolean))];
  return [
    { value: "all", label: "All roles", prefix: "A" },
    ...roles.map((role) => ({
      value: role,
      label: role,
      prefix: role.slice(0, 2).toUpperCase(),
    })),
  ];
}

export function buildDepartmentFilterOptions(users, departments) {
  const departmentLookup = new Map(
    departments.map((department) => [getEntityId(department), department]),
  );
  const options = new Map();

  users.forEach((user) => {
    const departmentId = getEntityId(user.departmentId);
    const department = departmentLookup.get(departmentId) || user.departmentId;
    const label = department?.name || user.departmentName || user.team;
    const value = departmentId || label;
    if (value && label) {
      options.set(String(value), {
        value: String(value),
        label,
        meta: department?.code || "Department",
        prefix: String(department?.code || label).slice(0, 2).toUpperCase(),
      });
    }
  });

  return [
    { value: "all", label: "All departments", prefix: "A" },
    ...Array.from(options.values()).sort((a, b) => a.label.localeCompare(b.label)),
  ];
}

export function buildHotelFilterOptions(hotels) {
  return [
    { value: "all", label: "All hotels", prefix: "A" },
    ...hotels.map((hotel) => ({
      value: getEntityId(hotel),
      label: getHotelLabel(hotel),
      meta: hotel.region || "Hotel",
      prefix: String(hotel.code || hotel.name || "HT").slice(0, 2),
    })),
  ];
}

export function getUserSetupIssues(user) {
  const issues = [];
  const primaryHotelId = getEntityId(user.hotelId);
  const accessIds = normalizeHotelAccess(primaryHotelId, getHotelAccessIds(user), user.role);
  const hasDepartment = Boolean(getEntityId(user.departmentId) || user.departmentName || user.team);

  if (user.active === false) issues.push({ label: "Inactive", tone: "neutral" });
  if (legacyRoles.has(user.role)) issues.push({ label: "Legacy role", tone: "warning" });
  if (!primaryHotelId) issues.push({ label: "Pending hotel", tone: "danger" });
  if (user.role === ROLES.USER && !hasDepartment) issues.push({ label: "No department", tone: "danger" });
  if (canUseMultiHotelAccess(user.role) && !accessIds.length) {
    issues.push({ label: "No access", tone: "danger" });
  }

  return issues;
}

export function getRoleOptions(currentRole, currentUser) {
  const roles = currentUser?.role && canManageUsers(currentUser.role) && currentUser.role !== ROLES.HOTEL_ADMIN
    ? activeRoles
    : activeRoles.filter((role) => hotelAdminAssignableRoles.has(role));
  const options = roles.map((role) => ({
    value: role,
    label: role,
    prefix: role.slice(0, 2).toUpperCase(),
  }));

  if (legacyRoles.has(currentRole)) {
    return [
      {
        value: currentRole,
        label: `${currentRole} (legacy)`,
        meta: "Change to GroupAdmin or Manager when possible",
        prefix: currentRole.slice(0, 2).toUpperCase(),
      },
      ...options,
    ];
  }

  return options;
}

export function getEmptyUserForm(selectedHotelId) {
  const primaryHotelId = selectedHotelId === "all" ? "" : selectedHotelId;
  return {
    ...emptyForm,
    hotelId: primaryHotelId,
    hotelAccess: primaryHotelId ? [primaryHotelId] : [],
  };
}

export function getEntityId(entity) {
  return String(entity?._id || entity?.id || entity || "");
}

export function getHotelLabel(hotel) {
  if (!hotel) return "";
  if (typeof hotel === "string") return hotel;
  return [hotel.code, hotel.name].filter(Boolean).join(" / ") || getEntityId(hotel);
}

export function getHotelAccessIds(user) {
  return Array.isArray(user?.hotelAccess)
    ? user.hotelAccess.map(getEntityId).filter(Boolean)
    : [];
}

export function normalizeHotelAccess(primaryHotelId, accessIds, role) {
  const primaryId = String(primaryHotelId || "");
  const ids = canUseMultiHotelAccess(role)
    ? accessIds.map((id) => String(id?._id || id || "")).filter(Boolean)
    : [];
  return [...new Set([primaryId, ...ids].filter(Boolean))];
}

export function getAccessSummary(user, hotels) {
  const primaryId = getEntityId(user.hotelId);
  const hotelLookup = new Map(hotels.map((hotel) => [getEntityId(hotel), hotel]));
  const accessIds = normalizeHotelAccess(primaryId, getHotelAccessIds(user), user.role);
  const otherHotels = accessIds
    .filter((id) => id !== primaryId)
    .map((id) => hotelLookup.get(id) || user.hotelAccess?.find((hotel) => getEntityId(hotel) === id))
    .filter(Boolean);
  const primaryHotel = user.hotelId || hotelLookup.get(primaryId);
  const primaryLabel = getHotelLabel(primaryHotel) || "Pending hotel";

  return otherHotels.length ? `${primaryLabel} + ${otherHotels.length} more` : primaryLabel;
}

export function getAccessHotelLabels(user, hotels) {
  const primaryId = getEntityId(user.hotelId);
  const hotelLookup = new Map(hotels.map((hotel) => [getEntityId(hotel), hotel]));
  const accessIds = normalizeHotelAccess(primaryId, getHotelAccessIds(user), user.role);

  return accessIds
    .map((id) => {
      const hotel = hotelLookup.get(id) || user.hotelAccess?.find((item) => getEntityId(item) === id);
      const label = getHotelLabel(hotel) || id;
      return id === primaryId ? `${label} (Primary)` : label;
    })
    .filter(Boolean);
}

export function formatDate(value) {
  return value ? new Date(value).toLocaleDateString() : "-";
}
