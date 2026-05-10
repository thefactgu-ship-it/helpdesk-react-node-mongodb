const { body, validationResult } = require("express-validator");

/**
 * Validation rules for user registration
 */
const registerValidationRules = () => [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters"),
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Email must be valid")
    .normalizeEmail(),
  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
  body("team")
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage("Team must be between 1 and 50 characters"),
];

/**
 * Validation rules for user login
 */
const loginValidationRules = () => [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Email must be valid")
    .normalizeEmail(),
  body("password")
    .notEmpty()
    .withMessage("Password is required"),
];

/**
 * Validation rules for creating a user (admin only)
 */
const createUserValidationRules = () => [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters"),
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Email must be valid")
    .normalizeEmail(),
  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
  body("role")
    .optional()
    .isIn(["Admin", "Manager", "Agent", "User"])
    .withMessage("Invalid role"),
  body("team")
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage("Team must be between 1 and 50 characters"),
];

/**
 * Validation rules for updating a user (admin only)
 */
const updateUserValidationRules = () => [
  body("name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Name cannot be empty")
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters"),
  body("email")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Email cannot be empty")
    .isEmail()
    .withMessage("Email must be valid")
    .normalizeEmail(),
  body("password")
    .optional()
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
  body("role")
    .optional()
    .isIn(["Admin", "Manager", "Agent", "User"])
    .withMessage("Invalid role"),
  body("team")
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage("Team must be between 1 and 50 characters"),
];

/**
 * Validation rules for updating the current user's profile
 */
const updateCurrentUserValidationRules = () => [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters"),
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Email must be valid")
    .normalizeEmail(),
  body("team")
    .trim()
    .notEmpty()
    .withMessage("Team is required")
    .isLength({ min: 1, max: 50 })
    .withMessage("Team must be between 1 and 50 characters"),
  body("role")
    .not()
    .exists()
    .withMessage("Role cannot be updated from profile"),
  body("password")
    .not()
    .exists()
    .withMessage("Password must be updated from the password form"),
];

/**
 * Validation rules for updating the current user's password
 */
const updateCurrentUserPasswordValidationRules = () => [
  body("currentPassword")
    .notEmpty()
    .withMessage("Current password is required"),
  body("newPassword")
    .notEmpty()
    .withMessage("New password is required")
    .isLength({ min: 6 })
    .withMessage("New password must be at least 6 characters"),
];

/**
 * Middleware to handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: "Validation error",
      errors: errors.array().map((err) => ({
        field: err.param,
        message: err.msg,
      })),
    });
  }
  next();
};

module.exports = {
  registerValidationRules,
  loginValidationRules,
  createUserValidationRules,
  updateUserValidationRules,
  updateCurrentUserValidationRules,
  updateCurrentUserPasswordValidationRules,
  handleValidationErrors,
};
