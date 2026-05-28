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
  notifySafely,
  notifyTicketAssigned,
  notifyTicketCommented,
  notifyTicketCreated,
  notifyTicketStatusChanged,
} = require("../services/notificationService");
const {
  buildDateRangeQuery,
  buildHotelScopeQuery,
  canAssignTickets,
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

function isRequesterUser(user, ticket) {
  return String(ticket.requesterUserId?._id || ticket.requesterUserId || "") === getUserId(user);
}

function isCompletedStatus(status) {
  return ["resolved", "closed"].includes(status);
}

function isClosedStatus(status) {
  return status === "closed";
}

function rejectClosedTicketMutation(res) {
  return res.status(409).json({
    message: "Ticket is closed. Reopen it before editing or assigning.",
  });
}

function getUserDepartmentId(user) {
  return String(user?.departmentId?._id || user?.departmentId || "");
}

function normalizeName(value) {
  return String(value || "").trim();
}

function isOwnTicket(user, ticket) {
  return isAssignedToUser(user, ticket) || isCreatedByUser(user, ticket) || isRequesterUser(user, ticket);
}

function isUnassignedActiveTicket(ticket) {
  return !isCompletedStatus(ticket.status) && !ticket.assignedTo;
}

function hasTicketHotelAccess(user, ticket) {
  const ticketHotelId = getTicketHotelId(ticket);
  if (!ticketHotelId) return false;

  const allowedHotelIds = [
    getUserHotelId(user),
    ...(user?.hotelAccess || []).map((hotelId) => String(hotelId?._id || hotelId || "")),
  ].filter(Boolean);

  return allowedHotelIds.includes(ticketHotelId);
}

function canAccessTicket(user, ticket) {
  if (canManageTickets(user)) return true;
  if (!hasTicketHotelAccess(user, ticket)) return false;
  if (user?.role === "Agent" && isUnassignedActiveTicket(ticket)) return true;
  return isOwnTicket(user, ticket);
}

function canWorkOnTicket(user, ticket) {
  if (canManageTickets(user)) return true;
  return user?.role === "Agent" && isAssignedToUser(user, ticket);
}

function canSetTicketStatus(user, status) {
  if (canManageTickets(user)) return true;
  return user?.role === "Agent" && status !== "closed";
}

function buildTicketVisibilityQuery(user) {
  if (canManageTickets(user)) return {};

  const departmentId = getUserDepartmentId(user);
  const departmentName = normalizeName(user?.departmentName);
  const ownTicketQuery = [
    { createdBy: getUserId(user) },
    { requesterUserId: getUserId(user) },
    { assignedTo: getUserId(user) },
  ];

  if (user?.role === "Agent") {
    ownTicketQuery.push({
      status: { $nin: ["resolved", "closed"] },
      $or: [{ assignedTo: { $exists: false } }, { assignedTo: null }],
    });
  }

  const departmentQuery = [];

  if (departmentId) {
    departmentQuery.push({ departmentId });
  }

  if (departmentName) {
    departmentQuery.push({ departmentName });
    departmentQuery.push({ department: departmentName });
  }

  if (departmentQuery.length) {
    const departmentVisibility = { $or: departmentQuery };

    if (user?.role !== "User") {
      departmentVisibility.status = { $nin: ["resolved", "closed"] };
    }

    ownTicketQuery.push(departmentVisibility);
  }

  return {
    $or: ownTicketQuery,
  };
}

function buildHotelAnalyticsQuery(req, hotelScope) {
  const query = {
    ...hotelScope,
    ...buildDateRangeQuery(req.query),
  };

  if (req.query.status) query.status = req.query.status;
  if (req.query.category) query.category = req.query.category;
  if (req.query.priority) query.priority = req.query.priority;
  if (req.query.departmentId) query.departmentId = req.query.departmentId;
  if (req.query.requesterUserId) query.requesterUserId = req.query.requesterUserId;

  return query;
}

function canSubmitSatisfaction(user, ticket) {
  const userId = getUserId(user);
  const requesterUserId = String(ticket.requesterUserId?._id || ticket.requesterUserId || "");
  const fallbackCreatorId = String(ticket.createdBy?._id || ticket.createdBy || "");

  return requesterUserId ? requesterUserId === userId : fallbackCreatorId === userId;
}

function canReopenTicket(user, ticket) {
  return canManageTickets(user) || canSubmitSatisfaction(user, ticket);
}

function sanitizeRequesterListTicket(user, ticket) {
  if (isStaffRole(user?.role) || isOwnTicket(user, ticket)) return ticket;

  const plainTicket = typeof ticket.toObject === "function"
    ? ticket.toObject({ virtuals: true })
    : { ...ticket };

  return {
    _id: plainTicket._id,
    id: plainTicket.id,
    ticketNumber: plainTicket.ticketNumber,
    hotelId: plainTicket.hotelId,
    title: plainTicket.title,
    description: plainTicket.description,
    requester: plainTicket.requester ? "Department teammate" : "",
    requesterUserId: plainTicket.requesterUserId
      ? {
          _id: plainTicket.requesterUserId._id,
          id: plainTicket.requesterUserId.id,
          departmentId: plainTicket.requesterUserId.departmentId,
          departmentName: plainTicket.requesterUserId.departmentName,
        }
      : null,
    category: plainTicket.category,
    department: plainTicket.department,
    departmentId: plainTicket.departmentId,
    departmentName: plainTicket.departmentName,
    priority: plainTicket.priority,
    status: plainTicket.status,
    assignedTo: plainTicket.assignedTo
      ? { _id: plainTicket.assignedTo._id, id: plainTicket.assignedTo.id, name: plainTicket.assignedTo.name }
      : null,
    dueDate: plainTicket.dueDate,
    createdAt: plainTicket.createdAt,
    updatedAt: plainTicket.updatedAt,
    isOverdue: plainTicket.isOverdue,
    requesterScope: "department",
  };
}

function applyResolvedAtForStatus(updateFields, existingTicket, status) {
  if (!status) return;

  if (isCompletedStatus(status)) {
    updateFields.resolvedAt = existingTicket.resolvedAt || new Date();
    return;
  }

  updateFields.resolvedAt = null;
}

function getTicketStatusAuditAction(status) {
  if (status === "resolved") return "ticket.resolved";
  if (status === "closed") return "ticket.closed";
  return "ticket.status_changed";
}

function auditTicketStatusChange(req, ticket, fromStatus, toStatus) {
  if (!toStatus || fromStatus === toStatus) return;

  auditLog(getTicketStatusAuditAction(toStatus), req, {
    ticketId: ticket._id,
    hotelId: ticket.hotelId,
    fromStatus,
    toStatus,
  });
}

function auditTicketAssignment(req, ticket, fromAssignee, toAssignee, action = "ticket.assigned") {
  if (!toAssignee || fromAssignee === toAssignee) return;

  auditLog(action, req, {
    ticketId: ticket._id,
    hotelId: ticket.hotelId,
    fromAssignee,
    toAssignee,
  });
}

function getCompletionStats(tickets) {
  const completedTickets = tickets.filter((ticket) => isCompletedStatus(ticket.status));
  const successEligibleTickets = completedTickets.filter(
    (ticket) => ticket.resolvedAt && ticket.dueDate
  );
  const successfulTickets = successEligibleTickets.filter(
    (ticket) => new Date(ticket.resolvedAt) <= new Date(ticket.dueDate)
  );
  const ratedTickets = tickets.filter((ticket) => Number(ticket.satisfactionScore) > 0);
  const avgSatisfactionScore = ratedTickets.length
    ? ratedTickets.reduce((sum, ticket) => sum + Number(ticket.satisfactionScore), 0) / ratedTickets.length
    : 0;

  return {
    completedCount: completedTickets.length,
    completionRate: tickets.length ? Math.round((completedTickets.length / tickets.length) * 100) : 0,
    successfulCount: successfulTickets.length,
    successEligibleCount: successEligibleTickets.length,
    successRate: successEligibleTickets.length
      ? Math.round((successfulTickets.length / successEligibleTickets.length) * 100)
      : 0,
    satisfactionCount: ratedTickets.length,
    avgSatisfactionScore: Number(avgSatisfactionScore.toFixed(1)),
  };
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
    const visibilityQuery = buildTicketVisibilityQuery(req.user);
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

    res.json({
      data: tickets.map((ticket) => sanitizeRequesterListTicket(req.user, ticket)),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
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
      ...buildHotelAnalyticsQuery(req, hotelScope),
      ...buildTicketVisibilityQuery(req.user),
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
    const completionStats = getCompletionStats(tickets);

    res.json({
      total,
      avgResolutionHours: Number(avgResolutionHours.toFixed(1)),
      overdueCount,
      topCategories,
      monthlyTrend,
      statusCounts,
      ...completionStats,
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
      criticalRequested = false,
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

    const managerCanTriage = canManageTickets(req.user);
    const canAssignTicket = canAssignTickets(req.user);
    const criticalReviewRequested = !managerCanTriage && Boolean(criticalRequested);
    const effectivePriority = criticalReviewRequested
      ? "high"
      : managerCanTriage
        ? priority
        : "medium";

    let assignedUser = null;
    if (assignedTo) {
      if (!canAssignTicket) {
        return res.status(403).json({ message: "Only Admin or Manager can assign tickets" });
      }

      const assignable = await ensureAssignableUser(assignedTo, hotelId);
      if (!assignable.ok) {
        return res.status(assignable.status).json({ message: assignable.message });
      }

      assignedUser = assignedTo;
    }

    // Calculate SLA and due date
    const slaHours = getSlaHoursByPriority(effectivePriority);
    const dueDateValue = managerCanTriage && dueDate
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
      priority: effectivePriority,
      criticalRequested: criticalReviewRequested,
      status,
      assignedTo: assignedUser,
      slaHours,
      dueDate: dueDateValue,
      createdBy: req.user.id,
      updatedBy: req.user.id,
      activityLog: [
        buildLogEntry(
          "created",
          criticalReviewRequested
            ? "Ticket created; critical review requested"
            : "Ticket created",
          req.user.id,
        ),
      ],
    });

    await ticket.populate(TICKET_POPULATE_CONFIG);
    auditLog("ticket.created", req, { ticketId: ticket._id, hotelId });
    if (assignedUser) {
      auditTicketAssignment(req, ticket, "", String(assignedUser));
    }
    await notifySafely(notifyTicketCreated, ticket, req.user.id);
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
    const generalAuditDetails = [];

    const {
      title,
      description,
      requester,
      requesterUserId,
      category,
      department,
      departmentId,
      priority,
      criticalRequested,
      status,
      assignedTo,
      dueDate,
    } = req.body;
    const managerCanTriage = canManageTickets(req.user);
    const canAssignTicket = canAssignTickets(req.user);

    if (isClosedStatus(existingTicket.status) && Object.keys(req.body || {}).length) {
      return rejectClosedTicketMutation(res);
    }

    // Build update fields and log details
    if (title) {
      updateFields.title = title;
      logDetails.push("Title updated");
      generalAuditDetails.push("title");
    }
    if (description) {
      updateFields.description = description;
      logDetails.push("Description updated");
      generalAuditDetails.push("description");
    }
    if (requester) {
      updateFields.requester = requester;
      logDetails.push("Requester updated");
      generalAuditDetails.push("requester");
    }
    if (requesterUserId) {
      const requesterResult = await resolveRequesterUser(requesterUserId, getTicketHotelId(existingTicket));
      if (!requesterResult.ok) {
        return res.status(requesterResult.status).json({ message: requesterResult.message });
      }
      updateFields.requesterUserId = requesterResult.user._id;
      updateFields.requester = requesterResult.user.name;
      logDetails.push("Requester account updated");
      generalAuditDetails.push("requesterUserId");
    }
    if (category) {
      const problemType = await ensureProblemTypeName(category);
      if (!problemType.ok) {
        return res.status(problemType.status).json({ message: problemType.message });
      }

      updateFields.category = problemType.name;
      logDetails.push("Category updated");
      generalAuditDetails.push("category");
    }
    if (department) {
      updateFields.department = department;
      updateFields.departmentName = department;
      logDetails.push("Department updated");
      generalAuditDetails.push("department");
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
      generalAuditDetails.push("departmentId");
    }
    if (priority) {
      if (!managerCanTriage) {
        return res.status(403).json({ message: "Only Admin or Manager can update priority" });
      }

      updateFields.priority = priority;
      updateFields.slaHours = getSlaHoursByPriority(priority);
      updateFields.criticalRequested = false;
      logDetails.push("Priority updated");
      generalAuditDetails.push("priority");
    }
    if (dueDate) {
      if (!managerCanTriage) {
        return res.status(403).json({ message: "Only Admin or Manager can update due date" });
      }

      updateFields.dueDate = new Date(dueDate);
      logDetails.push("Due date updated");
      generalAuditDetails.push("dueDate");
    }
    if (criticalRequested !== undefined) {
      if (!managerCanTriage) {
        return res.status(403).json({ message: "Only Admin or Manager can update critical review" });
      }

      const nextCriticalRequested = updateFields.priority === "critical"
        ? false
        : Boolean(criticalRequested);
      updateFields.criticalRequested = nextCriticalRequested;
      logDetails.push(nextCriticalRequested ? "Critical review requested" : "Critical review cleared");
      generalAuditDetails.push("criticalRequested");
    }
    if (assignedTo) {
      if (!canAssignTicket) {
        return res.status(403).json({ message: "Only Admin or Manager can assign tickets" });
      }

      const assignable = await ensureAssignableUser(assignedTo, getTicketHotelId(existingTicket));
      if (!assignable.ok) {
        return res.status(assignable.status).json({ message: assignable.message });
      }

      updateFields.assignedTo = assignedTo;
      updateFields.status = "in_progress";
      applyResolvedAtForStatus(updateFields, existingTicket, "in_progress");
      logDetails.push("Assigned to user");
    }
    if (status) {
      if (!canSetTicketStatus(req.user, status)) {
        return res.status(403).json({ message: "Only managers or admins can close tickets" });
      }

      updateFields.status = status;
      logDetails.push(`Status changed to ${status}`);
      applyResolvedAtForStatus(updateFields, existingTicket, status);
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
      { returnDocument: "after", runValidators: true }
    ).populate(TICKET_POPULATE_CONFIG);

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    if (generalAuditDetails.length) {
      auditLog("ticket.updated", req, {
        ticketId: ticket._id,
        hotelId: ticket.hotelId,
        fields: generalAuditDetails,
      });
    }
    if (status) {
      auditTicketStatusChange(req, ticket, existingTicket.status, status);
    }
    if (assignedTo) {
      auditTicketAssignment(
        req,
        ticket,
        String(existingTicket.assignedTo?._id || existingTicket.assignedTo || ""),
        String(assignedTo)
      );
    }
    if (status) {
      await notifySafely(notifyTicketStatusChanged, ticket, req.user.id);
    }
    if (assignedTo) {
      await notifySafely(notifyTicketAssigned, ticket, req.user.id);
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
    if (!canSetTicketStatus(req.user, status)) {
      return res.status(403).json({ message: "Only managers or admins can close tickets" });
    }
    if (isClosedStatus(existingTicket.status) && status !== "closed") {
      return rejectClosedTicketMutation(res);
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

    applyResolvedAtForStatus(updateData, existingTicket, status);

    // Update ticket
    const ticket = await Ticket.findOneAndUpdate({ _id: req.params.id, hotelId: getTicketHotelId(existingTicket) }, updateData, {
      returnDocument: "after",
      runValidators: true,
    }).populate(TICKET_POPULATE_CONFIG);

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    auditTicketStatusChange(req, ticket, existingTicket.status, status);
    await notifySafely(notifyTicketStatusChanged, ticket, req.user.id);
    res.json(ticket);
  } catch (error) {
    sendError(res, 400, "Failed to update status", error);
  }
}

/**
 * Reopen closed ticket
 * PATCH /api/tickets/:id/reopen
 */
async function reopenTicket(req, res) {
  try {
    const existingTicket = await findScopedTicketById(req, req.params.id);
    if (!existingTicket) {
      return res.status(404).json({ message: "Ticket not found" });
    }
    if (!canAccessTicket(req.user, existingTicket)) {
      return res.status(403).json({ message: "Ticket access denied" });
    }
    if (!isClosedStatus(existingTicket.status)) {
      return res.status(409).json({ message: "Only closed tickets can be reopened" });
    }
    if (!canReopenTicket(req.user, existingTicket)) {
      return res.status(403).json({ message: "Only the requester, manager, or admin can reopen this ticket" });
    }

    const nextStatus = existingTicket.assignedTo ? "in_progress" : "open";
    const ticket = await Ticket.findOneAndUpdate(
      { _id: req.params.id, hotelId: getTicketHotelId(existingTicket) },
      {
        status: nextStatus,
        resolvedAt: null,
        updatedBy: req.user.id,
        $push: {
          activityLog: buildLogEntry("reopened", "Ticket reopened", req.user.id),
        },
      },
      { returnDocument: "after", runValidators: true }
    ).populate(TICKET_POPULATE_CONFIG);

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    auditLog("ticket.reopened", req, {
      ticketId: ticket._id,
      hotelId: ticket.hotelId,
      fromStatus: existingTicket.status,
      toStatus: nextStatus,
    });
    await notifySafely(notifyTicketStatusChanged, ticket, req.user.id);
    res.json(ticket);
  } catch (error) {
    sendError(res, 400, "Failed to reopen ticket", error);
  }
}

/**
 * Submit requester satisfaction
 * PATCH /api/tickets/:id/satisfaction
 */
async function submitSatisfaction(req, res) {
  try {
    const { score, comment = "" } = req.body;
    const existingTicket = await findScopedTicketById(req, req.params.id);
    if (!existingTicket) {
      return res.status(404).json({ message: "Ticket not found" });
    }
    if (!canAccessTicket(req.user, existingTicket)) {
      return res.status(403).json({ message: "Ticket access denied" });
    }
    if (existingTicket.status !== "resolved") {
      return res.status(400).json({ message: "Resolution can only be confirmed after the ticket is resolved" });
    }
    if (!canSubmitSatisfaction(req.user, existingTicket)) {
      return res.status(403).json({ message: "Only the ticket requester can submit satisfaction feedback" });
    }
    if (
      existingTicket.satisfactionSubmittedBy &&
      String(existingTicket.satisfactionSubmittedBy?._id || existingTicket.satisfactionSubmittedBy) !== getUserId(req.user)
    ) {
      return res.status(403).json({ message: "Satisfaction feedback was already submitted by another user" });
    }

    const ticket = await Ticket.findOneAndUpdate(
      { _id: req.params.id, hotelId: getTicketHotelId(existingTicket) },
      {
        satisfactionScore: Number(score),
        satisfactionComment: String(comment || "").trim(),
        satisfactionSubmittedBy: req.user.id,
        satisfactionSubmittedAt: new Date(),
        status: "closed",
        resolvedAt: existingTicket.resolvedAt || new Date(),
        updatedBy: req.user.id,
        $push: {
          activityLog: buildLogEntry("satisfaction", `Resolution confirmed; satisfaction score submitted: ${score}/5`, req.user.id),
        },
      },
      { returnDocument: "after", runValidators: true }
    ).populate(TICKET_POPULATE_CONFIG);

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    auditTicketStatusChange(req, ticket, existingTicket.status, "closed");
    auditLog("ticket.satisfaction_submitted", req, { ticketId: ticket._id, hotelId: ticket.hotelId, score, status: "closed" });
    await notifySafely(notifyTicketStatusChanged, ticket, req.user.id);
    res.json(ticket);
  } catch (error) {
    sendError(res, 400, "Failed to submit satisfaction", error);
  }
}

/**
 * Assign ticket to user
 * PATCH /api/tickets/:id/assign
 */
async function assignTicket(req, res) {
  try {
    const { assignedTo } = req.body;

    if (!canAssignTickets(req.user)) {
      return res.status(403).json({ message: "Only Admin or Manager can assign tickets" });
    }

    if (!assignedTo) {
      return res.status(400).json({ message: "Assigned user is required" });
    }

    const existingTicket = await findScopedTicketById(req, req.params.id);
    if (!existingTicket) {
      return res.status(404).json({ message: "Ticket not found" });
    }
    if (isClosedStatus(existingTicket.status)) {
      return rejectClosedTicketMutation(res);
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
        resolvedAt: null,
        updatedBy: req.user.id,
        $push: {
          activityLog: buildLogEntry("assigned", "Ticket assigned", req.user.id),
        },
      },
      { returnDocument: "after", runValidators: true }
    ).populate(TICKET_POPULATE_CONFIG);

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    auditTicketAssignment(
      req,
      ticket,
      String(existingTicket.assignedTo?._id || existingTicket.assignedTo || ""),
      String(assignedTo)
    );
    await notifySafely(notifyTicketAssigned, ticket, req.user.id);
    res.json(ticket);
  } catch (error) {
    res.status(400).json({
      message: "Failed to assign ticket",
      error: error.message,
    });
  }
}

/**
 * Claim an unassigned ticket for the current agent
 * PATCH /api/tickets/:id/claim
 */
async function claimTicket(req, res) {
  try {
    if (req.user?.role !== "Agent") {
      return res.status(403).json({ message: "Only agents can claim tickets" });
    }

    const hotelScope = await buildHotelScopeQuery(req.user, req.query);
    const existingTicket = await Ticket.findOne({
      _id: req.params.id,
      ...hotelScope,
      ...buildTicketVisibilityQuery(req.user),
    }).populate(TICKET_POPULATE_CONFIG);
    if (!existingTicket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    if (isCompletedStatus(existingTicket.status)) {
      return res.status(409).json({ message: "Closed tickets cannot be claimed" });
    }

    if (isAssignedToUser(req.user, existingTicket)) {
      return res.json(existingTicket);
    }

    if (existingTicket.assignedTo) {
      return res.status(409).json({ message: "Ticket is already assigned" });
    }

    const ticket = await Ticket.findOneAndUpdate(
      {
        _id: req.params.id,
        hotelId: getTicketHotelId(existingTicket),
        $or: [{ assignedTo: { $exists: false } }, { assignedTo: null }],
      },
      {
        assignedTo: req.user.id,
        status: "in_progress",
        resolvedAt: null,
        updatedBy: req.user.id,
        $push: {
          activityLog: buildLogEntry("assigned", "Ticket claimed", req.user.id),
        },
      },
      { returnDocument: "after", runValidators: true }
    ).populate(TICKET_POPULATE_CONFIG);

    if (!ticket) {
      const currentTicket = await Ticket.findById(req.params.id).populate(TICKET_POPULATE_CONFIG);
      if (currentTicket?.assignedTo) {
        return res.status(409).json({ message: "Ticket is already assigned" });
      }
      return res.status(404).json({ message: "Ticket not found" });
    }

    auditLog("ticket.claimed", req, { ticketId: ticket._id, hotelId: ticket.hotelId });
    await notifySafely(notifyTicketAssigned, ticket, req.user.id);
    res.json(ticket);
  } catch (error) {
    sendError(res, 400, "Failed to claim ticket", error);
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
      { returnDocument: "after", runValidators: true }
    ).populate(TICKET_POPULATE_CONFIG);

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    await notifySafely(notifyTicketCommented, ticket, req.user.id);
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
      { returnDocument: "after", runValidators: true }
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
      ...buildHotelAnalyticsQuery(req, hotelScope),
      ...buildTicketVisibilityQuery(req.user),
    };

    const tickets = await Ticket.find(query)
      .sort({ createdAt: -1 })
      .limit(Math.min(Number(req.query.limit) || 1000, 5000))
      .populate(TICKET_POPULATE_CONFIG);
    res.json(tickets.map((ticket) => sanitizeRequesterListTicket(req.user, ticket)));
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
  reopenTicket,
  submitSatisfaction,
  assignTicket,
  claimTicket,
  addComment,
  uploadAttachment,
  viewAttachment,
  deleteTicket,
  _private: {
    buildTicketVisibilityQuery,
    canReopenTicket,
    canAccessTicket,
    getTicketStatusAuditAction,
    sanitizeRequesterListTicket,
  },
};
