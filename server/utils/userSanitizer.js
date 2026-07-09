const { USER_ROLES, DEFAULT_ROLE } = require("../constants");

/**
 * Normalize user role to one of allowed roles
 * @param {string} role - Role to normalize
 * @returns {string} Normalized role
 */
function normalizeRole(role) {
  if (!role) return DEFAULT_ROLE;
  return USER_ROLES.includes(role) ? role : DEFAULT_ROLE;
}

/**
 * Sanitize user object - remove sensitive fields, return only safe fields
 * @param {Object} user - Mongoose user document
 * @returns {Object} Sanitized user object
 */
function sanitizeUser(user) {
  if (!user) return null;
  
  return {
    id: user._id,
    _id: user._id,
    name: user.name,
    email: user.email,
    authProvider: user.authProvider || "password",
    role: user.role,
    team: user.team,
    departmentId: user.departmentId,
    departmentName: user.departmentName,
    active: user.active !== false,
    hotelId: user.hotelId,
    hotelAccess: user.hotelAccess || [],
    regions: user.regions || [],
    mustChangePassword: Boolean(user.mustChangePassword),
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

module.exports = {
  normalizeRole,
  sanitizeUser,
};
