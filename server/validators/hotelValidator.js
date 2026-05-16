const { body, validationResult } = require("express-validator");

const createHotelValidationRules = () => [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Hotel name is required")
    .isLength({ min: 2, max: 120 })
    .withMessage("Hotel name must be between 2 and 120 characters"),
  body("code")
    .trim()
    .notEmpty()
    .withMessage("Hotel code is required")
    .isLength({ min: 2, max: 20 })
    .withMessage("Hotel code must be between 2 and 20 characters"),
  body("region")
    .optional()
    .trim()
    .isLength({ max: 80 })
    .withMessage("Region must not exceed 80 characters"),
  body("timezone")
    .optional()
    .trim()
    .isLength({ max: 80 })
    .withMessage("Timezone must not exceed 80 characters"),
  body("active")
    .optional()
    .isBoolean()
    .withMessage("Active must be true or false"),
];

const updateHotelValidationRules = () => [
  body("name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Hotel name cannot be empty")
    .isLength({ min: 2, max: 120 })
    .withMessage("Hotel name must be between 2 and 120 characters"),
  body("code")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Hotel code cannot be empty")
    .isLength({ min: 2, max: 20 })
    .withMessage("Hotel code must be between 2 and 20 characters"),
  body("region")
    .optional()
    .trim()
    .isLength({ max: 80 })
    .withMessage("Region must not exceed 80 characters"),
  body("timezone")
    .optional()
    .trim()
    .isLength({ max: 80 })
    .withMessage("Timezone must not exceed 80 characters"),
  body("active")
    .optional()
    .isBoolean()
    .withMessage("Active must be true or false"),
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
  handleValidationErrors,
  createHotelValidationRules,
  updateHotelValidationRules,
};
