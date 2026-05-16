const { body, validationResult } = require("express-validator");
const mongoose = require("mongoose");

const createDepartmentValidationRules = () => [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Department name is required")
    .isLength({ min: 2, max: 80 })
    .withMessage("Department name must be between 2 and 80 characters"),
  body("code")
    .trim()
    .notEmpty()
    .withMessage("Department code is required")
    .isLength({ min: 2, max: 20 })
    .withMessage("Department code must be between 2 and 20 characters"),
  body("hotelId")
    .optional()
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage("Invalid hotel ID"),
  body("active")
    .optional()
    .isBoolean()
    .withMessage("Active must be true or false"),
  body("sortOrder")
    .optional()
    .isInt({ min: 0, max: 9999 })
    .withMessage("Sort order must be a number between 0 and 9999"),
];

const updateDepartmentValidationRules = () => [
  body("name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Department name cannot be empty")
    .isLength({ min: 2, max: 80 })
    .withMessage("Department name must be between 2 and 80 characters"),
  body("code")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Department code cannot be empty")
    .isLength({ min: 2, max: 20 })
    .withMessage("Department code must be between 2 and 20 characters"),
  body("active")
    .optional()
    .isBoolean()
    .withMessage("Active must be true or false"),
  body("sortOrder")
    .optional()
    .isInt({ min: 0, max: 9999 })
    .withMessage("Sort order must be a number between 0 and 9999"),
];

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: "Validation error",
      errors: errors.array().map((err) => ({
        field: err.path,
        message: err.msg,
      })),
    });
  }
  next();
};

module.exports = {
  createDepartmentValidationRules,
  handleValidationErrors,
  updateDepartmentValidationRules,
};
