const express = require("express");
const multer = require("multer");
const authMiddleware = require("../middleware/authMiddleware");
const mongoIdValidator = require("../middleware/mongoIdValidator");
const asyncHandler = require("../utils/asyncHandler");
const ticketController = require("../controllers/ticketController");
const {
  createTicketValidationRules,
  updateTicketValidationRules,
  updateStatusValidationRules,
  assignTicketValidationRules,
  addCommentValidationRules,
  handleValidationErrors,
} = require("../validators/ticketValidator");

const MAX_ATTACHMENT_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
]);
const ALLOWED_IMAGE_EXTENSIONS = /\.(jpe?g|png|gif|webp)$/i;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_ATTACHMENT_SIZE,
    files: 1,
  },
  fileFilter: (req, file, cb) => {
    const hasAllowedMime = ALLOWED_IMAGE_TYPES.has(file.mimetype);
    const hasAllowedExtension = ALLOWED_IMAGE_EXTENSIONS.test(file.originalname);

    if (!hasAllowedMime || !hasAllowedExtension) {
      const error = new Error("Only image files are allowed");
      error.status = 400;
      return cb(error);
    }

    cb(null, true);
  },
});
const router = express.Router();

// All ticket routes require authentication
// GET all tickets
router.get("/", authMiddleware, asyncHandler(ticketController.getAllTickets));

// GET insights/analytics
router.get("/insights", authMiddleware, asyncHandler(ticketController.getInsights));

// GET all tickets for dashboard/report summaries
router.get("/summary", authMiddleware, asyncHandler(ticketController.getSummaryTickets));

// POST create ticket with validation
router.post(
  "/",
  authMiddleware,
  createTicketValidationRules(),
  handleValidationErrors,
  asyncHandler(ticketController.createTicket)
);

// GET ticket by ID with validation
router.get(
  "/:id",
  authMiddleware,
  mongoIdValidator,
  asyncHandler(ticketController.getTicketById)
);

// PATCH update ticket with validation
router.patch(
  "/:id",
  authMiddleware,
  mongoIdValidator,
  updateTicketValidationRules(),
  handleValidationErrors,
  asyncHandler(ticketController.updateTicket)
);

// PATCH update status with validation
router.patch(
  "/:id/status",
  authMiddleware,
  mongoIdValidator,
  updateStatusValidationRules(),
  handleValidationErrors,
  asyncHandler(ticketController.updateTicketStatus)
);

// PATCH assign ticket with validation
router.patch(
  "/:id/assign",
  authMiddleware,
  mongoIdValidator,
  assignTicketValidationRules(),
  handleValidationErrors,
  asyncHandler(ticketController.assignTicket)
);

// POST add comment with validation
router.post(
  "/:id/comment",
  authMiddleware,
  mongoIdValidator,
  addCommentValidationRules(),
  handleValidationErrors,
  asyncHandler(ticketController.addComment)
);

// POST upload attachment with validation
router.post(
  "/:id/attachments",
  authMiddleware,
  mongoIdValidator,
  upload.single("file"),
  asyncHandler(ticketController.uploadAttachment)
);

// GET view uploaded image attachment inline
router.get(
  "/:id/attachments/:attachmentId/view",
  authMiddleware,
  mongoIdValidator,
  asyncHandler(ticketController.viewAttachment)
);

// DELETE ticket
router.delete(
  "/:id",
  authMiddleware,
  mongoIdValidator,
  asyncHandler(ticketController.deleteTicket)
);

module.exports = router;
