/**
 * Wrapper function to catch errors in async route handlers
 * Prevents "UnhandledPromiseRejectionWarning" errors
 * @param {Function} fn - Async route handler function
 * @returns {Function} Wrapped function that passes errors to next()
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
