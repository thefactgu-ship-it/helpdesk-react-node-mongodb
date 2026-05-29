export function buildExecutiveReportInsights(tickets, stats = {}, t = (key) => key) {
  const topCategories = countBy(tickets, (ticket) => ticket.category || t("reports.common.general"))
    .slice(0, 5)
    .map(toNameValue);
  const focusAreas = buildFocusAreas(tickets, t).slice(0, 5);
  const recurringIssues = buildRecurringIssues(tickets, t).slice(0, 6);

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
    }, t),
    recurringIssues,
    topCategories,
  };
}

function buildFocusAreas(tickets, t) {
  return countBy(tickets, (ticket) => {
    const hotel = getTicketHotelName(ticket, t);
    const department = getTicketDepartmentName(ticket, t);
    return `${hotel} / ${department}`;
  }).map(([name, value]) => {
    const areaTickets = tickets.filter((ticket) => {
      return `${getTicketHotelName(ticket, t)} / ${getTicketDepartmentName(ticket, t)}` === name;
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

function buildRecurringIssues(tickets, t) {
  return countBy(tickets, (ticket) => {
    const category = ticket.category || t("reports.common.general");
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
}, t) {
  if (!total) {
    return [t("reports.insights.noTicketData")];
  }

  const insights = [];
  const topCategory = topCategories[0];
  const topFocus = focusAreas[0];
  const recurring = recurringIssues[0];

  if (topCategory) {
    insights.push(t("reports.insights.topCategory", {
      count: topCategory.value,
      name: topCategory.name,
    }));
  }

  if (topFocus) {
    const riskText = topFocus.overdue || topFocus.urgent
      ? t("reports.insights.riskText", { overdue: topFocus.overdue, urgent: topFocus.urgent })
      : t("reports.insights.ticketCount", { count: topFocus.value });
    insights.push(t("reports.insights.topFocus", {
      name: topFocus.name,
      riskText,
    }));
  }

  if (recurring) {
    insights.push(t("reports.insights.recurring", {
      count: recurring.value,
      name: recurring.name,
    }));
  }

  if (resolved > 0) {
    insights.push(t("reports.insights.waitingConfirmation", { count: resolved }));
  }

  if (overdue > 0) {
    insights.push(t("reports.insights.overdue", { count: overdue }));
  } else if (successRate >= 90) {
    insights.push(t("reports.insights.healthySla"));
  }

  if (active > 0 && insights.length < 4) {
    insights.push(t("reports.insights.activeWork", { count: active }));
  }

  return insights.slice(0, 5);
}

function getTicketHotelName(ticket, t) {
  if (ticket.hotelId?.code && ticket.hotelId?.name) return `${ticket.hotelId.code} / ${ticket.hotelId.name}`;
  return ticket.hotelId?.name || ticket.hotelName || ticket.hotel || ticket.hotelCode || t("reports.common.noHotel");
}

function getTicketDepartmentName(ticket, t) {
  return ticket.departmentId?.name || ticket.departmentName || ticket.department || ticket.team || t("reports.common.noDepartment");
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
