export function getEntityId(entity) {
  return String(entity?._id || entity?.id || entity || "");
}

export function isOwnTicket(ticket, currentUserId) {
  if (ticket.requesterScope === "department") return false;
  return (
    getEntityId(ticket.createdBy) === currentUserId ||
    getEntityId(ticket.requesterUserId) === currentUserId ||
    getEntityId(ticket.assignedTo) === currentUserId
  );
}

export function isCompleted(ticket) {
  return ["resolved", "closed"].includes(ticket.status);
}

export function isWaitingFeedback(ticket) {
  return ticket.status === "resolved" && !ticket.satisfactionScore;
}

export function getTicketHotelId(ticket) {
  return getEntityId(ticket?.hotelId);
}

export function getHotelLabel(hotel) {
  if (!hotel) return "";
  if (typeof hotel === "string") return hotel;
  return [hotel.code, hotel.name].filter(Boolean).join(" / ") || getEntityId(hotel);
}

export function getTicketHotelLabel(ticket, fallback) {
  const hotel = ticket?.hotelId;
  if (hotel && typeof hotel === "object") return getHotelLabel(hotel) || fallback;
  return getTicketHotelId(ticket) || fallback;
}

export function getAssigneeName(ticket, fallback = "Unassigned") {
  if (!ticket?.assignedTo) return fallback;
  if (typeof ticket.assignedTo === "string") return ticket.assignedTo;
  return ticket.assignedTo.name || ticket.assignedTo.email || fallback;
}

export function hoursUntil(value, now = new Date()) {
  if (!value) return null;
  return Math.ceil((new Date(value) - now) / 3600000);
}

export function isTicketOverdue(ticket, now = new Date()) {
  if (isCompleted(ticket)) return false;
  if (ticket.isOverdue) return true;
  return ticket.dueDate ? new Date(ticket.dueDate) < now : false;
}

export function isTicketDueSoon(ticket, now = new Date()) {
  if (isCompleted(ticket) || !ticket.dueDate || isTicketOverdue(ticket, now)) return false;
  const remainingHours = hoursUntil(ticket.dueDate, now);
  return remainingHours !== null && remainingHours <= 4;
}

export function getTicketRiskRank(ticket, now = new Date()) {
  if (isTicketOverdue(ticket, now)) return 0;
  if (isTicketDueSoon(ticket, now)) return 1;
  if (!ticket.assignedTo && ticket.priority === "critical") return 2;
  if (!ticket.assignedTo && ticket.priority === "high") return 3;
  if (ticket.priority === "critical") return 4;
  if (ticket.priority === "high") return 5;
  return 99;
}

export function getTicketRiskLabel(ticket, now, text) {
  if (isTicketOverdue(ticket, now)) return text.overdueRisk;
  if (isTicketDueSoon(ticket, now)) return text.dueSoonRisk;
  if (!ticket.assignedTo && ["critical", "high"].includes(ticket.priority)) {
    return text.urgentUnassignedRisk;
  }
  return ["critical", "high"].includes(ticket.priority) ? text.urgentRisk : text.riskTickets;
}

export function getHotelStatusLabel(level, text) {
  if (level === "attention") return text.attention;
  if (level === "watch") return text.watch;
  return text.normal;
}

export function formatDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("th-TH", {
    day: "2-digit",
    month: "short",
  });
}

export function formatStatus(status = "") {
  return status.replace("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
}
