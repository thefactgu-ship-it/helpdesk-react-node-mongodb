const express = require("express");
const Ticket = require("../models/Ticket");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

function sendError(res, statusCode, message, error) {
  res.status(statusCode).json({
    message: error?.message || message,
  });
}

// GET all tickets
router.get("/", authMiddleware, async (req, res) => {
  try {
    const tickets = await Ticket.find().sort({ createdAt: -1 });
    res.json(tickets);
  } catch (error) {
    sendError(res, 500, "Failed to fetch tickets", error);
  }
});

// POST create ticket
router.post("/", authMiddleware, async (req, res) => {
  try {
    const ticket = await Ticket.create(req.body);
    res.status(201).json(ticket);
  } catch (error) {
    sendError(res, 400, "Failed to create ticket", error);
  }
});

// PATCH update status
router.patch("/:id/status", authMiddleware, async (req, res) => {
  try {
    if (!["open", "in_progress", "closed"].includes(req.body.status)) {
      return res.status(400).json({ message: "Invalid ticket status" });
    }

    const ticket = await Ticket.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true, runValidators: true }
    );

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    res.json(ticket);
  } catch (error) {
    sendError(res, 400, "Failed to update status", error);
  }
});

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
