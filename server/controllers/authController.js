const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const User = require("../models/User");
const Hotel = require("../models/Hotel");
const Department = require("../models/Department");
const { sanitizeUser, normalizeRole } = require("../utils/userSanitizer");
const { GROUP_ROLES, PUBLIC_USER_FIELDS } = require("../constants");
const {
  buildHotelScopeQuery,
  canManageHotels,
  canManageTickets,
  getAllowedHotelIds,
  getUserHotelId,
} = require("../utils/tenantScope");
const { canManageRole } = require("../utils/roleHierarchy");
const auditLog = require("../utils/auditLogger");

const MULTI_HOTEL_ACCESS_ROLES = new Set(["GroupAdmin", "Admin", "RegionalManager", "HotelAdmin", "Manager"]);
const HOTEL_ADMIN_ASSIGNABLE_ROLES = new Set(["Manager", "Agent", "User"]);
const googleClient = new OAuth2Client();

function issueAuthToken(user) {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
      hotelId: user.hotelId,
      hotelAccess: user.hotelAccess || [],
    },
    process.env.JWT_SECRET,
    { expiresIn: "3d" }
  );
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function getGoogleAllowedEmailDomain() {
  return String(process.env.GOOGLE_ALLOWED_EMAIL_DOMAIN || "gmail.com")
    .trim()
    .toLowerCase();
}

function isAllowedGoogleEmail(email) {
  const domain = getGoogleAllowedEmailDomain();
  return Boolean(email && domain && email.endsWith(`@${domain}`));
}

function isGoogleAutoCreateEnabled() {
  return String(process.env.GOOGLE_AUTO_CREATE || "true").toLowerCase() !== "false";
}

async function verifyGoogleCredential(credential) {
  if (!process.env.GOOGLE_CLIENT_ID) {
    const error = new Error("Google login is not configured");
    error.statusCode = 503;
    throw error;
  }

  const ticket = await googleClient.verifyIdToken({
    idToken: credential,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  const payload = ticket.getPayload();
  if (!payload?.email || !payload.email_verified || !payload.sub) {
    const error = new Error("Google account email is not verified");
    error.statusCode = 401;
    throw error;
  }

  return {
    email: normalizeEmail(payload.email),
    name: payload.name || payload.email,
    sub: payload.sub,
  };
}

let verifyGoogleCredentialImpl = verifyGoogleCredential;

function setGoogleCredentialVerifier(verifier) {
  verifyGoogleCredentialImpl = verifier || verifyGoogleCredential;
}

function buildAuthResponse(user) {
  return {
    token: issueAuthToken(user),
    user: sanitizeUser(user),
    mustChangePassword: Boolean(user.mustChangePassword),
  };
}

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
  if (HOTEL_ADMIN_ASSIGNABLE_ROLES.has(normalized)) return normalized;

  const error = new Error("You cannot assign this role");
  error.statusCode = 403;
  throw error;
}

function canManageUserRecord(requester, targetRole) {
  if (canManageHotels(requester)) {
    return canManageRole(requester.role, targetRole);
  }

  return HOTEL_ADMIN_ASSIGNABLE_ROLES.has(targetRole) && canManageRole(requester.role, targetRole);
}

async function buildUserManagementScope(req) {
  const hotelScope = await buildHotelScopeQuery(req.user, req.query);
  const hasExplicitHotelFilter = Boolean(req.query.hotelId || req.query.hotelIds || req.query.region);

  if (!canManageHotels(req.user) || hasExplicitHotelFilter) return hotelScope;

  return {
    $or: [
      hotelScope,
      { hotelId: null },
      { hotelId: { $exists: false } },
    ],
  };
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
    const normalizedEmail = normalizeEmail(email);

    // Validate required fields
    if (!normalizedEmail || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // Find user and compare password
    const activeUserQuery = { email: normalizedEmail, active: { $ne: false } };
    if (hotelId) activeUserQuery.hotelId = hotelId;
    const matchingUsers = await User.find(activeUserQuery).sort({ createdAt: 1 });
    const user =
      matchingUsers.find((candidate) => GROUP_ROLES.includes(candidate.role)) ||
      matchingUsers[0];
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (!user.password) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    res.json(buildAuthResponse(user));
  } catch (error) {
    res.status(500).json({ message: "Login failed" });
  }
}

/**
 * Login with Google ID token
 * POST /api/auth/google
 */
async function googleLogin(req, res) {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ message: "Google credential is required" });
    }

    const googleUser = await verifyGoogleCredentialImpl(credential);
    if (!isAllowedGoogleEmail(googleUser.email)) {
      return res.status(403).json({ message: "Only Gmail accounts are allowed" });
    }

    const matchingUsers = await User.find({
      email: googleUser.email,
      active: { $ne: false },
    }).sort({ createdAt: 1 });
    let user =
      matchingUsers.find((candidate) => GROUP_ROLES.includes(candidate.role)) ||
      matchingUsers[0];

    if (!user) {
      if (!isGoogleAutoCreateEnabled()) {
        return res.status(403).json({ message: "Google self-registration is disabled" });
      }

      user = await User.create({
        name: googleUser.name,
        email: googleUser.email,
        authProvider: "google",
        googleSub: googleUser.sub,
        role: "User",
        team: "",
        departmentName: "",
        active: true,
        hotelId: null,
        hotelAccess: [],
      });
      auditLog("user.google_created", req, { userId: user._id, email: user.email });
    } else if (!user.googleSub || user.authProvider !== "google") {
      user.authProvider = user.authProvider || "password";
      user.googleSub = user.googleSub || googleUser.sub;
      await user.save();
    }

    res.json(buildAuthResponse(user));
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    res.status(401).json({ message: "Google login failed" });
  }
}

