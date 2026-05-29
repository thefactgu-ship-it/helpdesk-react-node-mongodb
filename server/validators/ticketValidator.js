const { body, param, validationResult } = require("express-validator");
const mongoose = require("mongoose");

/**
 * Validation rules for creating a ticket
 */
const createTicketValidationRules = () => [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Ticket title is required")
    .isLength({ min: 5, max: 200 })
    .withMessage("Title must be between 5 and 200 characters"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 5000 })
    .withMessage("Description must not exceed 5000 characters"),
  body("requester")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Requester must be between 2 and 100 characters"),
  body("requesterUserId")
    .optional({ checkFalsy: true })
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage("Invalid requester user ID"),
  body("category")
    .trim()
    .notEmpty()
    .withMessage("Issue category is required")
    .isLength({ min: 1, max: 50 })
    .withMessage("Category must be between 1 and 50 characters"),
  body("department")
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage("Department must be between 1 and 50 characters"),
  body("departmentId")
    .optional({ checkFalsy: true })
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage("Invalid department ID"),
  body("priority")
    .optional()
    .isIn(["low", "medium", "high", "critical"])
    .withMessage("Invalid priority level"),
  body("visibility")
    .optional()
    .isIn(["normal", "private"])
    .withMessage("Invalid ticket visibility"),
  body("criticalRequested")
    .optional()
    .isBoolean()
    .withMessage("criticalRequested must be a boolean")
    .toBoolean(),
  body("dueDate")
    .optional()
    .isISO8601()
    .withMessage("Due date must be a valid date"),
  body("assignedTo")
    .optional()
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage("Invalid assigned user ID"),
  body("hotelId")
    .optional()
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage("Invalid hotel ID"),
];

/**
 * Validation rules for updating a ticket
 */
const updateTicketValidationRules = () => [
  body("title")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Title cannot be empty")
    .isLength({ min: 5, max: 200 })
    .withMessage("Title must be between 5 and 200 characters"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 5000 })
    .withMessage("Description must not exceed 5000 characters"),
  body("requester")
    .optional({ checkFalsy: true })
    .trim()
    .notEmpty()
    .withMessage("Requester cannot be empty")
    .isLength({ min: 2, max: 100 })
    .withMessage("Requester must be between 2 and 100 characters"),
  body("requesterUserId")
    .optional({ checkFalsy: true })
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage("Invalid requester user ID"),
  body("category")
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage("Category must be between 1 and 50 characters"),
  body("department")
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage("Department must be between 1 and 50 characters"),
  body("departmentId")
    .optional({ checkFalsy: true })
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage("Invalid department ID"),
  body("priority")
    .optional()
    .isIn(["low", "medium", "high", "critical"])
    .withMessage("Invalid priority level"),
  body("visibility")
    .optional()
    .isIn(["normal", "private"])
    .withMessage("Invalid ticket visibility"),
  body("criticalRequested")
    .optional()
    .isBoolean()
    .withMessage("criticalRequested must be a boolean")
    .toBoolean(),
  body("status")
    .optional()
    .isIn(["open", "in_progress", "resolved", "closed"])
    .withMessage("Invalid status"),
  body("adminCloseReason")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage("Admin close reason must be between 1 and 500 characters"),
  body("dueDate")
    .optional()
    .isISO8601()
    .withMessage("Due date must be a valid date"),
  body("assignedTo")
    .optional()
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage("Invalid assigned user ID"),
];

/**
 * Validation rules for updating ticket status only
 */
const updateStatusValidationRules = () => [
  body("status")
    .notEmpty()
    .withMessage("Status is required")
    .isIn(["open", "in_progress", "resolved", "closed"])
    .withMessage("Invalid status"),
  body("adminCloseReason")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage("Admin close reason must be between 1 and 500 characters"),
];

/**
 * Validation rules for assigning ticket
 */
const assignTicketValidationRules = () => [
  body("assignedTo")
    .notEmpty()
    .withMessage("Assigned user is required")
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage("Invalid assigned user ID"),
];

/**
 * Validation rules for adding comment
 */
const addCommentValidationRules = () => [
  body("text")
    .trim()
    .notEmpty()
    .withMessage("Comment text is required")
    .isLength({ min: 1, max: 2000 })
    .withMessage("Comment must be between 1 and 2000 characters"),
];

/**
 * Validation rules for submitting requester satisfaction
 */
const submitSatisfactionValidationRules = () => [
  body("score")
    .isInt({ min: 1, max: 5 })
    .withMessage("Satisfaction score must be between 1 and 5"),
  body("comment")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Satisfaction comment must not exceed 1000 characters"),
];

/**
 * Validation rule for MongoDB ObjectId in URL parameters
 */
const validateObjectId = (fieldName = "id") =>
  param(fieldName)
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage(`Invalid ${fieldName}`);

/**
 * Middleware to handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: "Validation error",
      errors: errors.array().map((err) => ({
        field: err.path || err.param,
        message: err.msg,
      })),
    });
  }
  next();
};

module.exports = {
  createTicketValidationRules,
  updateTicketValidationRules,
  updateStatusValidationRules,
  assignTicketValidationRules,
  addCommentValidationRules,
  submitSatisfactionValidationRules,
  validateObjectId,
  handleValidationErrors,
};
