import { useState } from "react";
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
  addTicketComment,
  assignTicket,
  assignableUsers,
  canClaimTicket,
  canDelete,
  canManageTickets,
  canUpdateStatus,
  claimTicket,
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
  updateDueDate,
  updateStatus,
  workQueueProfile,
}) {
  if (!ticket) return null;

  const ticketId = ticket._id || ticket.id;
  const drawerText = getDrawerText(t, workQueueProfile);
  const isAgentQueue = workQueueProfile === "agent";
  const drawerStatusOptions = getDrawerStatusOptions(statusOptions, workQueueProfile);

  return (
    <Drawer
      actions={
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => onViewFullDetail(ticketId)}
            className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-black text-white transition hover:bg-blue-700"
          >
            {drawerText.fullDetail}
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
        <section className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-blue-900 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-100">
          <p className="font-black">{drawerText.roleTitle}</p>
          <p className="mt-1">{drawerText.roleDescription}</p>
        </section>

        <div className="flex flex-wrap gap-2">
          {getQueueBadges(ticket, t).map((badge) => (
            <StatusPill key={badge.label} {...badge} />
          ))}
          {ticket.criticalRequested && (
            <StatusPill label={t("queue.criticalReview")} tone="warning" />
          )}
        </div>

        {isAgentQueue && (
          <AgentQuickUpdatePanel
            key={ticketId}
            addTicketComment={addTicketComment}
            canClaimTicket={canClaimTicket}
            canUpdateStatus={canUpdateStatus}
            claimTicket={claimTicket}
            disabled={disabled}
            drawerText={drawerText}
            ticket={ticket}
            ticketId={ticketId}
            updateStatus={updateStatus}
          />
        )}

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
                options={drawerStatusOptions}
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
            {canManageTickets ? (
              <input
                type="datetime-local"
                value={toDateTimeLocalValue(ticket.dueDate)}
                disabled={disabled}
                onChange={(event) => updateDueDate(ticketId, event.target.value)}
                className="w-full min-w-0 max-w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950"
              />
            ) : (
              <DueLabel ticket={ticket} />
            )}
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

function toDateTimeLocalValue(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const timezoneOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 16);
}

function AgentQuickUpdatePanel({
  addTicketComment,
  canClaimTicket,
  canUpdateStatus,
  claimTicket,
  disabled,
  drawerText,
  ticket,
  ticketId,
  updateStatus,
}) {
  const [quickComment, setQuickComment] = useState("");
  const [commenting, setCommenting] = useState(false);
  const agentQuickActions = getAgentQuickActions(ticket, drawerText);

  const submitQuickComment = async () => {
    const text = quickComment.trim();
    if (!text || !addTicketComment || !canUpdateStatus) return;

    setCommenting(true);
    const ok = await addTicketComment(ticketId, text, { openDetails: false });
    if (ok) setQuickComment("");
    setCommenting(false);
  };

  const handleClaim = async () => {
    if (!canClaimTicket || !claimTicket) return;
    await claimTicket(ticketId);
  };

  return (
    <section className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-slate-400">
            {drawerText.quickActionTitle}
          </p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {canUpdateStatus
              ? drawerText.quickActionHelp
              : canClaimTicket
                ? drawerText.claimHelp
                : drawerText.readOnlyHelp}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canClaimTicket && (
            <button
              type="button"
              disabled={disabled}
              onClick={handleClaim}
              className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-black text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-45"
            >
              {disabled ? drawerText.claimingTicket : drawerText.claimTicket}
            </button>
          )}
          {agentQuickActions.map((action) => (
            <button
              key={action.status}
              type="button"
              disabled={disabled || !canUpdateStatus || ticket.status === action.status}
              onClick={() => updateStatus(ticketId, action.status)}
              className={`rounded-xl px-3 py-2 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-45 ${action.className}`}
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <label className="text-xs font-black uppercase tracking-wide text-slate-400" htmlFor={`quick-comment-${ticketId}`}>
          {drawerText.quickCommentLabel}
        </label>
        <textarea
          id={`quick-comment-${ticketId}`}
          value={quickComment}
          disabled={!canUpdateStatus || commenting}
          onChange={(event) => setQuickComment(event.target.value)}
          placeholder={drawerText.quickCommentPlaceholder}
          rows={3}
          className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm leading-6 outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950"
        />
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            disabled={!quickComment.trim() || !canUpdateStatus || commenting}
            onClick={submitQuickComment}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-black text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200 dark:disabled:bg-slate-700 dark:disabled:text-slate-400"
          >
            {commenting ? drawerText.quickCommentSending : drawerText.quickCommentSubmit}
          </button>
        </div>
      </div>
    </section>
  );
}

function DrawerField({ children, label }) {
  return (
    <div className="min-w-0 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
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

function getDrawerText(t, workQueueProfile) {
  const fullDetail = pickText(t, "queue.actions.fullDetail", "Full detail");

  if (workQueueProfile === "agent") {
    return {
      fullDetail,
      roleTitle: pickText(t, "agentQueue.drawer.title", "Agent actions"),
      roleDescription: pickText(
        t,
        "agentQueue.drawer.description",
        "You can update status for tickets assigned to you. Assignment, priority, due date, and delete are manager actions.",
      ),
      quickActionTitle: pickText(t, "agentQueue.quick.title", "Quick update"),
      quickActionHelp: pickText(t, "agentQueue.quick.help", "Use the fastest status action, then leave a short work note."),
      readOnlyHelp: pickText(t, "agentQueue.quick.readOnlyHelp", "This ticket is visible to you, but it is not assigned to you yet."),
      claimHelp: pickText(t, "agentQueue.quick.claimHelp", "This ticket is unassigned. Claim it first, then you can update status and add work notes."),
      claimTicket: pickText(t, "agentQueue.quick.claimTicket", "Claim ticket"),
      claimingTicket: pickText(t, "agentQueue.quick.claimingTicket", "Claiming..."),
      startWork: pickText(t, "agentQueue.quick.startWork", "Start work"),
      markResolved: pickText(t, "agentQueue.quick.markResolved", "Mark resolved"),
      reopenWork: pickText(t, "agentQueue.quick.reopenWork", "Reopen"),
      quickCommentLabel: pickText(t, "agentQueue.quick.commentLabel", "Work update"),
      quickCommentPlaceholder: pickText(t, "agentQueue.quick.commentPlaceholder", "Add a short update for the requester or manager..."),
      quickCommentSubmit: pickText(t, "agentQueue.quick.commentSubmit", "Add update"),
      quickCommentSending: pickText(t, "agentQueue.quick.commentSending", "Adding..."),
    };
  }

  if (workQueueProfile === "manager" || workQueueProfile === "hotelAdmin") {
    return {
      fullDetail,
      roleTitle: pickText(t, "managerQueue.drawer.title", "Manager triage"),
      roleDescription: pickText(
        t,
        "managerQueue.drawer.description",
        "Assign the owner, adjust priority, update status, and use the full detail view for comments or attachments.",
      ),
    };
  }

  return {
    fullDetail,
    roleTitle: pickText(t, "queue.drawer.title", "Ticket actions"),
    roleDescription: pickText(t, "queue.drawer.description", "Review the ticket and update the fields available to your role."),
  };
}

function getAgentQuickActions(ticket, drawerText) {
  if (ticket.status === "open") {
    return [
      {
        className: "bg-blue-600 text-white hover:bg-blue-700",
        label: drawerText.startWork,
        status: "in_progress",
      },
      {
        className: "border border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50 dark:border-emerald-500/30 dark:bg-slate-950 dark:text-emerald-300 dark:hover:bg-emerald-500/10",
        label: drawerText.markResolved,
        status: "resolved",
      },
    ];
  }

  if (ticket.status === "in_progress") {
    return [
      {
        className: "bg-emerald-600 text-white hover:bg-emerald-700",
        label: drawerText.markResolved,
        status: "resolved",
      },
    ];
  }

  return [
    {
      className: "border border-blue-200 bg-white text-blue-700 hover:bg-blue-50 dark:border-blue-500/30 dark:bg-slate-950 dark:text-blue-300 dark:hover:bg-blue-500/10",
      label: drawerText.reopenWork,
      status: "in_progress",
    },
  ];
}

function getDrawerStatusOptions(statusOptions, workQueueProfile) {
  return statusOptions.filter((option) => {
    if (option.value === "all") return false;
    if (workQueueProfile === "agent" && option.value === "closed") return false;
    return true;
  });
}

function pickText(t, key, fallback) {
  const value = t?.(key);
  return value && value !== key ? value : fallback;
}

export default WorkQueueTicketDrawer;
