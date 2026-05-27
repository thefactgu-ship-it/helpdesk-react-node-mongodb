import {
  CheckCircle2,
  CircleDot,
  ClipboardList,
  Clock3,
  MessageSquareMore,
  PlayCircle,
  TimerReset,
} from "lucide-react";
import {
  getEntityId,
  getPriorityLabel,
  getStatusLabel,
  isCompleted,
  isDueSoon,
  isOverdue,
  isWaitingRequester,
} from "../utils/ticketQueueUtils";

function AgentWorkDashboard({
  assigningTicketId,
  claimTicket,
  currentUser,
  loading,
  onNavigate,
  t,
  tickets = [],
}) {
  const currentUserId = getEntityId(currentUser);
  const text = getAgentDashboardText(t);
  const data = buildAgentDashboardData(tickets, currentUserId);

  return (
    <div className="space-y-5">
      <section className="ops-dashboard-hero md:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="max-w-3xl">
            <div className="ops-chip-primary">
              <PlayCircle className="h-4 w-4" aria-hidden="true" />
              {text.eyebrow}
            </div>
            <h3 className="mt-3 text-2xl font-black text-slate-950 dark:text-white">
              {text.title}
            </h3>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
              {text.description}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[30rem]">
            <button
              type="button"
              onClick={() => onNavigate("tickets")}
              className="ops-button-primary min-h-12 px-4 py-3 sm:col-span-2"
            >
              <ClipboardList className="h-5 w-5" aria-hidden="true" />
              {text.openQueue}
            </button>
            <button
              type="button"
              onClick={() => onNavigate("tickets")}
              className="ops-button-secondary px-4 py-2 text-xs font-black"
            >
              <TimerReset className="h-4 w-4" aria-hidden="true" />
              {text.dueSoonAction}
            </button>
            <button
              type="button"
              onClick={() => onNavigate("tickets")}
              className="ops-button-secondary px-4 py-2 text-xs font-black"
            >
              <MessageSquareMore className="h-4 w-4" aria-hidden="true" />
              {text.updateWork}
            </button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
        <AgentKpi
          detail={text.assignedDetail}
          icon={ClipboardList}
          label={text.assigned}
          value={data.activeAssigned.length}
        />
        <AgentKpi
          detail={text.dueSoonDetail}
          icon={TimerReset}
          label={text.dueSoon}
          tone={data.dueSoon.length ? "amber" : "purple"}
          value={data.dueSoon.length}
        />
        <AgentKpi
          detail={text.overdueDetail}
          icon={Clock3}
          label={text.overdue}
          tone={data.overdue.length ? "rose" : "purple"}
          value={data.overdue.length}
        />
        <AgentKpi
          detail={text.availableDetail}
          icon={CircleDot}
          label={text.availableToClaim}
          tone={data.availableToClaim.length ? "emerald" : "purple"}
          value={data.availableToClaim.length}
        />
        <AgentKpi
          detail={text.waitingRequesterDetail}
          icon={CheckCircle2}
          label={text.waitingRequester}
          value={data.waitingRequester.length}
        />
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <AgentPanel
          actionLabel={text.openQueue}
          className="xl:col-span-7"
          icon={PlayCircle}
          onAction={() => onNavigate("tickets")}
          title={text.nextWork}
        >
          {data.focusTickets.length ? (
            <div className="space-y-3">
              {data.focusTickets.map((ticket) => (
                <AgentTicketItem key={ticket._id || ticket.id} text={text} ticket={ticket} t={t} />
              ))}
            </div>
          ) : (
            <AgentEmptyState loading={loading} loadingLabel={text.loading} message={text.noFocusTickets} />
          )}
        </AgentPanel>

        <AgentPanel
          actionLabel={text.openQueue}
          className="xl:col-span-5"
          icon={CircleDot}
          onAction={() => onNavigate("tickets")}
          title={text.availableToClaim}
        >
          {data.availableToClaim.length ? (
            <div className="space-y-3">
              {data.availableToClaim.map((ticket) => {
                const ticketId = ticket._id || ticket.id;
                return (
                  <AgentTicketItem
                    actionDisabled={assigningTicketId === ticketId}
                    actionLabel={assigningTicketId === ticketId ? text.claimingTicket : text.claimTicket}
                    compact
                    key={ticketId}
                    onAction={claimTicket ? () => claimTicket(ticketId) : undefined}
                    text={text}
                    ticket={ticket}
                    t={t}
                  />
                );
              })}
            </div>
          ) : (
            <AgentEmptyState loading={loading} loadingLabel={text.loading} message={text.noAvailableTickets} />
          )}
        </AgentPanel>

        <AgentPanel
          className="xl:col-span-5"
          icon={MessageSquareMore}
          title={text.recentUpdates}
        >
          {data.recentTouched.length ? (
            <div className="space-y-3">
              {data.recentTouched.map((ticket) => (
                <AgentTicketItem compact key={ticket._id || ticket.id} text={text} ticket={ticket} t={t} />
              ))}
            </div>
          ) : (
            <AgentEmptyState loading={loading} loadingLabel={text.loading} message={text.noRecentUpdates} />
          )}
        </AgentPanel>
      </section>
    </div>
  );
}

