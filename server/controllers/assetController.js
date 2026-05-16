const Asset = require("../models/Asset");
const { sendError } = require("../utils/errorHandler");
const { buildHotelScopeQuery, getUserHotelId } = require("../utils/tenantScope");
const auditLog = require("../utils/auditLogger");

const ASSET_POPULATE_CONFIG = [
  { path: "hotelId", select: "name code region timezone active" },
  { path: "createdBy", select: "name email role team" },
  { path: "updatedBy", select: "name email role team" },
];

async function getAllAssets(req, res) {
  try {
    const hotelScope = await buildHotelScopeQuery(req.user, req.query);
    const assets = await Asset.find(hotelScope)
      .sort({ createdAt: -1 })
      .populate(ASSET_POPULATE_CONFIG);

    res.json(assets.map(withLifeCycleRecommendation));
  } catch (error) {
    sendError(res, 500, "Failed to fetch assets", error);
  }
}

async function createAsset(req, res) {
  try {
    const payload = buildAssetPayload(req.body);
    const hotelScope = await buildHotelScopeQuery(
      req.user,
      req.body.hotelId ? { hotelId: req.body.hotelId } : req.query
    );
    const hotelId = String(hotelScope.hotelId?.$in?.[0] || getUserHotelId(req.user) || "");

    if (!hotelId) {
      return res.status(400).json({ message: "Hotel is required" });
    }

    const asset = await Asset.create({
      ...payload,
      hotelId,
      createdBy: req.user.id,
      updatedBy: req.user.id,
    });

    await asset.populate(ASSET_POPULATE_CONFIG);
    auditLog("asset.created", req, { assetId: asset._id, hotelId });
    res.status(201).json(withLifeCycleRecommendation(asset));
  } catch (error) {
    sendError(res, 400, "Failed to create asset", error);
  }
}

async function updateAsset(req, res) {
  try {
    const payload = buildAssetPayload(req.body, { partial: true });
    const hotelScope = await buildHotelScopeQuery(req.user, req.query);

    const asset = await Asset.findOneAndUpdate(
      { _id: req.params.id, ...hotelScope },
      {
        ...payload,
        updatedBy: req.user.id,
      },
      { new: true, runValidators: true }
    ).populate(ASSET_POPULATE_CONFIG);

    if (!asset) {
      return res.status(404).json({ message: "Asset not found" });
    }

    auditLog("asset.updated", req, { assetId: asset._id, hotelId: asset.hotelId });
    res.json(withLifeCycleRecommendation(asset));
  } catch (error) {
    sendError(res, 400, "Failed to update asset", error);
  }
}

async function deleteAsset(req, res) {
  try {
    const hotelScope = await buildHotelScopeQuery(req.user, req.query);
    const asset = await Asset.findOneAndDelete({ _id: req.params.id, ...hotelScope });

    if (!asset) {
      return res.status(404).json({ message: "Asset not found" });
    }

    auditLog("asset.deleted", req, { assetId: asset._id, hotelId: asset.hotelId });
    res.json({ message: "Asset deleted" });
  } catch (error) {
    sendError(res, 400, "Failed to delete asset", error);
  }
}

function buildAssetPayload(body, options = {}) {
  const { partial = false } = options;
  const payload = {};

  copyStringField(payload, body, "assetName", partial);
  copyStringField(payload, body, "assetType", partial);
  copyStringField(payload, body, "serialNumber", partial);
  copyStringField(payload, body, "owner", true);
  copyStringField(payload, body, "department", true);
  copyStringField(payload, body, "status", true);

  const lifeCycle = buildLifeCyclePayload(body.lifeCycle || {});
  if (Object.keys(lifeCycle).length) {
    payload.lifeCycle = lifeCycle;
  }

  return payload;
}

function copyStringField(target, source, field, optional) {
  if (source[field] === undefined) return;
  if (!optional && !String(source[field]).trim()) return;

  target[field] = String(source[field]).trim();
}

function buildLifeCyclePayload(lifeCycle) {
  const payload = {};

  if (lifeCycle.purchaseDate !== undefined) {
    payload.purchaseDate = lifeCycle.purchaseDate
      ? new Date(lifeCycle.purchaseDate)
      : null;
  }
  if (lifeCycle.expectedLifeMonths !== undefined) {
    payload.expectedLifeMonths = Number(lifeCycle.expectedLifeMonths);
  }
  if (lifeCycle.condition !== undefined) {
    payload.condition = String(lifeCycle.condition).trim();
  }
  if (lifeCycle.notes !== undefined) {
    payload.notes = String(lifeCycle.notes).trim();
  }

  return payload;
}

function withLifeCycleRecommendation(asset) {
  const data = asset.toObject ? asset.toObject() : asset;
  const ageMonths = calculateAgeMonths(data.lifeCycle?.purchaseDate);
  const expectedLifeMonths = data.lifeCycle?.expectedLifeMonths || 36;

  return {
    ...data,
    lifeCycle: {
      ...data.lifeCycle,
      ageMonths,
      recommendation: getLifeCycleRecommendation({
        ageMonths,
        condition: data.lifeCycle?.condition,
        expectedLifeMonths,
        status: data.status,
      }),
    },
  };
}

function calculateAgeMonths(purchaseDate) {
  if (!purchaseDate) return null;

  const start = new Date(purchaseDate);
  if (Number.isNaN(start.getTime())) return null;

  const now = new Date();
  return Math.max(
    0,
    (now.getFullYear() - start.getFullYear()) * 12 +
      (now.getMonth() - start.getMonth())
  );
}

function getLifeCycleRecommendation({
  ageMonths,
  condition,
  expectedLifeMonths,
  status,
}) {
  if (status === "Retired" || condition === "End of Life") return "Replace";
  if (status === "In Repair" || condition === "Needs Repair") return "Repair";
  if (ageMonths === null) return condition === "Monitor" ? "Monitor" : "Good";

  const usageRatio = ageMonths / expectedLifeMonths;

  if (usageRatio >= 1) return "Replace";
  if (usageRatio >= 0.8 || condition === "Monitor") return "Monitor";

  return "Good";
}

module.exports = {
  createAsset,
  deleteAsset,
  getAllAssets,
  updateAsset,
};
