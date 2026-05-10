const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");
const authController = require("../controllers/authController");
const asyncHandler = require("../utils/asyncHandler");
const {
  registerValidationRules,
  loginValidationRules,
  createUserValidationRules,
  updateUserValidationRules,
  updateCurrentUserValidationRules,
  updateCurrentUserPasswordValidationRules,
  handleValidationErrors,
} = require("../validators/authValidator");

const router = express.Router();

// Public auth routes with validation
router.post(
  "/register",
  registerValidationRules(),
  handleValidationErrors,
  asyncHandler(authController.register)
);
router.post(
  "/login",
  loginValidationRules(),
  handleValidationErrors,
  asyncHandler(authController.login)
);

// Protected auth routes
router.get("/me", authMiddleware, asyncHandler(authController.getCurrentUser));
router.patch(
  "/me",
  authMiddleware,
  updateCurrentUserValidationRules(),
  handleValidationErrors,
  asyncHandler(authController.updateCurrentUser)
);
router.patch(
  "/me/password",
  authMiddleware,
  updateCurrentUserPasswordValidationRules(),
  handleValidationErrors,
  asyncHandler(authController.updateCurrentUserPassword)
);
router.get("/users", authMiddleware, asyncHandler(authController.getAllUsers));

// Admin only routes with validation
router.post(
  "/users",
  authMiddleware,
  adminMiddleware,
  createUserValidationRules(),
  handleValidationErrors,
  asyncHandler(authController.createUser)
);
router.patch(
  "/users/:id",
  authMiddleware,
  adminMiddleware,
  updateUserValidationRules(),
  handleValidationErrors,
  asyncHandler(authController.updateUser)
);
router.delete(
  "/users/:id",
  authMiddleware,
  adminMiddleware,
  asyncHandler(authController.deleteUser)
);

module.exports = router;
