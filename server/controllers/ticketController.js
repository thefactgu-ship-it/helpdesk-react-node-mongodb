const fs = require("fs");
const path = require("path");
const Ticket = require("../models/Ticket");
const User = require("../models/User");
const {
  generateTicketNumber,
  getSlaHoursByPriority,
  buildLogEntry,
  buildMonthlyTrend,
} = require("../utils/ticketHelper");
const { TICKET_POPULATE_CONFIG, TICKET_STATUSES } = require("../constants");
const { sendError } = require("../utils/errorHandler");

const IMAGE_CONTENT_TYPES = {
  ".gif": "image/gif",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

function canManageTickets(user) {
  return ["Admin", "Manager"].includes(user?.role);
}

function canAccessTicket(user, ticket) {
  if (canManageTickets(user)) return true;
  return String(ticket.assignedTo?._id || ticket.assignedTo) === user.id;
}

async function ensureAssignableUser(userId) {
  const user = await User.findById(userId).select("role");

  if (!user) {
    return { ok: false, status: 404, message: "Assigned user not found" };
  }

  if (user.role === "User") {
    return {
      ok: false,
      status: 400,
      message: "Tickets can only be assigned to staff, manager, or admin roles",
    };
  }

  return { ok: true };
}

/**
 * Get all tickets
 * GET /api/tickets
 */
async function getAllTickets(req, res) {
  try {
    const query = canManageTickets(req.user) ? {} : { assignedTo: req.user.id };
    const tickets = await Ticket.find(query)
      .sort({ createdAt: -1 })
      .populate(TICKET_POPULATE_CONFIG);
    res.json(tickets);
  } catch (error) {
    sendError(res, 500, "Failed to fetch tickets", error);
  }
}

/**
 * Get ticket analytics and insights
 * GET /api/tickets/insights
 */
async function getInsights(req, res) {
  try {
    const tickets = await Ticket.find();
    const total = tickets.length;

    // Calculate average resolution time
    const resolvedTickets = tickets.filter((ticket) => ticket.resolvedAt);
    const avgResolutionHours = resolvedTickets.length
      ? resolvedTickets.reduce(
          (sum, ticket) =>
            sum +
            (new Date(ticket.resolvedAt) - new Date(ticket.createdAt)) / 3600000,
          0
        ) / resolvedTickets.length
      : 0;

    // Count overdue tickets
    const overdueCount = tickets.filter(
      (ticket) =>
        ticket.dueDate &&
        !["resolved", "closed"].includes(ticket.status) &&
        new Date() > new Date(ticket.dueDate)
    ).length;

    // Get top categories
    const categoryCounts = tickets.reduce((acc, ticket) => {
      acc[ticket.category] = (acc[ticket.category] || 0) + 1;
      return acc;
    }, {});

    const topCategories = Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    // Get monthly trend
    const monthlyTrend = buildMonthlyTrend(tickets);

    // Get status counts
    const statusCounts = tickets.reduce(
      (acc, ticket) => {
        acc[ticket.status] = (acc[ticket.status] || 0) + 1;
        return acc;
      },
      { open: 0, in_progress: 0, resolved: 0, closed: 0 }
    );

    res.json({
      total,
      avgResolutionHours: Number(avgResolutionHours.toFixed(1)),
      overdueCount,
      topCategories,
      monthlyTrend,
      statusCounts,
    });
  } catch (error) {
    sendError(res, 500, "Failed to load insights", error);
  }
}

/**
 * Get ticket by ID
 * GET /api/tickets/:id
 */
async function getTicketById(req, res) {
  try {
    const ticket = await Ticket.findById(req.params.id).populate(
      TICKET_POPULATE_CONFIG
    );
    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }
    if (!canAccessTicket(req.user, ticket)) {
      return res.status(403).json({ message: "Ticket access denied" });
    }

    res.json(ticket);
  } catch (error) {
    sendError(res, 400, "Failed to fetch ticket", error);
  }
}

/**
 * Create new ticket
 * POST /api/tickets
 */
async function createTicket(req, res) {
  try {
    const {
      title,
      description = "",
      requester,
      category = "General",
      department = "IT",
      priority = "medium",
      dueDate,
      assignedTo,
    } = req.body;

    // Validate required fields
    if (!title || !title.trim()) {
      return res.status(400).json({ message: "Ticket title is required" });
    }
    if (!requester || !requester.trim()) {
      return res.status(400).json({ message: "Requester is required" });
    }

    let assignedUser = null;
    if (assignedTo) {
      if (!canManageTickets(req.user)) {
        return res.status(403).json({ message: "Only Admin or Manager can assign tickets" });
      }

      const assignable = await ensureAssignableUser(assignedTo);
      if (!assignable.ok) {
        return res.status(assignable.status).json({ message: assignable.message });
      }

      assignedUser = assignedTo;
    }

    // Calculate SLA and due date
    const slaHours = getSlaHoursByPriority(priority);
    const dueDateValue = dueDate
      ? new Date(dueDate)
      : new Date(Date.now() + slaHours * 3600000);
    const status = assignedUser ? "in_progress" : "open";

    // Create ticket
    const ticket = await Ticket.create({
      ticketNumber: generateTicketNumber(),
      title,
      description,
      requester: requester.trim(),
      category,
      department,
      priority,
      status,
      assignedTo: assignedUser,
      slaHours,
      dueDate: dueDateValue,
      createdBy: req.user.id,
      updatedBy: req.user.id,
      activityLog: [
        buildLogEntry("created", "Ticket created", req.user.id),
      ],
    });

    await ticket.populate(TICKET_POPULATE_CONFIG);
    res.status(201).json(ticket);
  } catch (error) {
    res.status(400).json({
      message: "Failed to create ticket",
      error: error.message,
    });
  }
}

