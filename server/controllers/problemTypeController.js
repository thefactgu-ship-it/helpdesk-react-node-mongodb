const ProblemType = require("../models/ProblemType");
const { sendError } = require("../utils/errorHandler");
const { buildHotelScopeQuery, getUserHotelId } = require("../utils/tenantScope");

async function getProblemTypes(req, res) {
  try {
    const hotelScope = await buildHotelScopeQuery(req.user, req.query);
    const problemTypes = await ProblemType.find(hotelScope)
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
    const hotelScope = await buildHotelScopeQuery(
      req.user,
      req.body.hotelId ? { hotelId: req.body.hotelId } : req.query
    );
    const hotelId = String(hotelScope.hotelId?.$in?.[0] || getUserHotelId(req.user) || "");

    if (!hotelId) {
      return res.status(400).json({ message: "Hotel is required" });
    }

    const problemType = await ProblemType.create({
      hotelId,
      name: name.trim(),
      description: description.trim(),
      createdBy: req.user.id,
    });

    await problemType.populate({ path: "hotelId", select: "name code region timezone active" });
    await problemType.populate({ path: "createdBy", select: "name email role team hotelId" });
    res.status(201).json(problemType);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Problem type already exists for this hotel" });
    }

    sendError(res, 400, "Failed to create problem type", error);
  }
}

async function deleteProblemType(req, res) {
  try {
    const hotelScope = await buildHotelScopeQuery(req.user, req.query);
    const problemType = await ProblemType.findOneAndDelete({
      _id: req.params.id,
      ...hotelScope,
    });

    if (!problemType) {
      return res.status(404).json({ message: "Problem type not found" });
    }

    res.json({ message: "Problem type deleted" });
  } catch (error) {
    sendError(res, 400, "Failed to delete problem type", error);
  }
}

module.exports = {
  createProblemType,
  deleteProblemType,
  getProblemTypes,
};
