import Badge from "./Badge";
import QueueActionMenu from "./QueueActionMenu";
import SkeletonRow from "./SkeletonRow";
import StatusPill from "./StatusPill";
import {
  getGroupAdminEmptyQueueMessage,
  getGroupAdminRiskBadges,
  getPriorityLabel,
  getStatusLabel,
  getTicketHotelLabel,
  isDueSoon,
  isOverdue,
} from "../utils/ticketQueueUtils";

export function GroupAdminControlView({
  activeQueue,
  assigningTicketId,
  currentPage,
  deleteTicket,
  deletingTicketId,
  loading,
  onOpenDrawer,
  onViewTicket,
  openActionTicketId,
  queueTickets,
  setCurrentPage,
  setOpenActionTicketId,
  t,
  text,
  ticketsPerPage,
  updatingTicketId,
  visibleTickets,
}) {
  const totalPages = Math.max(1, Math.ceil(queueTickets.length / ticketsPerPage));

  if (loading) {
    return (
      <div className="space-y-3">
        <SkeletonRow />
        <SkeletonRow />
        <SkeletonRow />
      </div>
    );
  }

  if (!queueTickets.length) {
    return <GroupAdminEmptyState activeQueue={activeQueue} text={text} />;
  }

  return (
    <>
      <div className="space-y-3 2xl:hidden">
        {visibleTickets.map((ticket) => (
          <GroupAdminMobileControlCard
            key={ticket._id || ticket.id}
            assigningTicketId={assigningTicketId}
            deleteTicket={deleteTicket}
            deletingTicketId={deletingTicketId}
            onOpenDrawer={onOpenDrawer}
            onViewTicket={onViewTicket}
            openActionTicketId={openActionTicketId}
            t={t}
            text={text}
            ticket={ticket}
            updatingTicketId={updatingTicketId}
            setOpenActionTicketId={setOpenActionTicketId}
          />
        ))}
      </div>

      <div className="hidden overflow-x-auto 2xl:block">
        <table className="min-w-[78rem] w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
              <th className="px-3 py-3 font-black">{text.ticketColumn}</th>
              <th className="px-3 font-black">{text.hotelColumn}</th>
              <th className="px-3 font-black">{text.riskColumn}</th>
              <th className="px-3 font-black">{t("queue.priority")}</th>
              <th className="px-3 font-black">{t("queue.statusLabel")}</th>
              <th className="px-3 font-black">{text.ownerColumn}</th>
              <th className="px-3 font-black">{t("queue.due")}</th>
              <th className="px-3 font-black">{t("queue.action")}</th>
            </tr>
          </thead>
          <tbody>
            {visibleTickets.map((ticket) => (
              <GroupAdminControlRow
                key={ticket._id || ticket.id}
                assigningTicketId={assigningTicketId}
                deleteTicket={deleteTicket}
                deletingTicketId={deletingTicketId}
                onOpenDrawer={onOpenDrawer}
                onViewTicket={onViewTicket}
                openActionTicketId={openActionTicketId}
                t={t}
                text={text}
                ticket={ticket}
                updatingTicketId={updatingTicketId}
                setOpenActionTicketId={setOpenActionTicketId}
              />
            ))}
          </tbody>
        </table>
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

export function GroupAdminQueueKpis({ kpis, text }) {
  const items = [
    { label: text.kpiNow, value: kpis.now, tone: kpis.now ? "text-teal-700 dark:text-teal-200" : "" },
    { label: text.kpiOverdue, value: kpis.overdue, tone: kpis.overdue ? "text-rose-700 dark:text-rose-200" : "" },
    { label: text.kpiUnassignedUrgent, value: kpis.unassignedUrgent, tone: kpis.unassignedUrgent ? "text-amber-700 dark:text-amber-200" : "" },
    { label: text.kpiDueSoon, value: kpis.dueSoon, tone: kpis.dueSoon ? "text-amber-700 dark:text-amber-200" : "" },
  ];

  return (
    <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map((item) => {
        const hasSignal = Number(item.value || 0) > 0;
        return (
        <div
          key={item.label}
          className={`ops-soft-kpi p-3 ${hasSignal ? "ops-soft-kpi-signal" : "ops-soft-kpi-muted"}`}
        >
          <p className={`${hasSignal ? "text-3xl" : "text-2xl"} font-black text-slate-950 dark:text-white ${item.tone}`}>
            {item.value.toLocaleString()}
          </p>
          <p className="mt-1 break-words text-xs font-bold text-slate-500 dark:text-slate-400">
            {item.label}
          </p>
        </div>
      );
      })}
    </div>
  );
}

function GroupAdminControlRow({
  assigningTicketId,
  deleteTicket,
  deletingTicketId,
  onOpenDrawer,
  onViewTicket,
  openActionTicketId,
  t,
  text,
  ticket,
  updatingTicketId,
  setOpenActionTicketId,
}) {
  const ticketId = ticket._id || ticket.id;
  const isUpdating = updatingTicketId === ticketId;
  const isAssigning = assigningTicketId === ticketId;
  const isDeleting = deletingTicketId === ticketId;
  const isBusy = isUpdating || isAssigning || isDeleting;

  return (
    <tr
      className={`ops-table-row ${getControlRowAccentClass(ticket)}`}
      onClick={() => onOpenDrawer(ticket)}
    >
      <td className="max-w-xs px-3 py-4">
        <p className="text-xs font-black text-teal-700 dark:text-teal-200">{ticket.ticketNumber}</p>
        <p className="mt-1 line-clamp-2 font-black text-slate-900 dark:text-white">{ticket.title}</p>
        <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">
          {ticket.category || "-"}
        </p>
      </td>
      <td className="min-w-44 px-3 text-xs text-slate-500 dark:text-slate-400">
        <p className="font-black text-slate-700 dark:text-slate-200">{getTicketHotelLabel(ticket, text.unknownHotel)}</p>
        <p className="mt-1">{ticket.departmentName || ticket.department || "-"}</p>
      </td>
      <td className="min-w-40 px-3">
        <div className="flex flex-wrap gap-2">
          {getGroupAdminRiskBadges(ticket, text, t).map((badge) => (
            <StatusPill key={badge.label} {...badge} />
          ))}
        </div>
      </td>
      <td className="px-3">
        <Badge text={getPriorityLabel(ticket.priority, t)} />
      </td>
      <td className="px-3">
        <Badge text={getStatusLabel(ticket.status, t)} />
      </td>
      <td className="px-3 text-slate-600 dark:text-slate-300">
        {ticket.assignedTo?.name || t("common.unassigned")}
      </td>
      <td className="min-w-28 px-3 text-slate-500 dark:text-slate-400">
        <DueLabel ticket={ticket} />
      </td>
      <td className="relative px-3" onClick={(event) => event.stopPropagation()}>
        <QueueActionMenu
          canDelete
          canOpenDetails
          deleting={isDeleting}
          disabled={isBusy}
          open={openActionTicketId === ticketId}
          onDelete={() => deleteTicket(ticketId)}
          onOpenDrawer={() => onOpenDrawer(ticket)}
          onToggle={() =>
            setOpenActionTicketId(openActionTicketId === ticketId ? null : ticketId)
          }
          onViewFullDetail={() => onViewTicket(ticketId)}
          t={t}
        />
      </td>
    </tr>
  );
}

function getControlRowAccentClass(ticket) {
  if (isOverdue(ticket)) return "ops-row-accent-rose";
  if (["critical", "high"].includes(ticket.priority)) return "ops-row-accent-amber";
  if (!ticket.assignedTo) return "ops-row-accent-emerald";
  return "";
}

function GroupAdminMobileControlCard({
  assigningTicketId,
  deleteTicket,
  deletingTicketId,
  onOpenDrawer,
  onViewTicket,
  openActionTicketId,
  t,
  text,
  ticket,
  updatingTicketId,
  setOpenActionTicketId,
}) {
  const ticketId = ticket._id || ticket.id;
  const isUpdating = updatingTicketId === ticketId;
  const isAssigning = assigningTicketId === ticketId;
  const isDeleting = deletingTicketId === ticketId;
  const isBusy = isUpdating || isAssigning || isDeleting;

  return (
    <article
      className={`ops-card cursor-pointer ${getControlRowAccentClass(ticket)}`}
      onClick={() => onOpenDrawer(ticket)}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-black text-teal-700 dark:text-teal-200">{ticket.ticketNumber}</p>
          <h4 className="mt-1 line-clamp-2 break-words text-base font-black text-slate-950 dark:text-white">
            {ticket.title}
          </h4>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {getTicketHotelLabel(ticket, text.unknownHotel)} / {ticket.departmentName || ticket.department || "-"}
          </p>
        </div>
        <div className="flex max-w-full flex-wrap gap-2">
          {getGroupAdminRiskBadges(ticket, text, t).map((badge) => (
            <StatusPill key={badge.label} {...badge} />
          ))}
        </div>
      </div>

      <div className="mt-4 grid min-w-0 gap-3 sm:grid-cols-3">
        <MobileMeta label={t("queue.priority")} value={getPriorityLabel(ticket.priority, t)} />
        <MobileMeta label={t("queue.statusLabel")} value={getStatusLabel(ticket.status, t)} />
        <MobileMeta label={text.ownerColumn} value={ticket.assignedTo?.name || t("common.unassigned")} />
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {text.dueLabel}: <DueLabel ticket={ticket} />
        </p>
        <div className="relative shrink-0" onClick={(event) => event.stopPropagation()}>
          <QueueActionMenu
            canDelete
            canOpenDetails
            deleting={isDeleting}
            disabled={isBusy}
            open={openActionTicketId === ticketId}
            onDelete={() => deleteTicket(ticketId)}
            onOpenDrawer={() => onOpenDrawer(ticket)}
            onToggle={() =>
              setOpenActionTicketId(openActionTicketId === ticketId ? null : ticketId)
            }
            onViewFullDetail={() => onViewTicket(ticketId)}
            t={t}
          />
        </div>
      </div>
    </article>
  );
}

function GroupAdminEmptyState({ activeQueue, text }) {
  const message = getGroupAdminEmptyQueueMessage(activeQueue, text);

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

function MobileMeta({ label, value }) {
  return (
    <div className="rounded-lg border border-teal-100/70 bg-white/80 p-3 dark:border-teal-300/10 dark:bg-white/5">
      <dt className="text-[11px] font-bold text-slate-400">
        {label}
      </dt>
      <dd className="mt-1 break-words font-semibold text-slate-800 dark:text-slate-100">
        {value}
      </dd>
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