/**
 * Update ticket
 * PATCH /api/tickets/:id
 */
async function updateTicket(req, res) {
  try {
    const existingTicket = await Ticket.findById(req.params.id);
    if (!existingTicket) {
      return res.status(404).json({ message: "Ticket not found" });
    }
    if (!canAccessTicket(req.user, existingTicket)) {
      return res.status(403).json({ message: "Ticket access denied" });
    }

    const updateFields = {};
    const logDetails = [];

    const {
      title,
      description,
      requester,
      category,
      department,
      priority,
      status,
      assignedTo,
      dueDate,
    } = req.body;

    // Build update fields and log details
    if (title) {
      updateFields.title = title;
      logDetails.push("Title updated");
    }
    if (description) {
      updateFields.description = description;
      logDetails.push("Description updated");
    }
    if (requester) {
      updateFields.requester = requester;
      logDetails.push("Requester updated");
    }
    if (category) {
      updateFields.category = category;
      logDetails.push("Category updated");
    }
    if (department) {
      updateFields.department = department;
      logDetails.push("Department updated");
    }
    if (priority) {
      updateFields.priority = priority;
      updateFields.slaHours = getSlaHoursByPriority(priority);
      logDetails.push("Priority updated");
    }
    if (dueDate) {
      updateFields.dueDate = new Date(dueDate);
      logDetails.push("Due date updated");
    }
    if (assignedTo) {
      if (!canManageTickets(req.user)) {
        return res.status(403).json({ message: "Only Admin or Manager can assign tickets" });
      }

      const assignable = await ensureAssignableUser(assignedTo);
      if (!assignable.ok) {
        return res.status(assignable.status).json({ message: assignable.message });
      }

      updateFields.assignedTo = assignedTo;
      updateFields.status = "in_progress";
      logDetails.push("Assigned to user");
    }
    if (status) {
      updateFields.status = status;
      logDetails.push(`Status changed to ${status}`);
      if (["resolved", "closed"].includes(status)) {
        updateFields.resolvedAt = new Date();
      }
    }

    updateFields.updatedBy = req.user.id;

    // Update ticket
    const ticket = await Ticket.findByIdAndUpdate(
      req.params.id,
      {
        ...updateFields,
        $push: {
          activityLog: buildLogEntry(
            "updated",
            logDetails.join("; "),
            req.user.id
          ),
        },
      },
      { new: true, runValidators: true }
    ).populate(TICKET_POPULATE_CONFIG);

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    res.json(ticket);
  } catch (error) {
    sendError(res, 400, "Failed to update ticket", error);
  }
}

/**
 * Update ticket status only
 * PATCH /api/tickets/:id/status
 */
async function updateTicketStatus(req, res) {
  try {
    const { status } = req.body;
    const existingTicket = await Ticket.findById(req.params.id);
    if (!existingTicket) {
      return res.status(404).json({ message: "Ticket not found" });
    }
    if (!canAccessTicket(req.user, existingTicket)) {
      return res.status(403).json({ message: "Ticket access denied" });
    }

    // Validate status
    if (!TICKET_STATUSES.includes(status)) {
      return res.status(400).json({ message: "Invalid ticket status" });
    }

    // Build update data
    const updateData = {
      status,
      updatedBy: req.user.id,
      $push: {
        activityLog: buildLogEntry(
          "status",
          `Status changed to ${status}`,
          req.user.id
        ),
      },
    };

    // Set resolved timestamp if closing ticket
    if (["resolved", "closed"].includes(status)) {
      updateData.resolvedAt = new Date();
    }

    // Update ticket
    const ticket = await Ticket.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    }).populate(TICKET_POPULATE_CONFIG);

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    res.json(ticket);
  } catch (error) {
    sendError(res, 400, "Failed to update status", error);
  }
}

/**
 * Assign ticket to user
 * PATCH /api/tickets/:id/assign
 */
