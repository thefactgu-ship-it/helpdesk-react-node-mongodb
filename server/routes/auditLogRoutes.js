const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const asyncHandler = require("../utils/asyncHandler");
const auditLogController = require("../controllers/auditLogController");

const router = express.Router();

router.get("/", authMiddleware, asyncHandler(auditLogController.getAuditLogs));

module.exports = router;
