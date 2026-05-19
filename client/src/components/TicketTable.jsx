import { useEffect, useMemo, useState } from "react";
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
  ticketsPerPage = 5,
  onViewTicket,
  currentUser,
  users = [],
  t,
}) {
  const [activeQueue, setActiveQueue] = useState("now");
  const canManageTickets = ["GroupAdmin", "Admin", "RegionalManager", "HotelAdmin", "Manager"].includes(currentUser?.role);
  const isRequester = currentUser?.role === "User";
  const requesterText = getRequesterQueueText(t);
  const assignableUsers = users.filter((user) =>
    ["admin", "manager", "agent", "staff"].includes(
      String(user.role || "").toLowerCase(),
    ),
  );
  const currentUserId = getEntityId(currentUser);
  const queueOptions = useMemo(
    () => buildQueueOptions(tickets, currentUserId, t, isRequester),
    [currentUserId, isRequester, tickets, t],
  );
  const queueTickets = useMemo(
    () => tickets.filter((ticket) => matchesQueue(ticket, activeQueue, currentUserId, isRequester)),
    [activeQueue, currentUserId, isRequester, tickets],
  );
  const totalPages = Math.max(1, Math.ceil(queueTickets.length / ticketsPerPage));
  const visibleTickets = queueTickets.slice(
    (currentPage - 1) * ticketsPerPage,
    currentPage * ticketsPerPage,
  );
  const statusOptions = buildStatusOptions(t);
  const priorityOptions = buildPriorityOptions(t);
  const canUpdateTicketStatus = (ticket) =>
    canManageTickets ||
    (currentUser?.role === "Agent" && getEntityId(ticket.assignedTo) === currentUserId);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, setCurrentPage, totalPages]);

  useEffect(() => {
    const validQueueIds = queueOptions.map((queue) => queue.id);
    const preferredQueue = isRequester ? "mine" : "now";
    if (!validQueueIds.includes(activeQueue)) {
      setActiveQueue(preferredQueue);
      setCurrentPage(1);
    }
  }, [activeQueue, isRequester, queueOptions, setCurrentPage]);

  const handleQueueChange = (queueId) => {
    setActiveQueue(queueId);
    setCurrentPage(1);
  };

  return (
    <section className="mt-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950 md:p-6">
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-black text-slate-900 dark:text-white">
            {isRequester ? requesterText.heading : t("queue.heading")}
          </p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {isRequester ? requesterText.description : t("queue.description")}
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            placeholder={t("queue.searchPlaceholder")}
            value={search}
            disabled={loading}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 md:w-80"
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
      </div>

      <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
        {queueOptions.map((queue) => {
          const active = activeQueue === queue.id;
          return (
            <button
              key={queue.id}
              type="button"
              onClick={() => handleQueueChange(queue.id)}
              className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-xs font-bold transition ${
                active
                  ? `${queue.activeClass} shadow-sm`
                  : "border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
              }`}
            >
              <span>{queue.label}</span>
              <span className={`rounded-full px-2 py-0.5 ${active ? "bg-white/25" : "bg-slate-100 dark:bg-slate-800"}`}>
                {queue.count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="space-y-3 md:hidden">
        {loading ? (
          <>
            <MobileTicketSkeleton />
            <MobileTicketSkeleton />
            <MobileTicketSkeleton />
          </>
        ) : (
          visibleTickets.map((ticket) => {
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
                canViewTicket={canManageTickets || canViewTicketDetails(ticket, currentUserId)}
                deleteTicket={deleteTicket}
                isAssigning={isAssigning}
                isBusy={isBusy}
                isDeleting={isDeleting}
                onViewTicket={onViewTicket}
                priorityOptions={priorityOptions}
                statusOptions={statusOptions}
                t={t}
                ticket={ticket}
                updateStatus={updateStatus}
                updatePriority={updatePriority}
              />
            );
          })
        )}

        {!loading && queueTickets.length === 0 && (
          <QueueEmptyState activeQueue={activeQueue} t={t} />
        )}

        <PaginationControls
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          t={t}
          totalPages={totalPages}
        />
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-700 dark:text-slate-400">
              <th className="py-3 font-semibold">{t("queue.ticketNumber")}</th>
              <th className="font-semibold">{t("queue.issue")}</th>
              <th className="font-semibold">{t("queue.priority")}</th>
              <th className="font-semibold">{t("queue.statusLabel")}</th>
              <th className="font-semibold">{t("queue.assign")}</th>
              <th className="font-semibold">{t("queue.due")}</th>
              <th className="font-semibold">{t("queue.action")}</th>
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
              visibleTickets.map((ticket) => {
                const isUpdating = updatingTicketId === ticket._id;
                const isAssigning = assigningTicketId === ticket._id;
                const isDeleting = deletingTicketId === ticket._id;
                const isBusy = isUpdating || isAssigning || isDeleting;
                const canOpenDetails = canManageTickets || canViewTicketDetails(ticket, currentUserId);

                return (
                  <tr
                    key={ticket._id}
                    className="border-b last:border-0 dark:border-slate-700"
                  >
                    <td className="py-4 font-semibold text-blue-700">
                      {ticket.ticketNumber}
                    </td>
                    <td className="py-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-slate-900 dark:text-white">{ticket.title}</span>
                        {getQueueBadges(ticket, t).map((badge) => (
                          <StatusPill key={badge.label} {...badge} />
                        ))}
                        {isRequester && !canViewTicketDetails(ticket, currentUserId) && (
                          <StatusPill label={requesterText.departmentSummary} tone="neutral" />
                        )}
                      </div>
                      <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
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
                          <Badge text={getPriorityLabel(ticket.priority, t)} />
                        )}
                        {ticket.criticalRequested && (
                          <StatusPill label={t("queue.criticalReview")} tone="warning" />
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
                        <Badge text={getStatusLabel(ticket.status, t)} />
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
                          emptyLabel={isAssigning ? t("addTicket.assigning") : t("common.unassigned")}
                          onChange={(value) => assignTicket(ticket._id, value)}
                          options={[
                            { value: "", label: isAssigning ? t("addTicket.assigning") : t("common.unassigned"), prefix: "-" },
                            ...assignableUsers.map((user) => ({
                              value: user._id || user.id,
                              label: user.name,
                              meta: user.role,
                              prefix: getInitials(user.name),
                            })),
                          ]}
                        />
                      ) : (
                        ticket.assignedTo?.name || t("common.unassigned")
                      )}
                    </td>
                    <td className="text-slate-500 dark:text-slate-400">
                      <DueLabel ticket={ticket} />
                    </td>
                    <td className="space-x-2 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onViewTicket(ticket._id)}
                        disabled={!canOpenDetails}
                        className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                      >
                        {canOpenDetails ? t("common.view") : requesterText.summaryOnly}
                      </button>
                      {canManageTickets && (
                        <button
                          type="button"
                          onClick={() => deleteTicket(ticket._id)}
                          disabled={isBusy}
                          className="rounded-lg bg-rose-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:bg-rose-300"
                        >
                          {isDeleting ? t("common.deleting") : t("common.delete")}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}

            {!loading && queueTickets.length === 0 && (
              <tr>
                <td colSpan="7" className="py-8">
                  <QueueEmptyState activeQueue={activeQueue} t={t} />
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <PaginationControls
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          t={t}
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
  canViewTicket,
  deleteTicket,
  isAssigning,
  isBusy,
  isDeleting,
  onViewTicket,
  priorityOptions,
  statusOptions,
  t,
  ticket,
  updateStatus,
  updatePriority,
}) {
  return (
    <article className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold text-blue-600 dark:text-blue-300">
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
            <Badge text={getPriorityLabel(ticket.priority, t)} />
          )}
          {ticket.criticalRequested && (
            <StatusPill label={t("queue.criticalReview")} tone="warning" />
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {getQueueBadges(ticket, t).map((badge) => (
          <StatusPill key={badge.label} {...badge} />
        ))}
        {!canViewTicket && (
          <StatusPill label={getRequesterQueueText(t).departmentSummary} tone="neutral" />
        )}
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <MobileMeta label={t("queue.due")} value={<DueLabel ticket={ticket} />} />
        <MobileMeta label={t("queue.assign")} value={ticket.assignedTo?.name || t("common.unassigned")} />
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
          <Badge text={getStatusLabel(ticket.status, t)} />
        )}

        {canManageTickets && (
          <ThemedSelect
            compactOptions
            size="sm"
            value={ticket.assignedTo?._id || ""}
            disabled={isBusy || !assignableUsers.length}
            emptyLabel={isAssigning ? t("addTicket.assigning") : t("common.unassigned")}
            onChange={(value) => assignTicket(ticket._id, value)}
            options={[
              { value: "", label: isAssigning ? t("addTicket.assigning") : t("common.unassigned"), prefix: "-" },
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
          disabled={!canViewTicket}
          className="rounded-xl bg-slate-200 px-4 py-2.5 text-sm font-bold text-slate-800 transition hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
        >
          {canViewTicket ? t("common.view") : getRequesterQueueText(t).summaryOnly}
        </button>
        {canManageTickets && (
          <button
            type="button"
            onClick={() => deleteTicket(ticket._id)}
            disabled={isBusy}
            className="rounded-xl bg-rose-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:bg-rose-300"
          >
            {isDeleting ? t("common.deleting") : t("common.delete")}
          </button>
        )}
      </div>
    </article>
  );
}

function MobileMeta({ label, value }) {
  return (
    <div className="rounded-lg bg-white p-3 dark:bg-slate-950">
      <dt className="text-[11px] font-bold text-slate-400">
        {label}
      </dt>
      <dd className="mt-1 break-words font-semibold text-slate-800 dark:text-slate-100">
        {value}
      </dd>
    </div>
  );
}

function QueueEmptyState({ activeQueue, t }) {
  const message = getEmptyQueueMessage(activeQueue, t);

  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center dark:border-slate-700 dark:bg-slate-900">
      <p className="font-bold text-slate-800 dark:text-slate-100">{message.title}</p>
      <p className="mx-auto mt-1 max-w-md text-sm text-slate-500 dark:text-slate-400">
        {message.description}
      </p>
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

function PaginationControls({ currentPage, setCurrentPage, totalPages, t }) {
  if (totalPages <= 1) return null;

  return (
    <div className="mt-5 flex items-center justify-between gap-3">
      <button
        type="button"
        disabled={currentPage === 1}
        onClick={() => setCurrentPage(currentPage - 1)}
        className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold disabled:opacity-40 dark:border-slate-700"
      >
        {t("queue.previous")}
      </button>

      <span className="text-sm text-slate-500 dark:text-slate-400">
        {t("queue.page", { current: currentPage, total: totalPages })}
      </span>

      <button
        type="button"
        disabled={currentPage === totalPages}
        onClick={() => setCurrentPage(currentPage + 1)}
        className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold disabled:opacity-40 dark:border-slate-700"
      >
        {t("queue.next")}
      </button>
    </div>
  );
}

function DueLabel({ ticket }) {
  if (!ticket.dueDate) return "-";

  const dueDate = new Date(ticket.dueDate);
  const formatted = dueDate.toLocaleDateString();

  if (isOverdue(ticket)) {
    return <span className="font-bold text-rose-600 dark:text-rose-300">{formatted}</span>;
  }
  if (isDueSoon(ticket)) {
    return <span className="font-bold text-amber-600 dark:text-amber-300">{formatted}</span>;
  }
  return formatted;
}

function StatusPill({ label, tone = "info" }) {
  const className = {
    danger: "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-200 dark:ring-rose-400/20",
    warning: "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-200 dark:ring-amber-400/20",
    info: "bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-500/10 dark:text-blue-200 dark:ring-blue-400/20",
    neutral: "bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700",
  }[tone];

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ${className}`}>
      {label}
    </span>
  );
}

function buildQueueOptions(tickets, currentUserId, t, isRequester) {
  const count = (queueId) =>
    tickets.filter((ticket) => matchesQueue(ticket, queueId, currentUserId, isRequester)).length;

  if (isRequester) {
    const requesterText = getRequesterQueueText(t);
    return [
      { id: "mine", label: requesterText.tabs.mine, count: count("mine"), activeClass: "border-blue-600 bg-blue-600 text-white" },
      { id: "department", label: requesterText.tabs.department, count: count("department"), activeClass: "border-sky-600 bg-sky-600 text-white" },
      { id: "feedback", label: requesterText.tabs.feedback, count: count("feedback"), activeClass: "border-amber-500 bg-amber-500 text-white" },
      { id: "all", label: requesterText.tabs.all, count: count("all"), activeClass: "border-blue-600 bg-blue-600 text-white" },
    ];
  }

  return [
    { id: "now", label: t("queue.tabs.now"), count: count("now"), activeClass: "border-blue-600 bg-blue-600 text-white" },
    { id: "overdue", label: t("queue.tabs.overdue"), count: count("overdue"), activeClass: "border-rose-600 bg-rose-600 text-white" },
    { id: "dueSoon", label: t("queue.tabs.dueSoon"), count: count("dueSoon"), activeClass: "border-amber-500 bg-amber-500 text-white" },
    { id: "unassigned", label: t("queue.tabs.unassigned"), count: count("unassigned"), activeClass: "border-sky-600 bg-sky-600 text-white" },
    { id: "assignedToMe", label: t("queue.tabs.assignedToMe"), count: count("assignedToMe"), activeClass: "border-blue-600 bg-blue-600 text-white" },
    { id: "waitingRequester", label: t("queue.tabs.waitingRequester"), count: count("waitingRequester"), activeClass: "border-slate-700 bg-slate-700 text-white" },
    { id: "all", label: t("queue.tabs.all"), count: count("all"), activeClass: "border-blue-600 bg-blue-600 text-white" },
  ];
}

function matchesQueue(ticket, queueId, currentUserId, isRequester = false) {
  if (isRequester) {
    if (queueId === "department") return !canViewTicketDetails(ticket, currentUserId) && !isCompleted(ticket);
    if (queueId === "feedback") return canViewTicketDetails(ticket, currentUserId) && isWaitingRequester(ticket);
    if (queueId === "all") return true;
    return canViewTicketDetails(ticket, currentUserId);
  }

  if (queueId === "all") return true;
  if (queueId === "overdue") return isOverdue(ticket);
  if (queueId === "dueSoon") return isDueSoon(ticket);
  if (queueId === "unassigned") return !isCompleted(ticket) && !ticket.assignedTo;
  if (queueId === "assignedToMe") {
    return !isCompleted(ticket) && getEntityId(ticket.assignedTo) === currentUserId;
  }
  if (queueId === "waitingRequester") return isWaitingRequester(ticket);
  return (
    isOverdue(ticket) ||
    isDueSoon(ticket) ||
    (!isCompleted(ticket) && !ticket.assignedTo) ||
    (!isCompleted(ticket) && getEntityId(ticket.assignedTo) === currentUserId)
  );
}

function getQueueBadges(ticket, t) {
  const badges = [];
  if (isOverdue(ticket)) badges.push({ label: t("queue.badges.overdue"), tone: "danger" });
  else if (isDueSoon(ticket)) badges.push({ label: t("queue.badges.dueSoon"), tone: "warning" });
  if (!isCompleted(ticket) && !ticket.assignedTo) badges.push({ label: t("queue.badges.unassigned"), tone: "info" });
  if (isWaitingRequester(ticket)) badges.push({ label: t("queue.badges.waitingRequester"), tone: "neutral" });
  return badges;
}

function getEmptyQueueMessage(activeQueue, t) {
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

function buildStatusOptions(t) {
  return [
    { value: "all", label: t("queue.status.all"), prefix: "A" },
    { value: "open", label: t("queue.status.open"), prefix: "O" },
    { value: "in_progress", label: t("queue.status.in_progress"), prefix: "IP" },
    { value: "resolved", label: t("queue.status.resolved"), prefix: "R" },
    { value: "closed", label: t("queue.status.closed"), prefix: "C" },
  ];
}

function buildPriorityOptions(t) {
  return [
    { value: "low", label: t("addTicket.priorities.low"), prefix: "L" },
    { value: "medium", label: t("addTicket.priorities.medium"), prefix: "M" },
    { value: "high", label: t("addTicket.priorities.high"), prefix: "H" },
    { value: "critical", label: t("addTicket.priorities.critical"), prefix: "C" },
  ];
}

function getStatusLabel(status, t) {
  return t(`queue.status.${status}`) || status;
}

function getPriorityLabel(priority, t) {
  return t(`addTicket.priorities.${priority}`) || priority;
}

function isCompleted(ticket) {
  return ["resolved", "closed"].includes(ticket.status);
}

function isOverdue(ticket) {
  if (!ticket.dueDate || isCompleted(ticket)) return false;
  return new Date(ticket.dueDate).getTime() < Date.now();
}

function isDueSoon(ticket) {
  if (!ticket.dueDate || isCompleted(ticket) || isOverdue(ticket)) return false;
  const diff = new Date(ticket.dueDate).getTime() - Date.now();
  return diff <= 4 * 60 * 60 * 1000;
}

function isWaitingRequester(ticket) {
  return ["resolved", "closed"].includes(ticket.status) && !ticket.satisfactionScore;
}

function getEntityId(entity) {
  return String(entity?._id || entity?.id || entity || "");
}

function getRequesterQueueText(t) {
  return {
    departmentSummary: pickText(t, "queue.badges.departmentSummary", "Visible to prevent duplicate reports"),
    description: pickText(t, "queue.requesterDescription", "Review your tickets and active department tickets before reporting a duplicate."),
    heading: pickText(t, "queue.requesterHeading", "Related Tickets"),
    summaryOnly: pickText(t, "queue.summaryOnly", "Summary only"),
    tabs: {
      all: pickText(t, "queue.userTabs.all", "All related"),
      department: pickText(t, "queue.userTabs.department", "Department"),
      feedback: pickText(t, "queue.userTabs.feedback", "Feedback"),
      mine: pickText(t, "queue.userTabs.mine", "Mine"),
    },
  };
}

function pickText(t, key, fallback) {
  const value = t?.(key);
  return value && value !== key ? value : fallback;
}

function canViewTicketDetails(ticket, currentUserId) {
  if (ticket.requesterScope === "department") return false;
  return (
    getEntityId(ticket.createdBy) === currentUserId ||
    getEntityId(ticket.requesterUserId) === currentUserId ||
    getEntityId(ticket.assignedTo) === currentUserId
  );
}

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