async function assignTicket(req, res) {
  try {
    const { assignedTo } = req.body;

    if (!canManageTickets(req.user)) {
      return res.status(403).json({ message: "Only Admin or Manager can assign tickets" });
    }

    if (!assignedTo) {
      return res.status(400).json({ message: "Assigned user is required" });
    }

    const assignable = await ensureAssignableUser(assignedTo);
    if (!assignable.ok) {
      return res.status(assignable.status).json({ message: assignable.message });
    }

    // Assign ticket
    const ticket = await Ticket.findByIdAndUpdate(
      req.params.id,
      {
        assignedTo,
        status: "in_progress",
        updatedBy: req.user.id,
        $push: {
          activityLog: buildLogEntry("assigned", "Ticket assigned", req.user.id),
        },
      },
      { new: true, runValidators: true }
    ).populate(TICKET_POPULATE_CONFIG);

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    res.json(ticket);
  } catch (error) {
    res.status(400).json({
      message: "Failed to assign ticket",
      error: error.message,
    });
  }
}

/**
 * Add comment to ticket
 * POST /api/tickets/:id/comment
 */
async function addComment(req, res) {
  try {
    const { text } = req.body;
    const existingTicket = await Ticket.findById(req.params.id);
    if (!existingTicket) {
      return res.status(404).json({ message: "Ticket not found" });
    }
    if (!canAccessTicket(req.user, existingTicket)) {
      return res.status(403).json({ message: "Ticket access denied" });
    }

    // Validate comment text
    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Comment text is required" });
    }

    // Add comment
    const ticket = await Ticket.findByIdAndUpdate(
      req.params.id,
      {
        $push: {
          comments: {
            text: text.trim(),
            author: req.user.id,
          },
          activityLog: buildLogEntry("comment", text.trim(), req.user.id),
        },
        updatedBy: req.user.id,
      },
      { new: true, runValidators: true }
    ).populate(TICKET_POPULATE_CONFIG);

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    res.json(ticket);
  } catch (error) {
    sendError(res, 400, "Failed to add comment", error);
  }
}

/**
 * Upload attachment to ticket
 * POST /api/tickets/:id/attachments
 */
async function uploadAttachment(req, res) {
  try {
    const existingTicket = await Ticket.findById(req.params.id);
    if (!existingTicket) {
      return res.status(404).json({ message: "Ticket not found" });
    }
    if (!canAccessTicket(req.user, existingTicket)) {
      return res.status(403).json({ message: "Ticket access denied" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Create attachment object
    const attachment = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      url: `/uploads/${req.file.filename}`,
      uploadedBy: req.user.id,
    };

    // Add attachment to ticket
    const ticket = await Ticket.findByIdAndUpdate(
      req.params.id,
      {
        $push: {
          attachments: attachment,
          activityLog: buildLogEntry(
            "attachment",
            `Uploaded ${req.file.originalname}`,
            req.user.id
          ),
        },
        updatedBy: req.user.id,
      },
      { new: true, runValidators: true }
    ).populate(TICKET_POPULATE_CONFIG);

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    res.json(ticket);
  } catch (error) {
    sendError(res, 400, "Failed to upload attachment", error);
  }
}

/**
 * Get all tickets for dashboard/report summaries
 * GET /api/tickets/summary
 */
async function getSummaryTickets(req, res) {
  try {
    const tickets = await Ticket.find()
      .sort({ createdAt: -1 })
      .populate(TICKET_POPULATE_CONFIG);
    res.json(tickets);
  } catch (error) {
    sendError(res, 500, "Failed to fetch ticket summary", error);
  }
}

/**
 * View uploaded image attachment inline
 * GET /api/tickets/:id/attachments/:attachmentId/view
 */
async function viewAttachment(req, res) {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }
    if (!canAccessTicket(req.user, ticket)) {
      return res.status(403).json({ message: "Ticket access denied" });
    }

    const attachment = ticket.attachments.id(req.params.attachmentId);
    if (!attachment) {
      return res.status(404).json({ message: "Attachment not found" });
    }

    const uploadsDir = path.resolve(__dirname, "..", "uploads");
    const safeFilename = path.basename(attachment.filename);
    const filePath = path.join(uploadsDir, safeFilename);

    if (!filePath.startsWith(uploadsDir) || !fs.existsSync(filePath)) {
      return res.status(404).json({ message: "Attachment file not found" });
    }

    const originalName = attachment.originalName || safeFilename;
    const extension = path.extname(originalName).toLowerCase();
    const contentType = IMAGE_CONTENT_TYPES[extension] || "application/octet-stream";

    res.setHeader("Content-Type", contentType);
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${encodeURIComponent(originalName)}"`
    );
    res.sendFile(filePath);
  } catch (error) {
    sendError(res, 400, "Failed to load attachment", error);
  }
}

/**
 * Delete ticket
 * DELETE /api/tickets/:id
 */
async function deleteTicket(req, res) {
  try {
    if (!canManageTickets(req.user)) {
      return res.status(403).json({ message: "Only Admin or Manager can delete tickets" });
    }

    const ticket = await Ticket.findByIdAndDelete(req.params.id);

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    res.json({ message: "Ticket deleted" });
  } catch (error) {
    sendError(res, 400, "Failed to delete ticket", error);
  }
}

module.exports = {
  getAllTickets,
  getSummaryTickets,
  getInsights,
  getTicketById,
  createTicket,
  updateTicket,
  updateTicketStatus,
  assignTicket,
  addComment,
  uploadAttachment,
  viewAttachment,
  deleteTicket,
};
