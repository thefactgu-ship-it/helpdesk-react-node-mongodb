const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Hotel = require("../models/Hotel");
const Department = require("../models/Department");
const { sanitizeUser, normalizeRole } = require("../utils/userSanitizer");
const { GROUP_ROLES, MANAGER_ROLES, PUBLIC_USER_FIELDS } = require("../constants");
const { buildHotelScopeQuery, canManageHotels, getAllowedHotelIds, getUserHotelId } = require("../utils/tenantScope");
const { canManageRole } = require("../utils/roleHierarchy");
const auditLog = require("../utils/auditLogger");

const MULTI_HOTEL_ACCESS_ROLES = new Set(["GroupAdmin", "Admin", "RegionalManager", "HotelAdmin", "Manager"]);

async function resolveHotelId(req, requestedHotelId) {
  if (requestedHotelId) {
    const allowedHotelIds = await getAllowedHotelIds(req.user);
    if (allowedHotelIds.includes(String(requestedHotelId))) return requestedHotelId;
    const error = new Error("Hotel is outside your access scope");
    error.statusCode = 403;
    throw error;
  }
  return getUserHotelId(req.user);
}

async function getDefaultHotelId(requestedHotelId) {
  if (requestedHotelId) return requestedHotelId;
  const hotel = await Hotel.findOne({ active: { $ne: false } }).sort({ createdAt: 1 }).select("_id");
  return hotel?._id;
}

async function resolveDepartment(departmentId, hotelId) {
  if (!departmentId) return null;

  const department = await Department.findOne({
    _id: departmentId,
    hotelId,
    active: { $ne: false },
  }).select("_id name");

  if (!department) {
    const error = new Error("Department not found for this hotel");
    error.statusCode = 400;
    throw error;
  }

  return department;
}

async function normalizeHotelAccessIds(req, primaryHotelId, requestedHotelAccess, targetRole) {
  const primaryId = String(primaryHotelId || "");
  const requestedIds = Array.isArray(requestedHotelAccess)
    ? requestedHotelAccess
        .map((item) => String(item?._id || item || ""))
        .filter(Boolean)
    : String(requestedHotelAccess || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
  const allowedHotelIds = await getAllowedHotelIds(req.user);
  const canAssignMultiple = MULTI_HOTEL_ACCESS_ROLES.has(normalizeRole(targetRole));
  const requestedSet = new Set([primaryId, ...(canAssignMultiple ? requestedIds : [])].filter(Boolean).map(String));
  const scopedIds = [...requestedSet].filter((id) => allowedHotelIds.includes(id));

  if (primaryId && !scopedIds.includes(primaryId)) {
    const error = new Error("Primary hotel is outside your access scope");
    error.statusCode = 403;
    throw error;
  }

  const activeHotels = await Hotel.find({
    _id: { $in: scopedIds },
    active: { $ne: false },
  }).select("_id");
  const activeIds = activeHotels.map((hotel) => String(hotel._id));

  if (primaryId && !activeIds.includes(primaryId)) {
    const error = new Error("Primary hotel must be active");
    error.statusCode = 400;
    throw error;
  }

  return activeIds;
}

function normalizeAssignableRole(requester, role) {
  const normalized = normalizeRole(role);
  if (canManageHotels(requester)) return normalized;
  return ["Manager", "Agent", "User"].includes(normalized) ? normalized : "User";
}

/**
 * Register new user
 * POST /api/auth/register
 */
async function register(req, res) {
  try {
    const { name, email, password, team, hotelId, departmentId } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "Name, email, and password are required" });
    }

    // Check if user already exists
    const resolvedHotelId = await getDefaultHotelId(hotelId);
    const existingUser = await User.findOne({ email, hotelId: resolvedHotelId });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const department = await resolveDepartment(departmentId, resolvedHotelId);
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "User",
      team: department?.name || team || "Support",
      departmentId: department?._id || null,
      departmentName: department?.name || team || "Support",
      hotelId: resolvedHotelId,
      hotelAccess: resolvedHotelId ? [resolvedHotelId] : [],
    });

    res.status(201).json({
      message: "User registered",
      user: sanitizeUser(user),
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    res.status(500).json({ message: "Register failed" });
  }
}

/**
 * Login user
 * POST /api/auth/login
 */
