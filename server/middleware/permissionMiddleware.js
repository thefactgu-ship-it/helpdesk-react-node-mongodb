const User = require("../models/User");
const { hasRolePermission } = require("../utils/tenantScope");

function requirePermission(permission, message = "Access denied") {
  return async (req, res, next) => {
    try {
      const user = await User.findById(req.user.id).select("role");

      if (!user || !hasRolePermission(user, permission)) {
        return res.status(403).json({ message });
      }

      next();
    } catch (error) {
      res.status(500).json({ message: "Failed to verify access" });
    }
  };
}

module.exports = {
  requirePermission,
};
