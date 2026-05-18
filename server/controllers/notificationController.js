const Notification = require("../models/Notification");

function getUserId(req) {
  return req.user?.id;
}

async function getNotifications(req, res) {
  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 50);
  const query = { userId: getUserId(req) };

  if (String(req.query.unreadOnly) === "true") {
    query.readAt = null;
  }

  const [notifications, unreadCount] = await Promise.all([
    Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate({ path: "ticketId", select: "ticketNumber title status category" }),
    Notification.countDocuments({ userId: getUserId(req), readAt: null }),
  ]);

  res.json({ data: notifications, unreadCount });
}

async function markNotificationRead(req, res) {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, userId: getUserId(req) },
    { readAt: new Date() },
    { returnDocument: "after" }
  );

  if (!notification) {
    return res.status(404).json({ message: "Notification not found" });
  }

  res.json(notification);
}

async function markAllNotificationsRead(req, res) {
  const result = await Notification.updateMany(
    { userId: getUserId(req), readAt: null },
    { readAt: new Date() }
  );

  res.json({ message: "Notifications marked as read", modifiedCount: result.modifiedCount });
}

module.exports = {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
};
