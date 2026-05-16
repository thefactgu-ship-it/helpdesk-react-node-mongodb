const User = require("../models/User");
const { HOTEL_ADMIN_ROLES } = require("../constants");

/**
 * Middleware to check if authenticated user has Admin role
 * Must be used after authMiddleware
 */
async function adminMiddleware(req, res, next) {
  try {
    const user = await User.findById(req.user.id).select("role");

    if (!user || !HOTEL_ADMIN_ROLES.includes(user.role)) {
      return res.status(403).json({ message: "Admin access required" });
    }

    next();
  } catch (error) {
    res.status(500).json({ message: "Failed to verify admin access" });
  }
}

module.exports = adminMiddleware;
