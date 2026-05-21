const AuditLog = require("../models/AuditLog");
const { sendError } = require("../utils/errorHandler");
const {
  buildHotelScopeQuery,
  canManageHotelSettings,
  canManageHotels,
} = require("../utils/tenantScope");

const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 25;

async function getAuditLogs(req, res) {
  try {
    if (!canManageHotelSettings(req.user)) {
      return res.status(403).json({ message: "Audit log access denied" });
    }

    const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(
      Math.max(Number.parseInt(req.query.limit, 10) || DEFAULT_LIMIT, 1),
      MAX_LIMIT
    );
    const skip = (page - 1) * limit;
    const query = await buildAuditLogQuery(req);

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate({ path: "actorId", select: "name email role" })
        .populate({ path: "hotelId", select: "name code region active" }),
      AuditLog.countDocuments(query),
    ]);

    res.json({
      data: logs,
      meta: {
        limit,
        page,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (error) {
    sendError(res, 500, "Failed to fetch audit logs", error);
  }
}

async function buildAuditLogQuery(req) {
  const query = {};

  if (!canManageHotels(req.user) || req.query.hotelId || req.query.hotelIds) {
    const hotelScope = await buildHotelScopeQuery(req.user, req.query);
    query.hotelId = hotelScope.hotelId;
  }

  if (req.query.action) query.action = req.query.action;
  if (req.query.actorRole) query.actorRole = req.query.actorRole;
  if (req.query.actorId) query.actorId = req.query.actorId;
  if (req.query.targetType) query.targetType = req.query.targetType;
  if (req.query.targetId) query.targetId = String(req.query.targetId);

  const createdAt = {};
  if (req.query.from) createdAt.$gte = new Date(req.query.from);
  if (req.query.to) createdAt.$lte = new Date(req.query.to);
  if (Object.keys(createdAt).length) query.createdAt = createdAt;

  if (req.query.q) {
    const pattern = new RegExp(escapeRegExp(String(req.query.q).trim()), "i");
    query.$or = [
      { action: pattern },
      { actorRole: pattern },
      { targetType: pattern },
      { targetId: pattern },
      { path: pattern },
    ];
  }

  return query;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

module.exports = {
  getAuditLogs,
  _private: {
    buildAuditLogQuery,
  },
};