function buildAgentDashboardData(tickets, currentUserId) {
  const assigned = tickets.filter((ticket) => getEntityId(ticket.assignedTo) === currentUserId);
  const activeAssigned = assigned.filter((ticket) => !isCompleted(ticket));
  const dueSoon = activeAssigned.filter((ticket) => isDueSoon(ticket) || isOverdue(ticket));
  const overdue = activeAssigned.filter(isOverdue);
  const waitingRequester = assigned.filter(isWaitingRequester);
  const availableToClaim = tickets
    .filter((ticket) => !isCompleted(ticket) && !ticket.assignedTo)
    .sort((a, b) => getAgentTicketRank(a) - getAgentTicketRank(b))
    .slice(0, 5);
  const focusTickets = activeAssigned
    .map((ticket) => ({
      ...ticket,
      riskRank: getAgentTicketRank(ticket),
    }))
    .sort((a, b) => {
      const rankDiff = a.riskRank - b.riskRank;
      if (rankDiff) return rankDiff;
      return new Date(a.dueDate || a.createdAt) - new Date(b.dueDate || b.createdAt);
    })
    .slice(0, 6);
  const recentTouched = [...assigned]
    .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
    .slice(0, 5);

  return {
    activeAssigned,
    availableToClaim,
    dueSoon,
    focusTickets,
    overdue,
    recentTouched,
    waitingRequester,
  };
}

