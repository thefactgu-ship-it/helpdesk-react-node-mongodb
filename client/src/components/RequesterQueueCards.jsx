import StatusPill from "./StatusPill";
import {
  canViewTicketDetails,
  getRequesterEmptyQueueMessage,
  getStatusLabel,
  isCompleted,
  isWaitingRequester,
} from "../utils/ticketQueueUtils";

function RequesterQueueCards({
  activeQueue,
  currentPage,
  currentUserId,
  loading,
  onViewTicket,
  queueTickets,
  requesterText,
  setCurrentPage,
  t,
  ticketsPerPage,
  visibleTickets,
}) {
  const totalPages = Math.max(1, Math.ceil(queueTickets.length / ticketsPerPage));

  if (loading) {
    return (
      <div className="grid gap-3 lg:grid-cols-2">
        <MobileTicketSkeleton />
        <MobileTicketSkeleton />
        <MobileTicketSkeleton />
        <MobileTicketSkeleton />
      </div>
    );
  }

  if (!queueTickets.length) {
    return (
      <RequesterEmptyState
        activeQueue={activeQueue}
        requesterText={requesterText}
      />
    );
  }

  return (
    <>
      <div className="grid gap-3 lg:grid-cols-2">
        {visibleTickets.map((ticket) => (
          <RequesterQueueCard
            key={ticket._id || ticket.id}
            canViewTicket={canViewTicketDetails(ticket, currentUserId)}
            onViewTicket={onViewTicket}
            requesterText={requesterText}
            t={t}
            ticket={ticket}
          />
        ))}
      </div>

      <PaginationControls
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        t={t}
        totalPages={totalPages}
      />
    </>
  );
}

function RequesterQueueCard({ canViewTicket, onViewTicket, requesterText, t, ticket }) {
  const summaryOnly = !canViewTicket;
  const statusLabel = getStatusLabel(ticket.status, t);
  const isActive = !isCompleted(ticket);
  const updatedLabel = ticket.updatedAt
    ? new Date(ticket.updatedAt).toLocaleDateString()
    : ticket.createdAt
      ? new Date(ticket.createdAt).toLocaleDateString()
      : "-";

  return (
    <article
      className={`ops-soft-card ${
        summaryOnly
          ? "border-amber-200/80 dark:border-amber-400/25"
          : ""
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-black text-purple-700 dark:text-purple-200">
            {ticket.ticketNumber}
          </p>
          <h4 className="mt-1 line-clamp-2 break-words text-base font-black text-slate-950 dark:text-white">
            {ticket.title}
          </h4>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-black ${
            isActive
              ? "bg-purple-50 text-purple-700 ring-1 ring-purple-200 dark:bg-purple-500/15 dark:text-purple-200 dark:ring-purple-400/20"
              : "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-200 dark:ring-emerald-400/20"
          }`}
        >
          {statusLabel}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {summaryOnly ? (
          <StatusPill label={requesterText.departmentSummary} tone="neutral" />
        ) : (
          <StatusPill label={requesterText.mineBadge} tone="info" />
        )}
        {isWaitingRequester(ticket) && (
          <StatusPill label={requesterText.feedbackBadge} tone="warning" />
        )}
        {ticket.criticalRequested && (
          <StatusPill label={t("queue.criticalReview")} tone="warning" />
        )}
      </div>

      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <RequesterMeta label={requesterText.categoryLabel} value={ticket.category || "-"} />
        <RequesterMeta label={requesterText.departmentLabel} value={ticket.departmentName || ticket.department || "-"} />
        <RequesterMeta label={requesterText.statusLabel} value={statusLabel} />
        <RequesterMeta label={requesterText.updatedLabel} value={updatedLabel} />
      </dl>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">
          {summaryOnly ? requesterText.summaryOnlyHelp : requesterText.ownTicketHelp}
        </p>
        {canViewTicket ? (
          <button
            type="button"
            onClick={() => onViewTicket(ticket._id)}
            className="ops-button-primary min-h-10 shrink-0 px-4 py-2 text-xs"
          >
            {t("common.view")}
          </button>
        ) : (
          <span className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 px-4 py-2 text-xs font-black text-slate-500 dark:bg-slate-900 dark:text-slate-400">
            {requesterText.summaryOnly}
          </span>
        )}
      </div>
    </article>
  );
}

function RequesterMeta({ label, value }) {
  return (
    <div className="rounded-lg border border-purple-100/70 bg-white/80 p-3 dark:border-purple-400/10 dark:bg-white/5">
      <dt className="text-[11px] font-bold text-slate-400">{label}</dt>
      <dd className="mt-1 break-words font-semibold text-slate-800 dark:text-slate-100">
        {value}
      </dd>
    </div>
  );
}

function RequesterEmptyState({ activeQueue, requesterText }) {
  const message = getRequesterEmptyQueueMessage(activeQueue, requesterText);

  return (
    <div className="ops-empty-state p-6">
      <div className="ops-icon-primary mx-auto grid h-10 w-10 place-items-center text-sm font-black">
        0
      </div>
      <p className="mt-3 font-bold text-slate-800 dark:text-slate-100">{message.title}</p>
      <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
        {message.description}
      </p>
    </div>
  );
}

function MobileTicketSkeleton() {
  return (
    <div className="ops-soft-card animate-pulse p-4">
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
    <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
      <button
        type="button"
        disabled={currentPage === 1}
        onClick={() => setCurrentPage(currentPage - 1)}
        className="ops-button-secondary px-4 py-2 text-sm font-semibold disabled:opacity-40"
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
        className="ops-button-secondary px-4 py-2 text-sm font-semibold disabled:opacity-40"
      >
        {t("queue.next")}
      </button>
    </div>
  );
}

export default RequesterQueueCards;
