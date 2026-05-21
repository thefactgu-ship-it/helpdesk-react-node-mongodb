const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const { requirePermission } = require("../middleware/permissionMiddleware");
const mongoIdValidator = require("../middleware/mongoIdValidator");
const asyncHandler = require("../utils/asyncHandler");
const problemTypeController = require("../controllers/problemTypeController");
const {
  createProblemTypeValidationRules,
  handleValidationErrors,
} = require("../validators/problemTypeValidator");

const router = express.Router();
const requireHotelSettings = requirePermission(
  "canManageHotelSettings",
  "Hotel settings access required"
);

router.get("/", authMiddleware, asyncHandler(problemTypeController.getProblemTypes));

router.post(
  "/",
  authMiddleware,
  requireHotelSettings,
  createProblemTypeValidationRules(),
  handleValidationErrors,
  asyncHandler(problemTypeController.createProblemType)
);

router.delete(
  "/:id",
  authMiddleware,
  requireHotelSettings,
  mongoIdValidator,
  asyncHandler(problemTypeController.deleteProblemType)
);

module.exports = router;
