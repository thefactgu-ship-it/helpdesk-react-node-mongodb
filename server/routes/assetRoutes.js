const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const { requirePermission } = require("../middleware/permissionMiddleware");
const mongoIdValidator = require("../middleware/mongoIdValidator");
const asyncHandler = require("../utils/asyncHandler");
const assetController = require("../controllers/assetController");
const {
  createAssetValidationRules,
  handleValidationErrors,
  updateAssetValidationRules,
} = require("../validators/assetValidator");

const router = express.Router();
const requireHotelSettings = requirePermission(
  "canManageHotelSettings",
  "Hotel settings access required"
);

router.get(
  "/",
  authMiddleware,
  requireHotelSettings,
  asyncHandler(assetController.getAllAssets)
);

router.post(
  "/",
  authMiddleware,
  requireHotelSettings,
  createAssetValidationRules(),
  handleValidationErrors,
  asyncHandler(assetController.createAsset)
);

router.patch(
  "/:id",
  authMiddleware,
  requireHotelSettings,
  mongoIdValidator,
  updateAssetValidationRules(),
  handleValidationErrors,
  asyncHandler(assetController.updateAsset)
);

router.delete(
  "/:id",
  authMiddleware,
  requireHotelSettings,
  mongoIdValidator,
  asyncHandler(assetController.deleteAsset)
);

module.exports = router;
