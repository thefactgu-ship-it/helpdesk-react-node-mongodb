const Notification = require("../models/Notification");
const User = require("../models/User");
const { MANAGER_ROLES } = require("../constants");
const { emitNotifications } = require("./notificationStream");

function toId(value) {
  return String(value?._id || value || "");
}

function getTicketHotelId(ticket) {
  return toId(ticket?.hotelId);
}

function getTicketLabel(ticket) {
  return ticket?.ticketNumber || ticket?.title || "ticket";
}

function uniqueRecipientIds(ids, actorId) {
  const actor = toId(actorId);
  return [...new Set(ids.map(toId).filter(Boolean))].filter((id) => id !== actor);
}

async function createNotifications(recipients, payload, actorId) {
  const recipientIds = uniqueRecipientIds(recipients, actorId);
  if (!recipientIds.length) return [];

  const notifications = await Notification.insertMany(
    recipientIds.map((userId) => ({
      userId,
      hotelId: payload.hotelId,
      ticketId: payload.ticketId,
      type: payload.type,
      title: payload.title,
      message: payload.message,
    })),
    { ordered: false }
  );

  emitNotifications(notifications);
  return notifications;
}

async function findTicketManagers(ticket) {
  const hotelId = getTicketHotelId(ticket);
  if (!hotelId) return [];

  return User.find({
    role: { $in: MANAGER_ROLES },
    active: { $ne: false },
    $or: [{ hotelId }, { hotelAccess: hotelId }],
  }).select("_id");
}

function getTicketParticipantIds(ticket) {
  return [
    ticket?.createdBy,
    ticket?.requesterUserId,
    ticket?.assignedTo,
  ].map(toId);
}

async function notifyTicketCreated(ticket, actorId) {
  const managers = await findTicketManagers(ticket);

  return createNotifications(
    managers.map((user) => user._id),
    {
      hotelId: getTicketHotelId(ticket),
      ticketId: ticket._id,
      type: "ticket_created",
      title: "New ticket created",
      message: `${getTicketLabel(ticket)} / ${ticket.title}`,
    },
    actorId
  );
}

async function notifyTicketAssigned(ticket, actorId) {
  return createNotifications(
    [ticket?.assignedTo],
    {
      hotelId: getTicketHotelId(ticket),
      ticketId: ticket._id,
      type: "ticket_assigned",
      title: "Ticket assigned to you",
      message: `${getTicketLabel(ticket)} / ${ticket.title}`,
    },
    actorId
  );
}

async function notifyTicketStatusChanged(ticket, actorId) {
  return createNotifications(
    getTicketParticipantIds(ticket),
    {
      hotelId: getTicketHotelId(ticket),
      ticketId: ticket._id,
      type: "ticket_status_changed",
      title: "Ticket status updated",
      message: `${getTicketLabel(ticket)} changed to ${ticket.status}`,
    },
    actorId
  );
}

async function notifyTicketCommented(ticket, actorId) {
  return createNotifications(
    getTicketParticipantIds(ticket),
    {
      hotelId: getTicketHotelId(ticket),
      ticketId: ticket._id,
      type: "ticket_commented",
      title: "New ticket comment",
      message: `${getTicketLabel(ticket)} / ${ticket.title}`,
    },
    actorId
  );
}

async function notifySafely(fn, ...args) {
  try {
    await fn(...args);
  } catch (error) {
    console.error("[NOTIFICATION_ERROR]", error.message);
  }
}

module.exports = {
  notifySafely,
  notifyTicketAssigned,
  notifyTicketCommented,
  notifyTicketCreated,
  notifyTicketStatusChanged,
};