/**
 * Get current authenticated user
 * GET /api/auth/me
 */
async function getCurrentUser(req, res) {
  try {
    const user = await User.findById(req.user.id).select("-password -googleSub").populate({
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
    const user = await User.findById(req.user.id).select("password mustChangePassword");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.mustChangePassword) {
      if (!currentPassword) {
        return res.status(400).json({ message: "Current password is required" });
      }

      const passwordMatches = await bcrypt.compare(currentPassword, user.password);
      if (!passwordMatches) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.passwordChangedAt = new Date(Date.now() - 1000);
    user.mustChangePassword = false;
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
    if (!canManageTickets(req.user)) {
      return res.status(403).json({ message: "User list access denied" });
    }

    const hotelScope = await buildUserManagementScope(req);
    const query = { ...hotelScope };
    if (req.query.role) query.role = req.query.role;
    if (req.query.departmentId) query.departmentId = req.query.departmentId;
    if (req.query.active !== undefined) query.active = String(req.query.active) === "true";
    const users = await User.find(query)
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
      mustChangePassword: true,
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
    if (password) {
      updateFields.password = await bcrypt.hash(password, 10);
      updateFields.passwordChangedAt = new Date(Date.now() - 1000);
      updateFields.mustChangePassword = true;
    }
    if (hotelId) updateFields.hotelId = await resolveHotelId(req, hotelId);
    if (regions && canManageHotels(req.user)) updateFields.regions = regions;

    // Get target user
    const hotelScope = await buildUserManagementScope(req);
    const targetUser = await User.findOne({ _id: req.params.id, ...hotelScope });
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!canManageUserRecord(req.user, targetUser.role)) {
      return res.status(403).json({ message: "You cannot edit a user with this role" });
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

    auditLog("user.updated", req, { userId: updatedUser?._id, hotelId: updatedUser?.hotelId });
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
    const hotelScope = await buildUserManagementScope(req);
    const targetUser = await User.findOne({ _id: req.params.id, ...hotelScope });
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!canManageUserRecord(req.user, targetUser.role)) {
      return res.status(403).json({ message: "You cannot delete a user with this role" });
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
    auditLog("user.deleted", req, { userId: req.params.id, hotelId: targetUser.hotelId });
    res.json({ message: "User deleted" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete user" });
  }
}

module.exports = {
  register,
  login,
  googleLogin,
  getCurrentUser,
  updateCurrentUser,
  updateCurrentUserPassword,
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  _private: {
    buildUserManagementScope,
    isAllowedGoogleEmail,
    setGoogleCredentialVerifier,
    verifyGoogleCredential,
  },
};
