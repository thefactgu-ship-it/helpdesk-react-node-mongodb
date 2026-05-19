import TicketTable from "../components/TicketTable";

function TicketsPage({
  assigningTicketId,
  assignTicket,
  currentPage,
  deleteTicket,
  deletingTicketId,
  filterStatus,
  loading,
  onViewTicket,
  search,
  setCurrentPage,
  setFilterStatus,
  setSearch,
  tickets,
  ticketsPerPage,
  updatePriority,
  updateStatus,
  updatingTicketId,
  currentUser,
  users,
}) {
  return (
    <TicketTable
      assigningTicketId={assigningTicketId}
      assignTicket={assignTicket}
      tickets={tickets}
      loading={loading}
      search={search}
      setSearch={setSearch}
      filterStatus={filterStatus}
      setFilterStatus={setFilterStatus}
      updatingTicketId={updatingTicketId}
      deletingTicketId={deletingTicketId}
      updatePriority={updatePriority}
      updateStatus={updateStatus}
      deleteTicket={deleteTicket}
      currentPage={currentPage}
      setCurrentPage={setCurrentPage}
      ticketsPerPage={ticketsPerPage}
      onViewTicket={onViewTicket}
      currentUser={currentUser}
      users={users}
    />
  );
}

export default TicketsPage;
