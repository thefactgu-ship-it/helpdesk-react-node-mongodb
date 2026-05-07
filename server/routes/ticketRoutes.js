const express = require("express");
const multer = require("multer");
const Ticket = require("../models/Ticket");
const authMiddleware = require("../middleware/authMiddleware");

const upload = multer({ dest: "uploads/" });

const getSlaHoursByPriority = (priority) => {
  const slaMap = {
    low: 72,
    medium: 24,
    high: 8,
    critical: 4,
  };

  return slaMap[priority] || 24;
};

const generateTicketNumber = () => {
  const date = new Date();

  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");

  const random = Math.floor(1000 + Math.random() * 9000);

  return `HD-${y}${m}${d}-${random}`;
};

const router = express.Router();

function sendError(res, statusCode, message, error) {
  res.status(statusCode).json({
    message: error?.message || message,
  });
}

const ticketPopulate = [
  { path: "createdBy", select: "name email role team" },
  { path: "assignedTo", select: "name email role team" },
  { path: "updatedBy", select: "name email role team" },
  { path: "comments.author", select: "name email role team" },
  { path: "activityLog.user", select: "name email role team" },
  { path: "attachments.uploadedBy", select: "name email role team" },
];

function buildLogEntry(action, details, userId) {
  return {
    action,
    details,
    user: userId,
  };
}

function buildMonthlyTrend(tickets) {
  const months = [];
  const today = new Date();

  for (let i = 5; i >= 0; i -= 1) {
    const month = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const label = month.toLocaleString("default", { month: "short", year: "numeric" });
    months.push({ label, count: 0 });
  }

  tickets.forEach((ticket) => {
    const createdAt = new Date(ticket.createdAt);
    const monthKey = createdAt.toLocaleString("default", { month: "short", year: "numeric" });
    const monthEntry = months.find((item) => item.label === monthKey);
    if (monthEntry) {
      monthEntry.count += 1;
    }
  });

  return months;
}

// GET all tickets
router.get("/", authMiddleware, async (req, res) => {
  try {
    const tickets = await Ticket.find().sort({ createdAt: -1 }).populate(ticketPopulate);
    res.json(tickets);
  } catch (error) {
    sendError(res, 500, "Failed to fetch tickets", error);
  }
});

router.get("/insights", authMiddleware, async (req, res) => {
  try {
    const tickets = await Ticket.find();
    const total = tickets.length;
    const resolvedTickets = tickets.filter((ticket) => ticket.resolvedAt);
    const avgResolutionHours = resolvedTickets.length
      ? resolvedTickets.reduce(
          (sum, ticket) => sum + ((new Date(ticket.resolvedAt) - new Date(ticket.createdAt)) / 3600000),
          0,
        ) / resolvedTickets.length
      : 0;
    const overdueCount = tickets.filter(
      (ticket) =>
        ticket.dueDate &&
        !["resolved", "closed"].includes(ticket.status) &&
        new Date() > new Date(ticket.dueDate),
    ).length;

    const categoryCounts = tickets.reduce((acc, ticket) => {
      acc[ticket.category] = (acc[ticket.category] || 0) + 1;
      return acc;
    }, {});

    const topCategories = Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    const monthlyTrend = buildMonthlyTrend(tickets);

    const statusCounts = tickets.reduce(
      (acc, ticket) => {
        acc[ticket.status] = (acc[ticket.status] || 0) + 1;
        return acc;
      },
      { open: 0, in_progress: 0, resolved: 0, closed: 0 },
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
});

// GET ticket by id
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id).populate(ticketPopulate);
    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    res.json(ticket);
  } catch (error) {
    sendError(res, 400, "Failed to fetch ticket", error);
  }
});

