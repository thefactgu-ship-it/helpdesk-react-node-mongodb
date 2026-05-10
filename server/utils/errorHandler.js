/**
 * Standardized error response formatter
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Error message
 * @param {Error} error - Original error object (optional)
 */
function sendError(res, statusCode, message, error) {
  const responseMessage = error?.message || message;
  
  res.status(statusCode).json({
    message: responseMessage,
  });
}

/**
 * Safely get error message from various error formats
 * @param {Error|string} error - Error object or string
 * @param {string} fallback - Fallback message if error is empty
 * @returns {string} Error message
 */
function getErrorMessage(error, fallback = "An error occurred") {
  if (typeof error === "string") return error;
  if (error?.message) return error.message;
  if (error?.response?.data?.message) return error.response.data.message;
  return fallback;
}

module.exports = {
  sendError,
  getErrorMessage,
};
