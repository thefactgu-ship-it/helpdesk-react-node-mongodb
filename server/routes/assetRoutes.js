const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");
const mongoIdValidator = require("../middleware/mongoIdValidator");
const asyncHandler = require("../utils/asyncHandler");
const assetController = require("../controllers/assetController");
const {
  createAssetValidationRules,
  handleValidationErrors,
  updateAssetValidationRules,
} = require("../validators/assetValidator");

const router = express.Router();

router.get("/", authMiddleware, asyncHandler(assetController.getAllAssets));

router.post(
  "/",
  authMiddleware,
  adminMiddleware,
  createAssetValidationRules(),
  handleValidationErrors,
  asyncHandler(assetController.createAsset)
);

router.patch(
  "/:id",
  authMiddleware,
  adminMiddleware,
  mongoIdValidator,
  updateAssetValidationRules(),
  handleValidationErrors,
  asyncHandler(assetController.updateAsset)
);

router.delete(
  "/:id",
  authMiddleware,
  adminMiddleware,
  mongoIdValidator,
  asyncHandler(assetController.deleteAsset)
);

module.exports = router;
