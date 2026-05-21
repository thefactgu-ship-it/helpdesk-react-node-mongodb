export function buildExecutiveReportInsights(tickets, stats = {}) {
  const topCategories = countBy(tickets, (ticket) => ticket.category || "General")
    .slice(0, 5)
    .map(toNameValue);
  const focusAreas = buildFocusAreas(tickets).slice(0, 5);
  const recurringIssues = buildRecurringIssues(tickets).slice(0, 6);

  return {
    focusAreas,
    managementInsights: buildManagementInsights({
      active: stats.active || 0,
      focusAreas,
      overdue: stats.overdue || 0,
      recurringIssues,
      resolved: stats.resolved || 0,
      successRate: stats.successRate || 0,
      topCategories,
      total: tickets.length,
    }),
    recurringIssues,
    topCategories,
  };
}

function buildFocusAreas(tickets) {
  return countBy(tickets, (ticket) => {
    const hotel = getTicketHotelName(ticket);
    const department = getTicketDepartmentName(ticket);
    return `${hotel} / ${department}`;
  }).map(([name, value]) => {
    const areaTickets = tickets.filter((ticket) => {
      return `${getTicketHotelName(ticket)} / ${getTicketDepartmentName(ticket)}` === name;
    });
    const overdue = areaTickets.filter(isOverdue).length;
    const urgent = areaTickets.filter((ticket) => ["critical", "high"].includes(ticket.priority)).length;

    return {
      name,
      overdue,
      urgent,
      value,
    };
  }).sort((a, b) => {
    return (b.overdue * 3 + b.urgent * 2 + b.value) - (a.overdue * 3 + a.urgent * 2 + a.value);
  });
}

function buildRecurringIssues(tickets) {
  return countBy(tickets, (ticket) => {
    const category = ticket.category || "General";
    const title = normalizeIssueTitle(ticket.title || ticket.subject || ticket.description || "");
    return title ? `${category} / ${title}` : category;
  })
    .filter(([, value]) => value > 1)
    .map(([name, value]) => ({ name, value }));
}

function buildManagementInsights({
  active,
  focusAreas,
  overdue,
  recurringIssues,
  resolved,
  successRate,
  topCategories,
  total,
}) {
  if (!total) {
    return ["No ticket data in this period yet."];
  }

  const insights = [];
  const topCategory = topCategories[0];
  const topFocus = focusAreas[0];
  const recurring = recurringIssues[0];

  if (topCategory) {
    insights.push(`${topCategory.name} is the largest problem area with ${topCategory.value} tickets.`);
  }

  if (topFocus) {
    const riskText = topFocus.overdue || topFocus.urgent
      ? `${topFocus.overdue} overdue / ${topFocus.urgent} urgent`
      : `${topFocus.value} tickets`;
    insights.push(`${topFocus.name} should be reviewed first (${riskText}).`);
  }

  if (recurring) {
    insights.push(`Recurring pattern detected: ${recurring.name} (${recurring.value} times).`);
  }

  if (resolved > 0) {
    insights.push(`${resolved} resolved tickets are waiting requester confirmation before closure.`);
  }

  if (overdue > 0) {
    insights.push(`${overdue} active tickets are overdue and may affect SLA perception.`);
  } else if (successRate >= 90) {
    insights.push("SLA performance is healthy; continue monitoring high-volume categories.");
  }

  if (active > 0 && insights.length < 4) {
    insights.push(`${active} tickets are still active and should stay visible in the work queue.`);
  }

  return insights.slice(0, 5);
}

function getTicketHotelName(ticket) {
  if (ticket.hotelId?.code && ticket.hotelId?.name) return `${ticket.hotelId.code} / ${ticket.hotelId.name}`;
  return ticket.hotelId?.name || ticket.hotelName || ticket.hotel || ticket.hotelCode || "No hotel";
}

function getTicketDepartmentName(ticket) {
  return ticket.departmentId?.name || ticket.departmentName || ticket.department || ticket.team || "No department";
}

function normalizeIssueTitle(value) {
  return value
    .toLowerCase()
    .replace(/#?\d+/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 56);
}

function countBy(items, getName) {
  return Object.entries(
    items.reduce((acc, item) => {
      const name = getName(item) || "General";
      acc[name] = (acc[name] || 0) + 1;
      return acc;
    }, {}),
  ).sort((a, b) => b[1] - a[1]);
}

function isOverdue(ticket) {
  if (!ticket.dueDate) return false;
  if (["resolved", "closed"].includes(ticket.status)) return false;
  return new Date() > new Date(ticket.dueDate);
}

function toNameValue([name, value]) {
  return { name, value };
}
