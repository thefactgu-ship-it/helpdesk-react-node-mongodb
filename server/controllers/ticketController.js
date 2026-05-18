const path = require("path");
const Ticket = require("../models/Ticket");
const User = require("../models/User");
const ProblemType = require("../models/ProblemType");
const Department = require("../models/Department");
const {
  generateTicketNumber,
  getSlaHoursByPriority,
  buildLogEntry,
  buildMonthlyTrend,
} = require("../utils/ticketHelper");
const { TICKET_POPULATE_CONFIG, TICKET_STATUSES } = require("../constants");
const { sendError } = require("../utils/errorHandler");
const {
  getProvider: getAttachmentStorageProvider,
  readAttachmentFile,
  saveAttachmentFile,
} = require("../services/attachmentStorage");
const {
  buildDateRangeQuery,
  buildHotelScopeQuery,
  canManageTickets,
  getUserHotelId,
  isStaffRole,
} = require("../utils/tenantScope");
const auditLog = require("../utils/auditLogger");

const IMAGE_CONTENT_TYPES = {
  ".gif": "image/gif",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

function getUserId(user) {
  return String(user?._id || user?.id || "");
}

function getTicketHotelId(ticket) {
  return String(ticket?.hotelId?._id || ticket?.hotelId || "");
}

function isAssignedToUser(user, ticket) {
  return String(ticket.assignedTo?._id || ticket.assignedTo || "") === getUserId(user);
}

function isCreatedByUser(user, ticket) {
  return String(ticket.createdBy?._id || ticket.createdBy || "") === getUserId(user);
}

function canAccessTicket(user, ticket) {
  if (canManageTickets(user)) return true;
  if (getTicketHotelId(ticket) !== getUserHotelId(user)) return false;
  return isAssignedToUser(user, ticket) || isCreatedByUser(user, ticket);
}

function canWorkOnTicket(user, ticket) {
  if (canManageTickets(user)) return true;
  return user?.role === "Agent" && isAssignedToUser(user, ticket);
}

async function ensureProblemTypeName(name) {
  const normalizedName = String(name || "").trim();

  if (!normalizedName) {
    return { ok: false, status: 400, message: "Issue category is required" };
  }

  const problemType = await ProblemType.findOne({
    name: normalizedName,
    active: { $ne: false },
  }).select("_id name");

  if (!problemType) {
    return { ok: false, status: 400, message: "Issue category must be an active problem type" };
  }

  return { ok: true, name: problemType.name };
}

async function ensureAssignableUser(userId, hotelId) {
  const user = await User.findById(userId).select("role hotelId hotelAccess");

  if (!user) {
    return { ok: false, status: 404, message: "Assigned user not found" };
  }

  if (!isStaffRole(user.role)) {
    return {
      ok: false,
      status: 400,
      message: "Tickets can only be assigned to staff, manager, or admin roles",
    };
  }

  const sameHotel = String(user.hotelId || "") === String(hotelId);
  const hasHotelAccess = (user.hotelAccess || []).some(
    (allowedHotelId) => String(allowedHotelId) === String(hotelId)
  );

  if (!sameHotel && !hasHotelAccess) {
    return { ok: false, status: 400, message: "Assigned user does not have access to this hotel" };
  }

  return { ok: true };
}

async function resolveRequesterUser(userId, hotelId) {
  if (!userId) return null;

  const user = await User.findOne({
    _id: userId,
    hotelId,
    role: "User",
    active: { $ne: false },
  }).select("_id name departmentId departmentName team");

  if (!user) {
    return { ok: false, status: 400, message: "Requester user must be an active requester for this hotel" };
  }

  return { ok: true, user };
}

async function resolveDepartment(departmentId, hotelId) {
  if (!departmentId) return null;

  const department = await Department.findOne({
    _id: departmentId,
    hotelId,
    active: { $ne: false },
  }).select("_id name code");

  if (!department) {
    return { ok: false, status: 400, message: "Department must be active for this hotel" };
  }

  return { ok: true, department };
}

async function resolveTicketHotelId(req) {
  const hotelScope = await buildHotelScopeQuery(req.user, req.body.hotelId ? { hotelId: req.body.hotelId } : req.query);
  const hotelIds = hotelScope.hotelId?.$in || [];
  return String(hotelIds[0] || getUserHotelId(req.user) || "");
}

/**
 * Get all tickets
 * GET /api/tickets
 */
async function getAllTickets(req, res) {
  try {
    const hotelScope = await buildHotelScopeQuery(req.user, req.query);
    const visibilityQuery = canManageTickets(req.user)
      ? {}
      : { $or: [{ createdBy: getUserId(req.user) }, { assignedTo: getUserId(req.user) }] };
    const query = {
      ...hotelScope,
      ...visibilityQuery,
      ...buildDateRangeQuery(req.query),
    };

    if (req.query.status) query.status = req.query.status;
    if (req.query.category) query.category = req.query.category;
    if (req.query.priority) query.priority = req.query.priority;
    if (req.query.departmentId) query.departmentId = req.query.departmentId;
    if (req.query.requesterUserId) query.requesterUserId = req.query.requesterUserId;

    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 200);
    const skip = (page - 1) * limit;

    const [tickets, total] = await Promise.all([
      Ticket.find(query)
      .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate(TICKET_POPULATE_CONFIG),
      Ticket.countDocuments(query),
    ]);

    res.json({ data: tickets, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    sendError(res, 500, "Failed to fetch tickets", error);
  }
}

async function findScopedTicketById(req, id) {
  const hotelScope = await buildHotelScopeQuery(req.user, req.query);
  return Ticket.findOne({ _id: id, ...hotelScope })
      .populate(TICKET_POPULATE_CONFIG);
}

/**
 * Get ticket analytics and insights
 * GET /api/tickets/insights
 */
async function getInsights(req, res) {
  try {
    const hotelScope = await buildHotelScopeQuery(req.user, req.query);
    const tickets = await Ticket.find({
      ...hotelScope,
      ...buildDateRangeQuery(req.query),
      ...(req.query.departmentId ? { departmentId: req.query.departmentId } : {}),
      ...(req.query.status ? { status: req.query.status } : {}),
      ...(req.query.category ? { category: req.query.category } : {}),
      ...(req.query.priority ? { priority: req.query.priority } : {}),
    });
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
    const ticket = await findScopedTicketById(req, req.params.id);
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
      requesterUserId,
      category,
      department = "IT",
      departmentId,
      priority = "medium",
      dueDate,
      assignedTo,
    } = req.body;

    // Validate required fields
    if (!title || !title.trim()) {
      return res.status(400).json({ message: "Ticket title is required" });
    }
    if (!requesterUserId && (!requester || !requester.trim())) {
      return res.status(400).json({ message: "Requester is required" });
    }

    const hotelId = await resolveTicketHotelId(req);
    if (!hotelId) {
      return res.status(400).json({ message: "Hotel is required" });
    }

    const problemType = await ensureProblemTypeName(category);
    if (!problemType.ok) {
      return res.status(problemType.status).json({ message: problemType.message });
    }

    const requesterResult = await resolveRequesterUser(requesterUserId || req.user.id, hotelId);
    if (requesterUserId && !requesterResult.ok) {
      return res.status(requesterResult.status).json({ message: requesterResult.message });
    }

    const requesterUser = requesterResult?.ok ? requesterResult.user : null;
    const departmentResult = await resolveDepartment(departmentId || requesterUser?.departmentId, hotelId);
    if (departmentId && !departmentResult.ok) {
      return res.status(departmentResult.status).json({ message: departmentResult.message });
    }
    const selectedDepartment = departmentResult?.ok ? departmentResult.department : null;

    let assignedUser = null;
    if (assignedTo) {
      if (!canManageTickets(req.user)) {
        return res.status(403).json({ message: "Only Admin or Manager can assign tickets" });
      }

      const assignable = await ensureAssignableUser(assignedTo, hotelId);
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
      hotelId,
      title,
      description,
      requester: requesterUser?.name || requester.trim(),
      requesterUserId: requesterUser?._id || null,
      category: problemType.name,
      department: selectedDepartment?.name || department,
      departmentId: selectedDepartment?._id || null,
      departmentName: selectedDepartment?.name || department,
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
    auditLog("ticket.created", req, { ticketId: ticket._id, hotelId });
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
    const existingTicket = await findScopedTicketById(req, req.params.id);
    if (!existingTicket) {
      return res.status(404).json({ message: "Ticket not found" });
    }
    if (!canAccessTicket(req.user, existingTicket)) {
      return res.status(403).json({ message: "Ticket access denied" });
    }
    if (!canWorkOnTicket(req.user, existingTicket)) {
      return res.status(403).json({ message: "Only assigned agents, managers, or admins can update tickets" });
    }

    const updateFields = {};
    const logDetails = [];

    const {
      title,
      description,
      requester,
      requesterUserId,
      category,
      department,
      departmentId,
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
    if (requesterUserId) {
      const requesterResult = await resolveRequesterUser(requesterUserId, getTicketHotelId(existingTicket));
      if (!requesterResult.ok) {
        return res.status(requesterResult.status).json({ message: requesterResult.message });
      }
      updateFields.requesterUserId = requesterResult.user._id;
      updateFields.requester = requesterResult.user.name;
      logDetails.push("Requester account updated");
    }
    if (category) {
      const existingHotelId = getTicketHotelId(existingTicket);
      const problemType = await ensureProblemTypeName(category);
      if (!problemType.ok) {
        return res.status(problemType.status).json({ message: problemType.message });
      }

      updateFields.category = problemType.name;
      logDetails.push("Category updated");
    }
    if (department) {
      updateFields.department = department;
      updateFields.departmentName = department;
      logDetails.push("Department updated");
    }
    if (departmentId) {
      const departmentResult = await resolveDepartment(departmentId, getTicketHotelId(existingTicket));
      if (!departmentResult.ok) {
        return res.status(departmentResult.status).json({ message: departmentResult.message });
      }
      updateFields.departmentId = departmentResult.department._id;
      updateFields.department = departmentResult.department.name;
      updateFields.departmentName = departmentResult.department.name;
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

      const assignable = await ensureAssignableUser(assignedTo, getTicketHotelId(existingTicket));
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
    const ticket = await Ticket.findOneAndUpdate(
      { _id: req.params.id, hotelId: getTicketHotelId(existingTicket) },
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

    auditLog("ticket.updated", req, { ticketId: ticket._id, hotelId: ticket.hotelId });
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
    const existingTicket = await findScopedTicketById(req, req.params.id);
    if (!existingTicket) {
      return res.status(404).json({ message: "Ticket not found" });
    }
    if (!canAccessTicket(req.user, existingTicket)) {
      return res.status(403).json({ message: "Ticket access denied" });
    }
    if (!canWorkOnTicket(req.user, existingTicket)) {
      return res.status(403).json({ message: "Only assigned agents, managers, or admins can update ticket status" });
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
    const ticket = await Ticket.findOneAndUpdate({ _id: req.params.id, hotelId: getTicketHotelId(existingTicket) }, updateData, {
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

    const existingTicket = await findScopedTicketById(req, req.params.id);
    if (!existingTicket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    const assignable = await ensureAssignableUser(assignedTo, getTicketHotelId(existingTicket));
    if (!assignable.ok) {
      return res.status(assignable.status).json({ message: assignable.message });
    }

    // Assign ticket
    const ticket = await Ticket.findOneAndUpdate(
      { _id: req.params.id, hotelId: getTicketHotelId(existingTicket) },
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
    const existingTicket = await findScopedTicketById(req, req.params.id);
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
    const ticket = await Ticket.findOneAndUpdate(
      { _id: req.params.id, hotelId: getTicketHotelId(existingTicket) },
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
    if (getAttachmentStorageProvider() === "disabled") {
      return res.status(503).json({
        message: "Ticket attachments are disabled. Please use ticket comments for updates.",
      });
    }

    const existingTicket = await findScopedTicketById(req, req.params.id);
    if (!existingTicket) {
      return res.status(404).json({ message: "Ticket not found" });
    }
    if (!canAccessTicket(req.user, existingTicket)) {
      return res.status(403).json({ message: "Ticket access denied" });
    }
    if (!canWorkOnTicket(req.user, existingTicket)) {
      return res.status(403).json({ message: "Only assigned agents, managers, or admins can upload attachments" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const storedFile = await saveAttachmentFile(req.file);

    // Create attachment object
    const attachment = {
      filename: storedFile.filename,
      originalName: req.file.originalname,
      url: storedFile.url,
      storageProvider: storedFile.storageProvider,
      objectKey: storedFile.objectKey,
      uploadedBy: req.user.id,
    };

    // Add attachment to ticket
    const ticket = await Ticket.findOneAndUpdate(
      { _id: req.params.id, hotelId: getTicketHotelId(existingTicket) },
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
    const hotelScope = await buildHotelScopeQuery(req.user, req.query);
    const query = {
      ...hotelScope,
      ...buildDateRangeQuery(req.query),
    };
    if (req.query.status) query.status = req.query.status;
    if (req.query.category) query.category = req.query.category;
    if (req.query.priority) query.priority = req.query.priority;
    if (req.query.departmentId) query.departmentId = req.query.departmentId;
    if (req.query.requesterUserId) query.requesterUserId = req.query.requesterUserId;

    const tickets = await Ticket.find(query)
      .sort({ createdAt: -1 })
      .limit(Math.min(Number(req.query.limit) || 1000, 5000))
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
    const ticket = await findScopedTicketById(req, req.params.id);
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

    const fileBuffer = await readAttachmentFile(attachment);

    if (!fileBuffer) {
      return res.status(404).json({ message: "Attachment file not found" });
    }

    const originalName =
      attachment.originalName ||
      path.basename(attachment.objectKey || attachment.filename || "attachment");
    const extension = path.extname(originalName).toLowerCase();
    const contentType = IMAGE_CONTENT_TYPES[extension] || "application/octet-stream";

    res.setHeader("Content-Type", contentType);
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${encodeURIComponent(originalName)}"`
    );
    res.send(fileBuffer);
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

    const existingTicket = await findScopedTicketById(req, req.params.id);
    if (!existingTicket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    const ticket = await Ticket.findOneAndDelete({
      _id: req.params.id,
      hotelId: getTicketHotelId(existingTicket),
    });

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    auditLog("ticket.deleted", req, { ticketId: ticket._id, hotelId: ticket.hotelId });
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
