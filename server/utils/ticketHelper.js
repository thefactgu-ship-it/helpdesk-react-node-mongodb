const { SLA_HOURS_MAP, DEFAULT_SLA_HOURS } = require("../constants");

/**
 * Generate unique ticket number based on date and random digits
 * Format: HD-YYYYMMDD-XXXX where XXXX is 4 random digits
 * @returns {string} Generated ticket number
 */
function generateTicketNumber() {
  const date = new Date();
  
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  
  const random = Math.floor(1000 + Math.random() * 9000);
  
  return `HD-${y}${m}${d}-${random}`;
}

/**
 * Get SLA hours based on ticket priority
 * @param {string} priority - Ticket priority level
 * @returns {number} SLA hours for the priority
 */
function getSlaHoursByPriority(priority) {
  return SLA_HOURS_MAP[priority] || DEFAULT_SLA_HOURS;
}

/**
 * Build activity log entry object
 * @param {string} action - Action type
 * @param {string} details - Action details
 * @param {string} userId - User ID who performed the action
 * @returns {Object} Activity log entry
 */
function buildLogEntry(action, details, userId) {
  return {
    action,
    details,
    user: userId,
  };
}

/**
 * Build monthly trend data for the last 6 months
 * @param {Array} tickets - Array of ticket objects
 * @returns {Array} Monthly trend with counts
 */
function buildMonthlyTrend(tickets) {
  const months = [];
  const today = new Date();
  
  // Generate last 6 months labels
  for (let i = 5; i >= 0; i -= 1) {
    const month = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const label = month.toLocaleString("default", { month: "short", year: "numeric" });
    months.push({ label, count: 0 });
  }
  
  // Count tickets per month
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

module.exports = {
  generateTicketNumber,
  getSlaHoursByPriority,
  buildLogEntry,
  buildMonthlyTrend,
};
