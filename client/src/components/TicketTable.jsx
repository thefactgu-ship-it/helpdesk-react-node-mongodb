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
  updatePriority,
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
    <section className="mt-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950 md:p-6">
      <h3 className="mb-4 font-bold">Recent Tickets</h3>

      <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <input
          type="text"
          placeholder="Search tickets..."
          value={search}
          disabled={loading}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 md:w-80"
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

      <div className="space-y-3 md:hidden">
        {loading ? (
          <>
            <MobileTicketSkeleton />
            <MobileTicketSkeleton />
            <MobileTicketSkeleton />
          </>
        ) : (
          tickets.map((ticket) => {
            const isUpdating = updatingTicketId === ticket._id;
            const isAssigning = assigningTicketId === ticket._id;
            const isDeleting = deletingTicketId === ticket._id;
            const isBusy = isUpdating || isAssigning || isDeleting;

            return (
              <TicketMobileCard
                key={ticket._id}
                assignTicket={assignTicket}
                assignableUsers={assignableUsers}
                canManageTickets={canManageTickets}
                canUpdateStatus={canUpdateTicketStatus(ticket)}
                deleteTicket={deleteTicket}
                isAssigning={isAssigning}
                isBusy={isBusy}
                isDeleting={isDeleting}
                onViewTicket={onViewTicket}
                ticket={ticket}
                updateStatus={updateStatus}
                updatePriority={updatePriority}
              />
            );
          })
        )}

        {!loading && tickets.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-700">
            No tickets found
          </div>
        )}

        <PaginationControls
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          totalPages={totalPages}
        />
      </div>

      <div className="hidden overflow-x-auto md:block">
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
                    <td className="py-4 font-semibold text-blue-700">
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
                      <div className="flex flex-wrap gap-2">
                        {canManageTickets ? (
                          <ThemedSelect
                            className="w-32"
                            compactOptions
                            menuWidth={150}
                            size="sm"
                            value={ticket.priority}
                            disabled={isBusy}
                            onChange={(value) => updatePriority(ticket._id, value)}
                            options={priorityOptions}
                          />
                        ) : (
                          <Badge text={ticket.priority} />
                        )}
                        {ticket.criticalRequested && (
                          <Badge text="Critical review requested" />
                        )}
                      </div>
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
        <PaginationControls
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          totalPages={totalPages}
        />
      </div>
    </section>
  );
}

function TicketMobileCard({
  assignTicket,
  assignableUsers,
  canManageTickets,
  canUpdateStatus,
  deleteTicket,
  isAssigning,
  isBusy,
  isDeleting,
  onViewTicket,
  ticket,
  updateStatus,
  updatePriority,
}) {
  return (
    <article className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide text-blue-600 dark:text-blue-300">
            {ticket.ticketNumber}
          </p>
          <h4 className="mt-1 break-words text-base font-black text-slate-950 dark:text-white">
            {ticket.title}
          </h4>
          <p className="mt-1 break-words text-sm text-slate-500 dark:text-slate-400">
            {ticket.category} / {ticket.departmentName || ticket.department}
            {ticket.requester ? ` / ${ticket.requester}` : ""}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          {canManageTickets ? (
            <ThemedSelect
              compactOptions
              size="sm"
              value={ticket.priority}
              disabled={isBusy}
              onChange={(value) => updatePriority(ticket._id, value)}
              options={priorityOptions}
            />
          ) : (
            <Badge text={ticket.priority} />
          )}
          {ticket.criticalRequested && (
            <Badge text="Critical review requested" />
          )}
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <MobileMeta label="Due" value={ticket.dueDate ? new Date(ticket.dueDate).toLocaleDateString() : "-"} />
        <MobileMeta label="Assigned" value={ticket.assignedTo?.name || "Unassigned"} />
      </dl>

      <div className="mt-4 grid gap-3">
        {canUpdateStatus ? (
          <ThemedSelect
            compactOptions
            size="sm"
            value={ticket.status}
            disabled={isBusy}
            onChange={(value) => updateStatus(ticket._id, value)}
            options={statusOptions.filter((option) => option.value !== "all")}
          />
        ) : (
          <Badge text={ticket.status} />
        )}

        {canManageTickets && (
          <ThemedSelect
            compactOptions
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
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => onViewTicket(ticket._id)}
          className="rounded-xl bg-slate-200 px-4 py-2.5 text-sm font-bold text-slate-800 transition hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
        >
          View
        </button>
        {canManageTickets && (
          <button
            type="button"
            onClick={() => deleteTicket(ticket._id)}
            disabled={isBusy}
            className="rounded-xl bg-rose-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:bg-rose-300"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
        )}
      </div>
    </article>
  );
}

function MobileMeta({ label, value }) {
  return (
    <div className="rounded-lg bg-white p-3 dark:bg-slate-950">
      <dt className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
        {label}
      </dt>
      <dd className="mt-1 break-words font-semibold text-slate-800 dark:text-slate-100">
        {value}
      </dd>
    </div>
  );
}

function MobileTicketSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="h-3 w-24 rounded bg-slate-200 dark:bg-slate-700" />
      <div className="mt-3 h-5 w-3/4 rounded bg-slate-200 dark:bg-slate-700" />
      <div className="mt-2 h-4 w-full rounded bg-slate-200 dark:bg-slate-700" />
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="h-16 rounded bg-slate-200 dark:bg-slate-700" />
        <div className="h-16 rounded bg-slate-200 dark:bg-slate-700" />
      </div>
    </div>
  );
}

function PaginationControls({ currentPage, setCurrentPage, totalPages }) {
  if (totalPages <= 1) return null;

  return (
    <div className="mt-5 flex items-center justify-between gap-3">
      <button
        type="button"
        disabled={currentPage === 1}
        onClick={() => setCurrentPage(currentPage - 1)}
        className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold disabled:opacity-40 dark:border-slate-700"
      >
        Previous
      </button>

      <span className="text-sm text-slate-500 dark:text-slate-400">
        Page {currentPage} of {totalPages}
      </span>

      <button
        type="button"
        disabled={currentPage === totalPages}
        onClick={() => setCurrentPage(currentPage + 1)}
        className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold disabled:opacity-40 dark:border-slate-700"
      >
        Next
      </button>
    </div>
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

const priorityOptions = [
  { value: "low", label: "Low", prefix: "L" },
  { value: "medium", label: "Medium", prefix: "M" },
  { value: "high", label: "High", prefix: "H" },
  { value: "critical", label: "Critical", prefix: "C" },
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
