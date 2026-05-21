export function getQueueBadges(ticket, t) {
  const badges = [];
  if (isOverdue(ticket)) badges.push({ label: t("queue.badges.overdue"), tone: "danger" });
  else if (isDueSoon(ticket)) badges.push({ label: t("queue.badges.dueSoon"), tone: "warning" });
  if (!isCompleted(ticket) && !ticket.assignedTo) badges.push({ label: t("queue.badges.unassigned"), tone: "info" });
  if (isWaitingRequester(ticket)) badges.push({ label: t("queue.badges.waitingRequester"), tone: "neutral" });
  return badges;
}

export function getGroupAdminRiskBadges(ticket, text, t) {
  const badges = [];
  if (isOverdue(ticket)) badges.push({ label: text.risk.overdue, tone: "danger" });
  else if (isDueSoon(ticket)) badges.push({ label: text.risk.dueSoon, tone: "warning" });
  if (!isCompleted(ticket) && !ticket.assignedTo && ["critical", "high"].includes(ticket.priority)) {
    badges.push({ label: text.risk.urgentUnassigned, tone: "warning" });
  } else if (!isCompleted(ticket) && !ticket.assignedTo) {
    badges.push({ label: text.risk.unassigned, tone: "info" });
  }
  if (!isCompleted(ticket) && ["critical", "high"].includes(ticket.priority)) {
    badges.push({ label: text.risk.urgent, tone: "warning" });
  }
  if (isWaitingRequester(ticket)) badges.push({ label: t("queue.badges.waitingRequester"), tone: "neutral" });
  if (ticket.criticalRequested) badges.push({ label: t("queue.criticalReview"), tone: "warning" });
  if (!badges.length) badges.push({ label: text.risk.normal, tone: "neutral" });
  return badges;
}

export function buildGroupAdminQueueKpis(tickets) {
  return {
    dueSoon: tickets.filter(isDueSoon).length,
    now: tickets.filter(isGroupAdminRiskTicket).length,
    overdue: tickets.filter(isOverdue).length,
    unassignedUrgent: tickets.filter(
      (ticket) => !isCompleted(ticket) && !ticket.assignedTo && ["critical", "high"].includes(ticket.priority),
    ).length,
  };
}

export function isGroupAdminRiskTicket(ticket) {
  return (
    isOverdue(ticket) ||
    isDueSoon(ticket) ||
    (!isCompleted(ticket) && !ticket.assignedTo && ["critical", "high"].includes(ticket.priority)) ||
    (!isCompleted(ticket) && ticket.priority === "critical")
  );
}

export function matchesGroupAdminOwnerFilter(ticket, ownerFilter) {
  if (!ownerFilter || ownerFilter === "all") return true;
  if (ownerFilter === "unassigned") return !ticket.assignedTo;
  return getEntityId(ticket.assignedTo) === ownerFilter;
}

export function buildGroupAdminOwnerOptions(tickets, users, text) {
  const ownerIds = new Set(
    tickets.map((ticket) => getEntityId(ticket.assignedTo)).filter(Boolean),
  );
  const owners = users
    .filter((user) => ownerIds.has(getEntityId(user)))
    .map((user) => ({
      value: getEntityId(user),
      label: user.name || user.email || getEntityId(user),
      meta: user.role,
      prefix: getInitials(user.name || user.email),
    }));

  return [
    { value: "all", label: text.allOwners, prefix: "A" },
    { value: "unassigned", label: text.unassignedOwner, prefix: "-" },
    ...owners,
  ];
}

export function buildAssignableOptions(assignableUsers, isAssigning, t) {
  return [
    { value: "", label: isAssigning ? t("addTicket.assigning") : t("common.unassigned"), prefix: "-" },
    ...assignableUsers.map((user) => ({
      value: user._id || user.id,
      label: user.name,
      meta: user.role,
      prefix: getInitials(user.name),
    })),
  ];
}

