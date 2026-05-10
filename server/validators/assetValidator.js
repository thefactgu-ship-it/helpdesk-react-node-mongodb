const { body, validationResult } = require("express-validator");

const assetStatuses = ["Active", "In Repair", "Spare", "Retired"];
const assetConditions = ["Good", "Monitor", "Needs Repair", "End of Life"];

const createAssetValidationRules = () => [
  body("assetName")
    .trim()
    .notEmpty()
    .withMessage("Asset name is required")
    .isLength({ max: 120 })
    .withMessage("Asset name must not exceed 120 characters"),
  body("assetType")
    .trim()
    .notEmpty()
    .withMessage("Asset type is required")
    .isLength({ max: 80 })
    .withMessage("Asset type must not exceed 80 characters"),
  body("serialNumber")
    .trim()
    .notEmpty()
    .withMessage("Serial number is required")
    .isLength({ max: 120 })
    .withMessage("Serial number must not exceed 120 characters"),
  ...optionalAssetRules(),
];

const updateAssetValidationRules = () => [
  body("assetName")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Asset name cannot be empty")
    .isLength({ max: 120 })
    .withMessage("Asset name must not exceed 120 characters"),
  body("assetType")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Asset type cannot be empty")
    .isLength({ max: 80 })
    .withMessage("Asset type must not exceed 80 characters"),
  body("serialNumber")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Serial number cannot be empty")
    .isLength({ max: 120 })
    .withMessage("Serial number must not exceed 120 characters"),
  ...optionalAssetRules(),
];

function optionalAssetRules() {
  return [
    body("owner")
      .optional()
      .trim()
      .isLength({ max: 120 })
      .withMessage("Owner must not exceed 120 characters"),
    body("department")
      .optional()
      .trim()
      .isLength({ max: 80 })
      .withMessage("Department must not exceed 80 characters"),
    body("status")
      .optional()
      .isIn(assetStatuses)
      .withMessage("Invalid asset status"),
    body("lifeCycle.purchaseDate")
      .optional({ values: "falsy" })
      .isISO8601()
      .withMessage("Purchase date must be a valid date"),
    body("lifeCycle.expectedLifeMonths")
      .optional()
      .isInt({ min: 1, max: 240 })
      .withMessage("Expected life must be between 1 and 240 months"),
    body("lifeCycle.condition")
      .optional()
      .isIn(assetConditions)
      .withMessage("Invalid asset condition"),
    body("lifeCycle.notes")
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage("Life cycle notes must not exceed 1000 characters"),
  ];
}

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
  createAssetValidationRules,
  handleValidationErrors,
  updateAssetValidationRules,
};
