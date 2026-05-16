function auditLog(action, req, details = {}) {
  const payload = {
    action,
    actorId: req.user?.id,
    actorRole: req.user?.role,
    hotelId: req.user?.hotelId,
    requestId: req.id,
    method: req.method,
    path: req.originalUrl,
    details,
    createdAt: new Date().toISOString(),
  };

  console.info("[AUDIT]", JSON.stringify(payload));
}

module.exports = auditLog;