// POST create ticket
router.post("/", authMiddleware, async (req, res) => {
  try {
    const {
      title,
      description = "",
      category = "General",
      department = "IT",
      priority = "medium",
      dueDate,
      assignedTo,
    } = req.body;

    const slaHours = getSlaHoursByPriority(priority);
    const dueDateValue = dueDate ? new Date(dueDate) : new Date(Date.now() + slaHours * 3600000);
    const status = assignedTo ? "in_progress" : "open";

    const ticket = await Ticket.create({
      ticketNumber: generateTicketNumber(),
      title,
      description,
      category,
      department,
      priority,
      status,
      assignedTo: assignedTo || null,
      slaHours,
      dueDate: dueDateValue,
      createdBy: req.user.id,
      updatedBy: req.user.id,
      activityLog: [buildLogEntry("created", "Ticket created", req.user.id)],
    });

    await ticket.populate(ticketPopulate);
    res.status(201).json(ticket);
  } catch (error) {
    res.status(400).json({
      message: "Failed to create ticket",
      error: error.message,
    });
  }
});

// PATCH update ticket
router.patch("/:id", authMiddleware, async (req, res) => {
  try {
    const updateFields = {};
    const logDetails = [];

    const {
      title,
      description,
      category,
      department,
      priority,
      status,
      assignedTo,
      dueDate,
    } = req.body;

    if (title) {
      updateFields.title = title;
      logDetails.push("Title updated");
    }
    if (description) {
      updateFields.description = description;
      logDetails.push("Description updated");
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

    const ticket = await Ticket.findByIdAndUpdate(
      req.params.id,
      {
        ...updateFields,
        $push: {
          activityLog: buildLogEntry("updated", logDetails.join("; "), req.user.id),
        },
      },
      { new: true, runValidators: true },
    ).populate(ticketPopulate);

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    res.json(ticket);
  } catch (error) {
    sendError(res, 400, "Failed to update ticket", error);
  }
});

// PATCH update status
router.patch("/:id/status", authMiddleware, async (req, res) => {
  try {
    if (!["open", "in_progress", "resolved", "closed"].includes(req.body.status)) {
      return res.status(400).json({ message: "Invalid ticket status" });
    }

    const updateData = {
      status: req.body.status,
      updatedBy: req.user.id,
      $push: {
        activityLog: buildLogEntry(
          "status",
          `Status changed to ${req.body.status}`,
          req.user.id,
        ),
      },
    };

    if (["resolved", "closed"].includes(req.body.status)) {
      updateData.resolvedAt = new Date();
    }

    const ticket = await Ticket.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    }).populate(ticketPopulate);

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    res.json(ticket);
  } catch (error) {
    sendError(res, 400, "Failed to update status", error);
  }
});

// PATCH assign ticket
router.patch("/:id/assign", authMiddleware, async (req, res) => {
  try {
    const { assignedTo } = req.body;
    if (!assignedTo) {
      return res.status(400).json({ message: "Assigned user is required" });
    }

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
      { new: true, runValidators: true },
    ).populate(ticketPopulate);

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
});

router.post("/:id/comment", authMiddleware, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Comment text is required" });
    }

    const ticket = await Ticket.findByIdAndUpdate(
      req.params.id,
      {
        $push: {
          comments: {
            text: text.trim(),
            author: req.user.id,
          },
          activityLog: buildLogEntry(
            "comment",
            text.trim(),
            req.user.id,
          ),
        },
        updatedBy: req.user.id,
      },
      { new: true, runValidators: true },
    ).populate(ticketPopulate);

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    res.json(ticket);
  } catch (error) {
    sendError(res, 400, "Failed to add comment", error);
  }
});

router.post(
  "/:id/attachments",
  authMiddleware,
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const attachment = {
        filename: req.file.filename,
        originalName: req.file.originalname,
        url: `/uploads/${req.file.filename}`,
        uploadedBy: req.user.id,
      };

      const ticket = await Ticket.findByIdAndUpdate(
        req.params.id,
        {
          $push: {
            attachments: attachment,
            activityLog: buildLogEntry(
              "attachment",
              `Uploaded ${req.file.originalname}`,
              req.user.id,
            ),
          },
          updatedBy: req.user.id,
        },
        { new: true, runValidators: true },
      ).populate(ticketPopulate);

      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }

      res.json(ticket);
    } catch (error) {
      sendError(res, 400, "Failed to upload attachment", error);
    }
  },
);

// DELETE ticket
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const ticket = await Ticket.findByIdAndDelete(req.params.id);

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    res.json({ message: "Ticket deleted" });
  } catch (error) {
    sendError(res, 400, "Failed to delete ticket", error);
  }
});

module.exports = router;
