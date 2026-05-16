const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const mongoIdValidator = require("../middleware/mongoIdValidator");
const asyncHandler = require("../utils/asyncHandler");
const departmentController = require("../controllers/departmentController");
const {
  createDepartmentValidationRules,
  handleValidationErrors,
  updateDepartmentValidationRules,
} = require("../validators/departmentValidator");

const router = express.Router();

router.get("/", authMiddleware, asyncHandler(departmentController.getDepartments));
router.post(
  "/",
  authMiddleware,
  createDepartmentValidationRules(),
  handleValidationErrors,
  asyncHandler(departmentController.createDepartment)
);
router.patch(
  "/:id",
  authMiddleware,
  mongoIdValidator,
  updateDepartmentValidationRules(),
  handleValidationErrors,
  asyncHandler(departmentController.updateDepartment)
);
router.delete(
  "/:id",
  authMiddleware,
  mongoIdValidator,
  asyncHandler(departmentController.deleteDepartment)
);

module.exports = router;