async function login(req, res) {
  try {
    const { email, password, hotelId } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // Find user and compare password
    const matchingUsers = hotelId
      ? await User.find({ email, hotelId }).sort({ createdAt: 1 })
      : await User.find({ email }).sort({ createdAt: 1 });
    const user =
      matchingUsers.find((candidate) => GROUP_ROLES.includes(candidate.role)) ||
      matchingUsers[0];
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role,
        hotelId: user.hotelId,
        hotelAccess: user.hotelAccess || [],
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    res.status(500).json({ message: "Login failed" });
  }
}

/**
 * Get current authenticated user
 * GET /api/auth/me
 */
async function getCurrentUser(req, res) {
  try {
    const user = await User.findById(req.user.id).select("-password").populate({
      path: "hotelId",
      select: "name code region timezone active",
    })
      .populate({ path: "hotelAccess", select: "name code region timezone active" })
      .populate({ path: "departmentId", select: "name code active hotelId" });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Failed to load user" });
  }
}

/**
 * Update current authenticated user's profile
 * PATCH /api/auth/me
 */
async function updateCurrentUser(req, res) {
  try {
    const { name, email } = req.body;
    const updateFields = {};

    if (name) updateFields.name = name;
    if (email) updateFields.email = email;

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      updateFields,
      { returnDocument: "after", runValidators: true }
    )
      .select(PUBLIC_USER_FIELDS)
      .populate({ path: "hotelId", select: "name code region timezone active" })
      .populate({ path: "hotelAccess", select: "name code region timezone active" })
      .populate({ path: "departmentId", select: "name code active hotelId" });

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(updatedUser);
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    if (error.code === 11000) {
      return res.status(400).json({ message: "Email already exists" });
    }

    res.status(500).json({ message: "Failed to update profile" });
  }
}

/**
 * Change current authenticated user's password
 * PATCH /api/auth/me/password
 */
async function updateCurrentUserPassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id).select("password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const passwordMatches = await bcrypt.compare(currentPassword, user.password);
    if (!passwordMatches) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.passwordChangedAt = new Date(Date.now() - 1000);
    await user.save();

    res.json({ message: "Password updated" });
  } catch (error) {
    res.status(500).json({ message: "Failed to update password" });
  }
}

/**
 * Get all users (public fields only)
 * GET /api/auth/users
 */
async function getAllUsers(req, res) {
  try {
    if (!MANAGER_ROLES.includes(req.user?.role)) {
      return res.status(403).json({ message: "User list access denied" });
    }

    const hotelScope = await buildHotelScopeQuery(req.user, req.query);
    if (req.query.role) hotelScope.role = req.query.role;
    if (req.query.departmentId) hotelScope.departmentId = req.query.departmentId;
    if (req.query.active !== undefined) hotelScope.active = String(req.query.active) === "true";
    const users = await User.find(hotelScope)
      .sort({ name: 1 })
      .select(PUBLIC_USER_FIELDS)
      .populate({ path: "hotelId", select: "name code region timezone active" })
      .populate({ path: "hotelAccess", select: "name code region timezone active" })
      .populate({ path: "departmentId", select: "name code active hotelId" });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Failed to load users" });
  }
}

/**
 * Create new user (Admin only)
 * POST /api/auth/users
 */
async function createUser(req, res) {
  try {
    const {
      name,
      email,
      password,
      role,
      team,
      hotelId,
      departmentId,
      hotelAccess = [],
      regions = [],
      active = true,
    } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "Name, email, and password are required" });
    }

    // Check if user already exists
    const resolvedHotelId = await resolveHotelId(req, hotelId);
    const existingUser = await User.findOne({ email, hotelId: resolvedHotelId });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // Hash password and create user
    const normalizedRole = normalizeAssignableRole(req.user, role);
    const normalizedHotelAccess = await normalizeHotelAccessIds(req, resolvedHotelId, hotelAccess, normalizedRole);
    const department = await resolveDepartment(departmentId, resolvedHotelId);
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: normalizedRole,
      team: department?.name || team || "Support",
      departmentId: department?._id || null,
      departmentName: department?.name || team || "Support",
      active: active !== false,
      hotelId: resolvedHotelId,
      hotelAccess: normalizedHotelAccess,
      regions: canManageHotels(req.user) ? regions : [],
    });

    auditLog("user.created", req, { userId: user._id, hotelId: resolvedHotelId, role: user.role });
    await user.populate([
      { path: "hotelId", select: "name code region timezone active" },
      { path: "hotelAccess", select: "name code region timezone active" },
      { path: "departmentId", select: "name code active hotelId" },
    ]);
    res.status(201).json(sanitizeUser(user));
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    res.status(500).json({ message: "Failed to create user" });
  }
}