function AgentKpi({ detail, icon: Icon, label, tone = "purple", value }) {
  const toneClasses = {
    amber: "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200",
    purple: "bg-purple-50 text-purple-700 dark:bg-purple-500/15 dark:text-purple-200",
    emerald: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200",
    rose: "bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-200",
  };

  return (
    <article className="ops-soft-kpi ops-realtime-pulse">
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-3xl font-black text-slate-950 dark:text-white">
            {Number(value || 0).toLocaleString()}
          </p>
          <p className="mt-1 text-sm font-black text-slate-700 dark:text-slate-200">
            {label}
          </p>
          <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
            {detail}
          </p>
        </div>
        <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-lg ${toneClasses[tone] || toneClasses.purple}`}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
      </div>
    </article>
  );
}

function AgentPanel({ actionLabel, children, className = "", icon: Icon, onAction, title }) {
  return (
    <section className={`ops-soft-panel ${className}`}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="ops-soft-icon grid h-10 w-10 place-items-center">
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>
          <h3 className="text-sm font-black text-slate-900 dark:text-white">
            {title}
          </h3>
        </div>
        {onAction && (
          <button
            type="button"
            onClick={onAction}
            className="ops-button-secondary min-h-10 px-3 py-2 text-xs font-black"
          >
            {actionLabel}
          </button>
        )}
      </div>
      {children}
    </section>
  );
}

function AgentTicketItem({ actionDisabled = false, actionLabel, compact = false, onAction, text, ticket, t }) {
  return (
    <article className="ops-soft-card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-black text-purple-700 ring-1 ring-purple-100 dark:bg-white/5 dark:text-purple-200 dark:ring-purple-400/20">
              {ticket.ticketNumber || "-"}
            </span>
            <span className={`rounded-full px-2.5 py-1 text-[11px] font-black ring-1 ${getAgentRiskClass(ticket)}`}>
              {getAgentRiskLabel(ticket, text)}
            </span>
          </div>
          <h4 className="mt-2 line-clamp-2 text-sm font-black text-slate-950 dark:text-white">
            {ticket.title}
          </h4>
          <p className="mt-2 line-clamp-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
            {ticket.category || text.unknownCategory} / {ticket.departmentName || ticket.department || "-"}
          </p>
        </div>
        {!compact && (
          <div className="grid min-w-[9rem] grid-cols-2 gap-2 text-xs">
            <AgentMeta label={text.priorityLabel} value={getPriorityLabel(ticket.priority, t)} />
            <AgentMeta label={text.dueLabel} value={formatDate(ticket.dueDate) || "-"} />
            <AgentMeta label={text.statusLabel} value={getStatusLabel(ticket.status, t)} />
            <AgentMeta label={text.updatedLabel} value={formatDate(ticket.updatedAt || ticket.createdAt) || "-"} />
          </div>
        )}
        {onAction && (
          <button
            type="button"
            disabled={actionDisabled}
            onClick={onAction}
            className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-black text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {actionLabel}
          </button>
        )}
      </div>
    </article>
  );
}

function AgentMeta({ label, value }) {
  return (
    <div className="min-w-0 rounded-lg bg-white px-3 py-2 ring-1 ring-slate-200 dark:bg-slate-950 dark:ring-slate-800">
      <p className="text-[10px] font-bold uppercase text-slate-400">{label}</p>
      <p className="mt-1 truncate font-bold text-slate-700 dark:text-slate-200">{value}</p>
    </div>
  );
}

function AgentEmptyState({ loading, loadingLabel = "Loading...", message }) {
  return (
    <div className="ops-empty-state p-5 text-sm text-slate-500 dark:text-slate-400">
      {loading ? loadingLabel : message}
    </div>
  );
}

function getAgentTicketRank(ticket) {
  if (isOverdue(ticket)) return 0;
  if (isDueSoon(ticket)) return 1;
  if (ticket.priority === "critical") return 2;
  if (ticket.priority === "high") return 3;
  if (ticket.status === "open") return 4;
  return 9;
}

function getAgentRiskLabel(ticket, text) {
  if (isOverdue(ticket)) return text.overdueRisk;
  if (isDueSoon(ticket)) return text.dueSoonRisk;
  if (["critical", "high"].includes(ticket.priority)) return text.urgentRisk;
  if (ticket.status === "open") return text.newWorkRisk;
  return text.normalRisk;
}

function getAgentRiskClass(ticket) {
  if (isOverdue(ticket)) {
    return "bg-rose-50 text-rose-700 ring-rose-100 dark:bg-rose-500/15 dark:text-rose-200 dark:ring-rose-400/20";
  }
  if (isDueSoon(ticket) || ["critical", "high"].includes(ticket.priority)) {
    return "bg-amber-50 text-amber-700 ring-amber-100 dark:bg-amber-500/15 dark:text-amber-200 dark:ring-amber-400/20";
  }
  return "bg-purple-50 text-purple-700 ring-purple-100 dark:bg-purple-500/15 dark:text-purple-200 dark:ring-purple-400/20";
}

function formatDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("th-TH", {
    day: "2-digit",
    month: "short",
  });
}

function getAgentDashboardText(t) {
  return {
    assigned: pickText(t, "agentDashboard.assigned", "Assigned active"),
    assignedDetail: pickText(t, "agentDashboard.assignedDetail", "Tickets currently assigned to you"),
    availableDetail: pickText(t, "agentDashboard.availableDetail", "Unassigned visible tickets your team can cover"),
    availableToClaim: pickText(t, "agentDashboard.availableToClaim", "Available to claim"),
    claimTicket: pickText(t, "agentDashboard.claimTicket", "Claim"),
    claimingTicket: pickText(t, "agentDashboard.claimingTicket", "Claiming..."),
    description: pickText(
      t,
      "agentDashboard.description",
      "See the work you should handle first, update progress from the queue, and keep requesters informed.",
    ),
    dueLabel: pickText(t, "agentDashboard.dueLabel", "Due"),
    dueSoon: pickText(t, "agentDashboard.dueSoon", "Due soon"),
    dueSoonAction: pickText(t, "agentDashboard.dueSoonAction", "Check due work"),
    dueSoonDetail: pickText(t, "agentDashboard.dueSoonDetail", "Assigned work close to due time"),
    dueSoonRisk: pickText(t, "agentDashboard.dueSoonRisk", "Due soon"),
    eyebrow: pickText(t, "agentDashboard.eyebrow", "Agent workspace"),
    loading: pickText(t, "common.loadingPage", "Loading page..."),
    newWorkRisk: pickText(t, "agentDashboard.newWorkRisk", "New work"),
    nextWork: pickText(t, "agentDashboard.nextWork", "Next work"),
    noFocusTickets: pickText(t, "agentDashboard.noFocusTickets", "No assigned work needs action right now."),
    noAvailableTickets: pickText(t, "agentDashboard.noAvailableTickets", "No visible unassigned work is available right now."),
    noRecentUpdates: pickText(t, "agentDashboard.noRecentUpdates", "No assigned ticket updates yet."),
    normalRisk: pickText(t, "agentDashboard.normalRisk", "Normal"),
    openQueue: pickText(t, "agentDashboard.openQueue", "Open my queue"),
    overdue: pickText(t, "agentDashboard.overdue", "Overdue"),
    overdueDetail: pickText(t, "agentDashboard.overdueDetail", "Assigned work past due"),
    overdueRisk: pickText(t, "agentDashboard.overdueRisk", "Overdue"),
    priorityLabel: pickText(t, "agentDashboard.priorityLabel", "Priority"),
    recentUpdates: pickText(t, "agentDashboard.recentUpdates", "Recently updated"),
    statusLabel: pickText(t, "agentDashboard.statusLabel", "Status"),
    title: pickText(t, "agentDashboard.title", "My work today"),
    unknownCategory: pickText(t, "agentDashboard.unknownCategory", "Uncategorized"),
    updateWork: pickText(t, "agentDashboard.updateWork", "Add work update"),
    updatedLabel: pickText(t, "agentDashboard.updatedLabel", "Updated"),
    urgentRisk: pickText(t, "agentDashboard.urgentRisk", "Urgent"),
    waitingRequester: pickText(t, "agentDashboard.waitingRequester", "Waiting requester"),
    waitingRequesterDetail: pickText(t, "agentDashboard.waitingRequesterDetail", "Resolved work waiting for confirmation"),
  };
}

function pickText(t, key, fallback) {
  const value = t?.(key);
  return value && value !== key ? value : fallback;
}

export default AgentWorkDashboard;
