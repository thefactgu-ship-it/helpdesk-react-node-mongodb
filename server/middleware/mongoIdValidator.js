const mongoose = require("mongoose");

/**
 * Middleware to validate MongoDB ObjectId in route parameters
 * Validates the 'id' parameter by default
 */
function mongoIdValidator(req, res, next) {
  const { id } = req.params;

  if (!id) {
    return next();
  }

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      message: "Invalid ID format",
    });
  }

  next();
}

module.exports = mongoIdValidator;
