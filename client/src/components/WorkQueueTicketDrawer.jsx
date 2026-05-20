import Badge from "./Badge";
import Drawer from "./Drawer";
import StatusPill from "./StatusPill";
import ThemedSelect from "./ThemedSelect";
import {
  buildAssignableOptions,
  getEntityId,
  getPriorityLabel,
  getQueueBadges,
  getStatusLabel,
  getTicketHotelLabel,
  isDueSoon,
  isOverdue,
} from "../utils/ticketQueueUtils";

function WorkQueueTicketDrawer({
  assignTicket,
  assignableUsers,
  canDelete,
  canManageTickets,
  canUpdateStatus,
  deleting,
  disabled,
  onClose,
  onDelete,
  onViewFullDetail,
  priorityOptions,
  statusOptions,
  t,
  ticket,
  updatePriority,
  updateStatus,
}) {
  if (!ticket) return null;

  const ticketId = ticket._id || ticket.id;

  return (
    <Drawer
      actions={
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => onViewFullDetail(ticketId)}
            className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-black text-white transition hover:bg-blue-700"
          >
            Full detail
          </button>
          {canDelete && (
            <button
              type="button"
              disabled={disabled || deleting}
              onClick={() => onDelete(ticketId)}
              className="rounded-xl border border-rose-200 px-4 py-3 text-sm font-black text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400 disabled:hover:bg-transparent dark:border-rose-500/30 dark:text-rose-300 dark:hover:bg-rose-500/10 dark:disabled:border-slate-800 dark:disabled:text-slate-600"
            >
              {deleting ? t("common.deleting") : t("common.delete")}
            </button>
          )}
        </div>
      }
      eyebrow={ticket.ticketNumber}
      onClose={onClose}
      open={Boolean(ticket)}
      subtitle={`${getTicketHotelLabel(ticket, t("common.unknown"))} / ${ticket.departmentName || ticket.department || "-"}`}
      title={ticket.title}
    >
      <div className="space-y-5">
        <div className="flex flex-wrap gap-2">
          {getQueueBadges(ticket, t).map((badge) => (
            <StatusPill key={badge.label} {...badge} />
          ))}
          {ticket.criticalRequested && (
            <StatusPill label={t("queue.criticalReview")} tone="warning" />
          )}
        </div>

        <section className="grid gap-3 sm:grid-cols-2">
          <DrawerField label={t("queue.priority")}>
            {canManageTickets ? (
              <ThemedSelect
                compactOptions
                size="sm"
                value={ticket.priority}
                disabled={disabled}
                onChange={(value) => updatePriority(ticketId, value)}
                options={priorityOptions}
              />
            ) : (
              <Badge text={getPriorityLabel(ticket.priority, t)} />
            )}
          </DrawerField>

          <DrawerField label={t("queue.statusLabel")}>
            {canUpdateStatus ? (
              <ThemedSelect
                compactOptions
                size="sm"
                value={ticket.status}
                disabled={disabled}
                onChange={(value) => updateStatus(ticketId, value)}
                options={statusOptions.filter((option) => option.value !== "all")}
              />
            ) : (
              <Badge text={getStatusLabel(ticket.status, t)} />
            )}
          </DrawerField>

          <DrawerField label={t("queue.assign")}>
            {canManageTickets ? (
              <ThemedSelect
                compactOptions
                size="sm"
                value={getEntityId(ticket.assignedTo)}
                disabled={disabled || !assignableUsers.length}
                emptyLabel={t("common.unassigned")}
                onChange={(value) => assignTicket(ticketId, value)}
                options={buildAssignableOptions(assignableUsers, false, t)}
              />
            ) : (
              <span>{ticket.assignedTo?.name || t("common.unassigned")}</span>
            )}
          </DrawerField>

          <DrawerField label={t("queue.due")}>
            <DueLabel ticket={ticket} />
          </DrawerField>
        </section>

        <section className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-black uppercase tracking-wide text-slate-400">
            {t("detail.description")}
          </p>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700 dark:text-slate-200">
            {ticket.description || t("detail.noDescription")}
          </p>
        </section>

        <section className="grid gap-3 sm:grid-cols-2">
          <DrawerMeta label={t("detail.requester")} value={ticket.requester || t("common.unknown")} />
          <DrawerMeta label={t("detail.createdBy")} value={ticket.createdBy?.name || t("common.unknown")} />
          <DrawerMeta label={t("detail.assignedTo")} value={ticket.assignedTo?.name || t("common.unassigned")} />
          <DrawerMeta label={t("detail.dueDate")} value={ticket.dueDate ? new Date(ticket.dueDate).toLocaleString() : t("common.notSet")} />
        </section>
      </div>
    </Drawer>
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

function DrawerField({ children, label }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
      <p className="mb-2 text-[11px] font-black uppercase tracking-wide text-slate-400">
        {label}
      </p>
      {children}
    </div>
  );
}

function DrawerMeta({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
      <p className="text-[11px] font-black uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-semibold text-slate-800 dark:text-slate-100">
        {value}
      </p>
    </div>
  );
}

export default WorkQueueTicketDrawer;
