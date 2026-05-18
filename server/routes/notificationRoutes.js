const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const mongoIdValidator = require("../middleware/mongoIdValidator");
const notificationController = require("../controllers/notificationController");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

router.get(
  "/",
  authMiddleware,
  asyncHandler(notificationController.getNotifications)
);

router.patch(
  "/read-all",
  authMiddleware,
  asyncHandler(notificationController.markAllNotificationsRead)
);

router.patch(
  "/:id/read",
  authMiddleware,
  mongoIdValidator,
  asyncHandler(notificationController.markNotificationRead)
);

module.exports = router;
