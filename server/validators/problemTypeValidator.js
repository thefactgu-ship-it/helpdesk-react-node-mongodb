const { body, validationResult } = require("express-validator");
const mongoose = require("mongoose");

const createProblemTypeValidationRules = () => [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Problem type name is required")
    .isLength({ min: 2, max: 80 })
    .withMessage("Problem type name must be between 2 and 80 characters"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description must not exceed 500 characters"),
  body("hotelId")
    .optional()
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage("Invalid hotel ID"),
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
  createProblemTypeValidationRules,
  handleValidationErrors,
};
