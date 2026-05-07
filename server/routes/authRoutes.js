const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

const publicUserFields = "name email role team createdAt updatedAt";

function normalizeRole(role) {
  if (!role) return "User";
  const allowedRoles = ["Admin", "Manager", "Agent", "User"];
  return allowedRoles.includes(role) ? role : "User";
}

function sanitizeUser(user) {
  return {
    id: user._id,
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    team: user.team,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

async function adminMiddleware(req, res, next) {
  try {
    const user = await User.findById(req.user.id).select("role");

    if (!user || user.role !== "Admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    next();
  } catch (error) {
    res.status(500).json({ message: "Failed to verify admin access" });
  }
}

router.post("/register", async (req, res) => {
  try {
    const { name, email, password, team } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

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
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

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
});

router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Failed to load user" });
  }
});

router.get("/users", authMiddleware, async (req, res) => {
  try {
    const users = await User.find().sort({ name: 1 }).select(publicUserFields);
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Failed to load users" });
  }
});

router.post("/users", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { name, email, password, role, team } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

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
});

router.patch("/users/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { name, email, password, role, team } = req.body;
    const updateFields = {};

    if (name) updateFields.name = name;
    if (email) updateFields.email = email;
    if (role) updateFields.role = normalizeRole(role);
    if (team) updateFields.team = team;
    if (password) updateFields.password = await bcrypt.hash(password, 10);

    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    if (
      targetUser.role === "Admin" &&
      updateFields.role &&
      updateFields.role !== "Admin"
    ) {
      const adminCount = await User.countDocuments({ role: "Admin" });
      if (adminCount <= 1) {
        return res.status(400).json({ message: "At least one admin is required" });
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true, runValidators: true },
    ).select(publicUserFields);

    res.json(updatedUser);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Email already exists" });
    }

    res.status(500).json({ message: "Failed to update user" });
  }
});

router.delete("/users/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ message: "You cannot delete your own account" });
    }

    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    if (targetUser.role === "Admin") {
      const adminCount = await User.countDocuments({ role: "Admin" });
      if (adminCount <= 1) {
        return res.status(400).json({ message: "At least one admin is required" });
      }
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User deleted" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete user" });
  }
});

module.exports = router;
