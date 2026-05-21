const mongoose = require("mongoose");
const AuditLog = require("../models/AuditLog");

function auditLog(action, req, details = {}) {
  const payload = {
    action,
    actorId: normalizeObjectId(req.user?.id || req.user?._id),
    actorRole: req.user?.role,
    hotelId: normalizeObjectId(details.hotelId || req.user?.hotelId),
    requestId: req.id,
    method: req.method,
    path: req.originalUrl,
    ip: req.ip,
    userAgent: req.get?.("user-agent") || "",
    targetType: inferTargetType(action, details),
    targetId: inferTargetId(details),
    details,
  };

  console.info("[AUDIT]", JSON.stringify({ ...payload, createdAt: new Date().toISOString() }));

  if (mongoose.connection.readyState !== 1) return;

  AuditLog.create(payload).catch((error) => {
    console.error("[AUDIT_WRITE_FAILED]", error.message);
  });
}

function normalizeObjectId(value) {
  const normalized = String(value?._id || value || "");
  return mongoose.Types.ObjectId.isValid(normalized) ? normalized : null;
}

function inferTargetType(action, details) {
  if (details.targetType) return String(details.targetType);
  const prefix = String(action || "").split(".")[0];
  return prefix || "";
}

function inferTargetId(details = {}) {
  const value =
    details.targetId ||
    details.ticketId ||
    details.userId ||
    details.hotelId ||
    details.departmentId ||
    details.assetId ||
    details.problemTypeId;
  return value ? String(value) : "";
}

module.exports = auditLog;
