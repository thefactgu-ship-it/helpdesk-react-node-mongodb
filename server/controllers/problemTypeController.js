const ProblemType = require("../models/ProblemType");
const { sendError } = require("../utils/errorHandler");

async function getProblemTypes(req, res) {
  try {
    const problemTypes = await ProblemType.find()
      .sort({ name: 1 })
      .populate({ path: "createdBy", select: "name email role team" });

    res.json(problemTypes);
  } catch (error) {
    sendError(res, 500, "Failed to fetch problem types", error);
  }
}

async function createProblemType(req, res) {
  try {
    const { name, description = "" } = req.body;

    const problemType = await ProblemType.create({
      name: name.trim(),
      description: description.trim(),
      createdBy: req.user.id,
    });

    await problemType.populate({ path: "createdBy", select: "name email role team" });
    res.status(201).json(problemType);
  } catch (error) {
    sendError(res, 400, "Failed to create problem type", error);
  }
}

async function deleteProblemType(req, res) {
  try {
    const problemType = await ProblemType.findByIdAndDelete(req.params.id);

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