/**
 * Update user (Admin only)
 * PATCH /api/auth/users/:id
 */
async function updateUser(req, res) {
  try {
    const { name, email, password, role, team, hotelId, departmentId, hotelAccess, regions, active } = req.body;
    const updateFields = {};

    // Build update fields
    if (name) updateFields.name = name;
    if (email) updateFields.email = email;
    if (role) updateFields.role = normalizeAssignableRole(req.user, role);
    if (team) updateFields.team = team;
    if (active !== undefined) updateFields.active = Boolean(active);
    if (password) updateFields.password = await bcrypt.hash(password, 10);
    if (hotelId) updateFields.hotelId = await resolveHotelId(req, hotelId);
    if (regions && canManageHotels(req.user)) updateFields.regions = regions;

    // Get target user
    const hotelScope = await buildHotelScopeQuery(req.user, req.query);
    const targetUser = await User.findOne({ _id: req.params.id, ...hotelScope });
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!canManageRole(req.user.role, targetUser.role)) {
      return res.status(403).json({ message: "You cannot edit a user with a higher role" });
    }

    if (updateFields.role && !canManageRole(req.user.role, updateFields.role)) {
      return res.status(403).json({ message: "You cannot assign a role higher than your own" });
    }

    if (departmentId) {
      const department = await resolveDepartment(departmentId, updateFields.hotelId || targetUser.hotelId);
      updateFields.departmentId = department._id;
      updateFields.departmentName = department.name;
      updateFields.team = department.name;
    }

    if (hotelAccess !== undefined || updateFields.hotelId || updateFields.role) {
      updateFields.hotelAccess = await normalizeHotelAccessIds(
        req,
        updateFields.hotelId || targetUser.hotelId,
        hotelAccess !== undefined ? hotelAccess : targetUser.hotelAccess,
        updateFields.role || targetUser.role
      );
    }

    // Prevent downgrading last admin
    if (
      GROUP_ROLES.includes(targetUser.role) &&
      updateFields.role &&
      !GROUP_ROLES.includes(updateFields.role)
    ) {
      const adminCount = await User.countDocuments({ role: { $in: GROUP_ROLES } });
      if (adminCount <= 1) {
        return res
          .status(400)
          .json({ message: "At least one admin is required" });
      }
    }

    // Update user
    const updatedUser = await User.findOneAndUpdate(
      { _id: req.params.id, ...hotelScope },
      updateFields,
      { returnDocument: "after", runValidators: true }
    )
      .select(PUBLIC_USER_FIELDS)
      .populate({ path: "hotelId", select: "name code region timezone active" })
      .populate({ path: "hotelAccess", select: "name code region timezone active" })
      .populate({ path: "departmentId", select: "name code active hotelId" });

    auditLog("user.updated", req, { userId: updatedUser?._id });
    res.json(updatedUser);
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    // Handle duplicate email error
    if (error.code === 11000) {
      return res.status(400).json({ message: "Email already exists" });
    }

    res.status(500).json({ message: "Failed to update user" });
  }
}

/**
 * Delete user (Admin only)
 * DELETE /api/auth/users/:id
 */
async function deleteUser(req, res) {
  try {
    // Prevent self-deletion
    if (req.params.id === req.user.id) {
      return res
        .status(400)
        .json({ message: "You cannot delete your own account" });
    }

    // Get target user
    const hotelScope = await buildHotelScopeQuery(req.user, req.query);
    const targetUser = await User.findOne({ _id: req.params.id, ...hotelScope });
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!canManageRole(req.user.role, targetUser.role)) {
      return res.status(403).json({ message: "You cannot delete a user with a higher role" });
    }

    // Prevent deletion of last admin
    if (GROUP_ROLES.includes(targetUser.role)) {
      const adminCount = await User.countDocuments({ role: { $in: GROUP_ROLES } });
      if (adminCount <= 1) {
        return res
          .status(400)
          .json({ message: "At least one admin is required" });
      }
    }

    // Delete user
    await User.findOneAndDelete({ _id: req.params.id, ...hotelScope });
    auditLog("user.deleted", req, { userId: req.params.id });
    res.json({ message: "User deleted" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete user" });
  }
}

module.exports = {
  register,
  login,
  getCurrentUser,
  updateCurrentUser,
  updateCurrentUserPassword,
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
};
