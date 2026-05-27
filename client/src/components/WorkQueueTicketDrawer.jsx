import { useState } from "react";
import Badge from "./Badge";
import Drawer from "./Drawer";
import StatusPill from "./StatusPill";
import ThemedSelect from "./ThemedSelect";
import { Button, Card, TextField } from "./ui";
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
  canReopenTicket,
  canUpdateStatus,
  claimTicket,
  deleting,
  disabled,
  onClose,
  onDelete,
  onViewFullDetail,
  priorityOptions,
  reopenTicket,
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
  const isClosedTicket = ticket.status === "closed";
  const ticketControlsDisabled = disabled || isClosedTicket;
  const drawerStatusOptions = getDrawerStatusOptions(statusOptions, workQueueProfile);

  return (
    <Drawer
      actions={
        <div className="grid gap-3 sm:grid-cols-2">
          <Button
            onClick={() => onViewFullDetail(ticketId)}
            size="lg"
            variant="primary"
          >
            {drawerText.fullDetail}
          </Button>
          {isClosedTicket && canReopenTicket && (
            <Button
              disabled={disabled || !reopenTicket}
              onClick={() => reopenTicket(ticketId)}
              size="lg"
              variant="success"
            >
              {drawerText.reopenTicket}
            </Button>
          )}
          {canDelete && (
            <Button
              disabled={disabled || deleting}
              onClick={() => onDelete(ticketId)}
              size="lg"
              variant="danger"
            >
              {deleting ? t("common.deleting") : t("common.delete")}
            </Button>
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
        <Card className="border-purple-100/80 bg-purple-50/70 text-sm leading-6 text-purple-950 dark:border-purple-400/10 dark:bg-purple-500/10 dark:text-purple-100">
          <p className="font-black">{drawerText.roleTitle}</p>
          <p className="mt-1">{drawerText.roleDescription}</p>
        </Card>

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
            disabled={ticketControlsDisabled}
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
                disabled={ticketControlsDisabled}
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
                disabled={ticketControlsDisabled}
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
                disabled={ticketControlsDisabled || !assignableUsers.length}
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
                disabled={ticketControlsDisabled}
                onChange={(event) => updateDueDate(ticketId, event.target.value)}
                className="ops-input max-w-full appearance-none px-3 py-2 font-semibold"
              />
            ) : (
              <DueLabel ticket={ticket} />
            )}
          </DrawerField>
        </section>

        <Card>
          <p className="text-xs font-black uppercase tracking-wide text-slate-400">
            {t("detail.description")}
          </p>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700 dark:text-slate-200">
            {ticket.description || t("detail.noDescription")}
          </p>
        </Card>

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
    <Card>
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
            <Button
              disabled={disabled}
              onClick={handleClaim}
              size="sm"
              variant="success"
            >
              {disabled ? drawerText.claimingTicket : drawerText.claimTicket}
            </Button>
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
        <TextField
          textarea
          id={`quick-comment-${ticketId}`}
          label={drawerText.quickCommentLabel}
          value={quickComment}
          disabled={!canUpdateStatus || commenting}
          onChange={(event) => setQuickComment(event.target.value)}
          placeholder={drawerText.quickCommentPlaceholder}
          rows={3}
          className="resize-none px-3 py-2 leading-6"
        />
        <div className="mt-3 flex justify-end">
          <Button
            disabled={!quickComment.trim() || !canUpdateStatus || commenting}
            onClick={submitQuickComment}
            size="sm"
            variant="primary"
          >
            {commenting ? drawerText.quickCommentSending : drawerText.quickCommentSubmit}
          </Button>
        </div>
      </div>
    </Card>
  );
}

function DrawerField({ children, label }) {
  return (
    <div className="min-w-0 rounded-lg border border-purple-100/80 bg-white/90 p-3 shadow-[0_10px_26px_rgba(76,29,149,0.06)] backdrop-blur-sm dark:border-purple-400/10 dark:bg-white/5">
      <p className="mb-2 text-[11px] font-black uppercase tracking-wide text-slate-400">
        {label}
      </p>
      {children}
    </div>
  );
}

function DrawerMeta({ label, value }) {
  return (
    <div className="rounded-lg border border-purple-100/80 bg-white/90 p-3 shadow-[0_10px_26px_rgba(76,29,149,0.06)] backdrop-blur-sm dark:border-purple-400/10 dark:bg-white/5">
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
  const reopenTicket = pickText(t, "queue.actions.reopen", "Reopen");

  if (workQueueProfile === "agent") {
    return {
      fullDetail,
      reopenTicket,
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
      reopenTicket,
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
    reopenTicket,
  };
}

function getAgentQuickActions(ticket, drawerText) {
  if (ticket.status === "open") {
    return [
      {
        className: "bg-purple-700 text-white hover:bg-purple-800 dark:bg-purple-500 dark:hover:bg-purple-400",
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
      className: "border border-purple-200 bg-white text-purple-700 hover:bg-purple-50 dark:border-purple-500/30 dark:bg-white/5 dark:text-purple-200 dark:hover:bg-purple-500/10",
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
