import { useMemo } from "react";

const ticketsPerPage = 5;

function includesKeyword(value, keyword) {
  return String(value || "").toLowerCase().includes(keyword);
}

export function useTicketFilters({ currentPage, filterStatus, search, tickets }) {
  return useMemo(() => {
    const keyword = search.trim().toLowerCase();
    const filteredTickets = tickets.filter((ticket) => {
      const matchesSearch =
        !keyword ||
        includesKeyword(ticket.title, keyword) ||
        includesKeyword(ticket.description, keyword) ||
        includesKeyword(ticket.category, keyword) ||
        includesKeyword(ticket.departmentName || ticket.department, keyword);

      const matchesStatus =
        filterStatus === "all" || ticket.status === filterStatus;

      return matchesSearch && matchesStatus;
    });

    const totalPages = Math.ceil(filteredTickets.length / ticketsPerPage);
    const paginatedTickets = filteredTickets.slice(
      (currentPage - 1) * ticketsPerPage,
      currentPage * ticketsPerPage,
    );

    return {
      filteredTickets,
      paginatedTickets,
      ticketsPerPage,
      totalPages,
    };
  }, [currentPage, filterStatus, search, tickets]);
}