export function getAssignableUsersForTicket(assignableUsers, ticket) {
  const ticketHotelId = getEntityId(ticket?.hotelId);
  if (!ticketHotelId) return assignableUsers;

  return assignableUsers.filter((user) => {
    const primaryHotelId = getEntityId(user.hotelId);
    const hotelAccessIds = Array.isArray(user.hotelAccess)
      ? user.hotelAccess.map((hotel) => getEntityId(hotel)).filter(Boolean)
      : [];

    return primaryHotelId === ticketHotelId || hotelAccessIds.includes(ticketHotelId);
  });
}

export function getEmptyQueueMessage(activeQueue, t) {
  const keys = {
    now: ["nowTitle", "nowDescription"],
    overdue: ["overdueTitle", "overdueDescription"],
    dueSoon: ["dueSoonTitle", "dueSoonDescription"],
    unassigned: ["unassignedTitle", "unassignedDescription"],
    assignedToMe: ["assignedToMeTitle", "assignedToMeDescription"],
    waitingRequester: ["waitingRequesterTitle", "waitingRequesterDescription"],
    all: ["allTitle", "allDescription"],
  }[activeQueue] || ["allTitle", "allDescription"];

  return {
    title: t(`queue.empty.${keys[0]}`),
    description: t(`queue.empty.${keys[1]}`),
  };
}

export function buildStatusOptions(t) {
  return [
    { value: "all", label: t("queue.status.all"), prefix: "A" },
    { value: "open", label: t("queue.status.open"), prefix: "O" },
    { value: "in_progress", label: t("queue.status.in_progress"), prefix: "IP" },
    { value: "resolved", label: t("queue.status.resolved"), prefix: "R" },
    { value: "closed", label: t("queue.status.closed"), prefix: "C" },
  ];
}

export function buildPriorityOptions(t) {
  return [
    { value: "low", label: t("addTicket.priorities.low"), prefix: "L" },
    { value: "medium", label: t("addTicket.priorities.medium"), prefix: "M" },
    { value: "high", label: t("addTicket.priorities.high"), prefix: "H" },
    { value: "critical", label: t("addTicket.priorities.critical"), prefix: "C" },
  ];
}

export function getStatusLabel(status, t) {
  return t(`queue.status.${status}`) || status;
}

export function getPriorityLabel(priority, t) {
  return t(`addTicket.priorities.${priority}`) || priority;
}

export function isCompleted(ticket) {
  return ["resolved", "closed"].includes(ticket.status);
}

export function isOverdue(ticket) {
  if (!ticket.dueDate || isCompleted(ticket)) return false;
  return new Date(ticket.dueDate).getTime() < Date.now();
}

export function isDueSoon(ticket) {
  if (!ticket.dueDate || isCompleted(ticket) || isOverdue(ticket)) return false;
  const diff = new Date(ticket.dueDate).getTime() - Date.now();
  return diff <= 4 * 60 * 60 * 1000;
}

export function isWaitingRequester(ticket) {
  return ticket.status === "resolved" && !ticket.satisfactionScore;
}

export function getEntityId(entity) {
  return String(entity?._id || entity?.id || entity || "");
}

export function getTicketHotelLabel(ticket, fallback) {
  const hotel = ticket?.hotelId;
  if (!hotel) return fallback;
  if (typeof hotel === "string") return hotel;
  return [hotel.code, hotel.name].filter(Boolean).join(" / ") || getEntityId(hotel) || fallback;
}

export function getRequesterEmptyQueueMessage(activeQueue, requesterText) {
  return requesterText.empty[activeQueue] || requesterText.empty.all;
}

export function getGroupAdminEmptyQueueMessage(activeQueue, groupAdminText) {
  return groupAdminText.empty[activeQueue] || groupAdminText.empty.all;
}

export function canViewTicketDetails(ticket, currentUserId) {
  if (ticket.requesterScope === "department") return false;
  return (
    getEntityId(ticket.createdBy) === currentUserId ||
    getEntityId(ticket.requesterUserId) === currentUserId ||
    getEntityId(ticket.assignedTo) === currentUserId
  );
}

export function getInitials(name) {
  return String(name || "U")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}
