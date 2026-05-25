const ProblemType = require("../models/ProblemType");
const { sendError } = require("../utils/errorHandler");
const {
  buildHotelScopeQuery,
  canManageHotels,
  getUserHotelId,
} = require("../utils/tenantScope");
const auditLog = require("../utils/auditLogger");

async function getProblemTypes(req, res) {
  try {
    const problemTypes = await ProblemType.find(await buildProblemTypeReadQuery(req))
      .sort({ name: 1 })
      .populate({ path: "hotelId", select: "name code region timezone active" })
      .populate({ path: "createdBy", select: "name email role team hotelId" });

    res.json(problemTypes);
  } catch (error) {
    sendError(res, 500, "Failed to fetch problem types", error);
  }
}

async function createProblemType(req, res) {
  try {
    const { name, description = "" } = req.body;
    const hotelId = await resolveProblemTypeHotelId(req);
    const payload = {
      name: name.trim(),
      description: description.trim(),
      createdBy: req.user.id,
    };

    if (hotelId) payload.hotelId = hotelId;

    const problemType = await ProblemType.create(payload);

    await problemType.populate([
      { path: "hotelId", select: "name code region timezone active" },
      { path: "createdBy", select: "name email role team hotelId" },
    ]);
    auditLog("problem_type.created", req, { problemTypeId: problemType._id, hotelId });
    res.status(201).json(problemType);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Problem type already exists in the master list" });
    }

    sendError(res, 400, "Failed to create problem type", error);
  }
}

async function deleteProblemType(req, res) {
  try {
    const hotelScope = canManageHotels(req.user) && !req.query.hotelId && !req.query.hotelIds
      ? {}
      : await buildHotelScopeQuery(req.user, req.query);
    const problemType = await ProblemType.findOneAndDelete({
      _id: req.params.id,
      ...hotelScope,
    });

    if (!problemType) {
      return res.status(404).json({ message: "Problem type not found" });
    }

    auditLog("problem_type.deleted", req, { problemTypeId: problemType._id, hotelId: problemType.hotelId });
    res.json({ message: "Problem type deleted" });
  } catch (error) {
    sendError(res, 400, "Failed to delete problem type", error);
  }
}

async function buildProblemTypeReadQuery() {
  return {};
}

async function resolveProblemTypeHotelId(req) {
  if (canManageHotels(req.user) && !req.body.hotelId && !req.query.hotelId) {
    return null;
  }

  const hotelScope = await buildHotelScopeQuery(
    req.user,
    req.body.hotelId ? { hotelId: req.body.hotelId } : req.query
  );
  const scopedHotelId = hotelScope.hotelId?.$in?.[0];
  return scopedHotelId || getUserHotelId(req.user);
}

module.exports = {
  createProblemType,
  deleteProblemType,
  getProblemTypes,
  _private: {
    buildProblemTypeReadQuery,
    resolveProblemTypeHotelId,
  },
};
