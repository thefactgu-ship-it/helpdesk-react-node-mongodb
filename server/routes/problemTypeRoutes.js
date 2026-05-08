const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");
const mongoIdValidator = require("../middleware/mongoIdValidator");
const asyncHandler = require("../utils/asyncHandler");
const problemTypeController = require("../controllers/problemTypeController");
const {
  createProblemTypeValidationRules,
  handleValidationErrors,
} = require("../validators/problemTypeValidator");

const router = express.Router();

router.get("/", authMiddleware, asyncHandler(problemTypeController.getProblemTypes));

router.post(
  "/",
  authMiddleware,
  adminMiddleware,
  createProblemTypeValidationRules(),
  handleValidationErrors,
  asyncHandler(problemTypeController.createProblemType)
);

router.delete(
  "/:id",
  authMiddleware,
  adminMiddleware,
  mongoIdValidator,
  asyncHandler(problemTypeController.deleteProblemType)
);

module.exports = router;
