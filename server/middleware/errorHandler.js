/**
 * Centralized error handling middleware
 * Should be used as the last middleware in the app
 */
function errorHandler(err, req, res, next) {
  // Log error for debugging
  console.error("[ERROR]", {
    message: err.message,
    status: err.status || 500,
    path: req.path,
    method: req.method,
  });

  // MongoDB validation errors
  if (err.name === "ValidationError") {
    return res.status(400).json({
      message: "Validation error",
      errors: Object.values(err.errors).map((e) => ({
        field: e.path,
        message: e.message,
      })),
    });
  }

  // MongoDB cast errors (invalid ObjectId)
  if (err.name === "CastError") {
    return res.status(400).json({
      message: "Invalid ID format",
    });
  }

  // MongoDB duplicate key errors
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(400).json({
      message: `${field} already exists`,
    });
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      message: "Invalid token",
    });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      message: "Token expired",
    });
  }

  // Multer upload errors
  if (err.name === "MulterError") {
    const message =
      err.code === "LIMIT_FILE_SIZE"
        ? "Image must be 5 MB or smaller"
        : err.message;

    return res.status(400).json({ message });
  }

  // Default error response
  const statusCode = err.status || 500;
  const message =
    process.env.NODE_ENV === "production" && statusCode >= 500
      ? "Internal server error"
      : err.message || "Internal server error";

  res.status(err.status || 500).json({
    message,
  });
}

module.exports = errorHandler;
