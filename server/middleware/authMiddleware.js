const jwt = require("jsonwebtoken");
const User = require("../models/User");

/**
 * Middleware to verify JWT token from Authorization header
 * Expected format: Bearer <token>
 */
const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // Check if authorization header exists and has Bearer scheme
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "No token provided",
      });
    }

    // Extract token from Bearer scheme
    const token = authHeader.split(" ")[1];

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("email role team passwordChangedAt");

    if (!user) {
      return res.status(401).json({
        message: "User not found",
      });
    }

    if (user.passwordChangedAt && decoded.iat) {
      const tokenIssuedAt = decoded.iat * 1000;
      if (tokenIssuedAt < user.passwordChangedAt.getTime()) {
        return res.status(401).json({
          message: "Password changed. Please log in again",
        });
      }
    }

    req.user = {
      ...decoded,
      role: user.role,
      team: user.team,
    };

    next();
  } catch (error) {
    // Handle specific JWT errors
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        message: "Token expired",
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        message: "Invalid token",
      });
    }

    return res.status(401).json({
      message: "Authentication failed",
    });
  }
};

module.exports = authMiddleware;
