const WORK_FINISHED_STATUSES = new Set(["resolved", "closed"]);

export function isCompletedTicket(ticket) {
  return WORK_FINISHED_STATUSES.has(ticket.status);
}

export function getCompletionStats(tickets) {
  const total = tickets.length;
  const closedTickets = tickets.filter((ticket) => ticket.status === "closed");
  const waitingConfirmationTickets = tickets.filter((ticket) => ticket.status === "resolved");
  const successEligibleTickets = tickets.filter(
    (ticket) => ticket.resolvedAt && ticket.dueDate,
  );
  const successfulTickets = successEligibleTickets.filter(
    (ticket) => new Date(ticket.resolvedAt) <= new Date(ticket.dueDate),
  );
  const ratedTickets = tickets.filter((ticket) => Number(ticket.satisfactionScore) > 0);
  const satisfactionTotal = ratedTickets.reduce(
    (sum, ticket) => sum + Number(ticket.satisfactionScore),
    0,
  );

  return {
    completedCount: closedTickets.length,
    completionRate: total ? Math.round((closedTickets.length / total) * 100) : 0,
    closedCount: closedTickets.length,
    waitingConfirmationCount: waitingConfirmationTickets.length,
    successfulCount: successfulTickets.length,
    successEligibleCount: successEligibleTickets.length,
    successRate: successEligibleTickets.length
      ? Math.round((successfulTickets.length / successEligibleTickets.length) * 100)
      : 0,
    satisfactionCount: ratedTickets.length,
    avgSatisfactionScore: ratedTickets.length
      ? Number((satisfactionTotal / ratedTickets.length).toFixed(1))
      : 0,
  };
}

export function getSuccessDetail(stats) {
  return `${stats.successfulCount}/${stats.successEligibleCount || 0} on time`;
}
