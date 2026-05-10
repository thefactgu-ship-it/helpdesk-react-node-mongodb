const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { sanitizeUser, normalizeRole } = require("../utils/userSanitizer");
const { PUBLIC_USER_FIELDS } = require("../constants");

/**
 * Register new user
 * POST /api/auth/register
 */
async function register(req, res) {
  try {
    const { name, email, password, team } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "Name, email, and password are required" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // Hash password and create user
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "User",
      team: team || "Support",
    });

    res.status(201).json({
      message: "User registered",
      user: sanitizeUser(user),
    });
  } catch (error) {
    res.status(500).json({ message: "Register failed" });
  }
}

/**
 * Login user
 * POST /api/auth/login
 */
async function login(req, res) {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // Find user and compare password
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email },
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
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Failed to load user" });
  }
}

/**
 * Get all users (public fields only)
 * GET /api/auth/users
 */
async function getAllUsers(req, res) {
  try {
    const users = await User.find().sort({ name: 1 }).select(PUBLIC_USER_FIELDS);
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
    const { name, email, password, role, team } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "Name, email, and password are required" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // Hash password and create user
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: normalizeRole(role),
      team: team || "Support",
    });

    res.status(201).json(sanitizeUser(user));
  } catch (error) {
    res.status(500).json({ message: "Failed to create user" });
  }
}

/**
 * Update user (Admin only)
 * PATCH /api/auth/users/:id
 */
async function updateUser(req, res) {
  try {
    const { name, email, password, role, team } = req.body;
    const updateFields = {};

    // Build update fields
    if (name) updateFields.name = name;
    if (email) updateFields.email = email;
    if (role) updateFields.role = normalizeRole(role);
    if (team) updateFields.team = team;
    if (password) updateFields.password = await bcrypt.hash(password, 10);

    // Get target user
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Prevent downgrading last admin
    if (
      targetUser.role === "Admin" &&
      updateFields.role &&
      updateFields.role !== "Admin"
    ) {
      const adminCount = await User.countDocuments({ role: "Admin" });
      if (adminCount <= 1) {
        return res
          .status(400)
          .json({ message: "At least one admin is required" });
      }
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true, runValidators: true }
    ).select(PUBLIC_USER_FIELDS);

    res.json(updatedUser);
  } catch (error) {
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
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Prevent deletion of last admin
    if (targetUser.role === "Admin") {
      const adminCount = await User.countDocuments({ role: "Admin" });
      if (adminCount <= 1) {
        return res
          .status(400)
          .json({ message: "At least one admin is required" });
      }
    }

    // Delete user
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User deleted" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete user" });
  }
}

module.exports = {
  register,
  login,
  getCurrentUser,
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
};
