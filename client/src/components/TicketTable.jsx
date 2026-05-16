import Badge from "./Badge";
import SkeletonRow from "./SkeletonRow";
import ThemedSelect from "./ThemedSelect";

function TicketTable({
  assigningTicketId,
  assignTicket,
  tickets,
  loading,
  search,
  setSearch,
  filterStatus,
  setFilterStatus,
  updatingTicketId,
  deletingTicketId,
  updateStatus,
  deleteTicket,
  currentPage,
  setCurrentPage,
  totalPages,
  onViewTicket,
  currentUser,
  users = [],
}) {
  const canManageTickets = ["GroupAdmin", "Admin", "RegionalManager", "HotelAdmin", "Manager"].includes(currentUser?.role);
  const assignableUsers = users.filter((user) =>
    ["admin", "manager", "agent", "staff"].includes(
      String(user.role || "").toLowerCase(),
    ),
  );
  const currentUserId = getEntityId(currentUser);
  const canUpdateTicketStatus = (ticket) =>
    canManageTickets ||
    (currentUser?.role === "Agent" && getEntityId(ticket.assignedTo) === currentUserId);

  return (
    <section className="mt-6 rounded-2xl bg-white p-6 shadow-lg dark:bg-slate-800">
      <h3 className="mb-4 font-bold">Recent Tickets</h3>

      <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <input
          type="text"
          placeholder="Search tickets..."
          value={search}
          disabled={loading}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-purple-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 md:w-80"
        />

        <ThemedSelect
          className="w-full md:w-56"
          size="sm"
          value={filterStatus}
          disabled={loading}
          onChange={setFilterStatus}
          options={statusOptions}
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b text-slate-500 dark:border-slate-700 dark:text-slate-400">
              <th className="py-3">Ticket #</th>
              <th>Title</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Assigned To</th>
              <th>Due</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <>
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
              </>
            ) : (
              tickets.map((ticket) => {
                const isUpdating = updatingTicketId === ticket._id;
                const isAssigning = assigningTicketId === ticket._id;
                const isDeleting = deletingTicketId === ticket._id;
                const isBusy = isUpdating || isAssigning || isDeleting;

                return (
                  <tr
                    key={ticket._id}
                    className="border-b last:border-0 dark:border-slate-700"
                  >
                    <td className="py-4 font-semibold text-purple-700">
                      {ticket.ticketNumber}
                    </td>
                    <td className="py-4">
                      <div className="font-semibold">{ticket.title}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {ticket.category} / {ticket.departmentName || ticket.department}
                        {ticket.requester ? ` / ${ticket.requester}` : ""}
                      </div>
                    </td>
                    <td>
                      <Badge text={ticket.priority} />
                    </td>
                    <td>
                      {canUpdateTicketStatus(ticket) ? (
                        <ThemedSelect
                          className="w-36"
                          compactOptions
                          menuWidth={160}
                          size="sm"
                          value={ticket.status}
                          disabled={isBusy}
                          onChange={(value) => updateStatus(ticket._id, value)}
                          options={statusOptions.filter((option) => option.value !== "all")}
                        />
                      ) : (
                        <Badge text={ticket.status} />
                      )}
                    </td>
                    <td className="text-slate-500 dark:text-slate-400">
                      {canManageTickets ? (
                        <ThemedSelect
                          className="w-40"
                          compactOptions
                          menuWidth={180}
                          size="sm"
                          value={ticket.assignedTo?._id || ""}
                          disabled={isBusy || !assignableUsers.length}
                          emptyLabel={isAssigning ? "Assigning..." : "Unassigned"}
                          onChange={(value) => assignTicket(ticket._id, value)}
                          options={[
                            { value: "", label: isAssigning ? "Assigning..." : "Unassigned", prefix: "-" },
                            ...assignableUsers.map((user) => ({
                              value: user._id || user.id,
                              label: user.name,
                              meta: user.role,
                              prefix: getInitials(user.name),
                            })),
                          ]}
                        />
                      ) : (
                        ticket.assignedTo?.name || "Unassigned"
                      )}
                    </td>
                    <td className="text-slate-500 dark:text-slate-400">
                      {ticket.dueDate
                        ? new Date(ticket.dueDate).toLocaleDateString()
                        : "-"}
                    </td>
                    <td className="space-x-2">
                      <button
                        onClick={() => onViewTicket(ticket._id)}
                        className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
                      >
                        View
                      </button>
                      {canManageTickets && (
                        <button
                          onClick={() => deleteTicket(ticket._id)}
                          disabled={isBusy}
                          className="rounded-lg bg-red-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:bg-red-300"
                        >
                          {isDeleting ? "Deleting..." : "Delete"}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}

            {!loading && tickets.length === 0 && (
              <tr>
                <td colSpan="7" className="py-8 text-center text-slate-500">
                  No tickets found
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {totalPages > 1 && (
          <div className="mt-5 flex items-center justify-between">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
              className="rounded-lg border px-4 py-2 text-sm disabled:opacity-40 dark:border-slate-700"
            >
              Previous
            </button>

            <span className="text-sm text-slate-500 dark:text-slate-400">
              Page {currentPage} of {totalPages}
            </span>

            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
              className="rounded-lg border px-4 py-2 text-sm disabled:opacity-40 dark:border-slate-700"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

function getEntityId(entity) {
  return String(entity?._id || entity?.id || entity || "");
}

const statusOptions = [
  { value: "all", label: "All Status", prefix: "A" },
  { value: "open", label: "Open", prefix: "O" },
  { value: "in_progress", label: "In Progress", prefix: "IP" },
  { value: "resolved", label: "Resolved", prefix: "R" },
  { value: "closed", label: "Closed", prefix: "C" },
];

function getInitials(name) {
  return String(name || "U")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export default TicketTable;
