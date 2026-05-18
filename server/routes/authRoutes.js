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

function publicRegistrationGuard(req, res, next) {
  const flag = String(process.env.ALLOW_PUBLIC_REGISTRATION || "").toLowerCase();
  const publicRegistrationAllowed = flag === "true";
  const publicRegistrationDisabled = flag === "false";
  const localDevelopment =
    !process.env.NODE_ENV ||
    process.env.NODE_ENV === "development" ||
    process.env.NODE_ENV === "test";

  if (publicRegistrationDisabled) {
    return res.status(403).json({
      message: "Public registration is disabled. Please contact an administrator to create an account.",
    });
  }

  if (publicRegistrationAllowed || localDevelopment) {
    return next();
  }

  return res.status(403).json({
    message: "Public registration is disabled. Please contact an administrator to create an account.",
  });
}

// Public auth routes with validation
router.post(
  "/register",
  publicRegistrationGuard,
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
