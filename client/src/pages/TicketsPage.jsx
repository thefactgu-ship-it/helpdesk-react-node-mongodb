import TicketTable from "../components/TicketTable";

function TicketsPage({
  assigningTicketId,
  assignTicket,
  claimTicket,
  addTicketComment,
  currentPage,
  deleteTicket,
  deletingTicketId,
  filterPriority,
  filterStatus,
  hotels,
  loading,
  onViewTicket,
  search,
  setCurrentPage,
  selectedHotelId,
  setFilterPriority,
  setFilterStatus,
  setSelectedHotelId,
  setSearch,
  tickets,
  ticketsPerPage,
  reopenTicket,
  updatePriority,
  updateDueDate,
  updateStatus,
  updatingTicketId,
  currentUser,
  users,
  t,
}) {
  return (
    <TicketTable
      assigningTicketId={assigningTicketId}
      assignTicket={assignTicket}
      claimTicket={claimTicket}
      addTicketComment={addTicketComment}
      tickets={tickets}
      loading={loading}
      search={search}
      setSearch={setSearch}
      filterStatus={filterStatus}
      setFilterStatus={setFilterStatus}
      updatingTicketId={updatingTicketId}
      deletingTicketId={deletingTicketId}
      filterPriority={filterPriority}
      updatePriority={updatePriority}
      updateDueDate={updateDueDate}
      updateStatus={updateStatus}
      deleteTicket={deleteTicket}
      hotels={hotels}
      currentPage={currentPage}
      setCurrentPage={setCurrentPage}
      selectedHotelId={selectedHotelId}
      setFilterPriority={setFilterPriority}
      ticketsPerPage={ticketsPerPage}
      reopenTicket={reopenTicket}
      onViewTicket={onViewTicket}
      setSelectedHotelId={setSelectedHotelId}
      currentUser={currentUser}
      users={users}
      t={t}
    />
  );
}

export default TicketsPage;
