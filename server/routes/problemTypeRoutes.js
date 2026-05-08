const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");
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

module.exports = router;
