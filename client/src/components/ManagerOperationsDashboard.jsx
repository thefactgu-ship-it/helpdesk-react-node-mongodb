import { useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ClipboardList,
  Clock3,
  ShieldAlert,
  TimerReset,
  UserRoundX,
  UsersRound,
} from "lucide-react";
import DashboardAnalytics from "./DashboardAnalytics";
import {
  isCompleted,
  isDueSoon,
  isOverdue,
} from "../utils/ticketQueueUtils";

function ManagerOperationsDashboard({
  darkMode,
  loading,
  onNavigate,
  t,
  tickets = [],
}) {
  const [activeView, setActiveView] = useState("operations");
  const text = getManagerDashboardText(t);
  const data = buildManagerDashboardData(tickets, text);
  const isAnalyticsView = activeView === "analytics";

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950 md:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700 ring-1 ring-blue-100 dark:bg-blue-500/15 dark:text-blue-200 dark:ring-blue-400/20">
              <ShieldAlert className="h-4 w-4" aria-hidden="true" />
              {text.eyebrow}
            </div>
            <h3 className="mt-3 text-2xl font-black text-slate-950 dark:text-white">
              {text.title}
            </h3>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
              {text.description}
            </p>
          </div>

          <div className="flex flex-col gap-3 xl:min-w-[30rem]">
            <button
              type="button"
              onClick={() => onNavigate("tickets")}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-black text-white shadow-sm transition hover:bg-blue-700"
            >
              <ClipboardList className="h-5 w-5" aria-hidden="true" />
              {text.openQueue}
            </button>
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                aria-pressed={isAnalyticsView}
                onClick={() => setActiveView(isAnalyticsView ? "operations" : "analytics")}
                className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-4 py-2 text-xs font-black shadow-sm transition ${
                  isAnalyticsView
                    ? "border-blue-600 bg-blue-600 text-white hover:bg-blue-700"
                    : "border-slate-200 bg-slate-50 text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                }`}
              >
                <BarChart3 className="h-4 w-4" aria-hidden="true" />
                {isAnalyticsView ? text.operationsView : text.viewAnalytics}
              </button>
              <button
                type="button"
                onClick={() => onNavigate("monthly-report")}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-black text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              >
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                {text.monthlyReport}
              </button>
            </div>
          </div>
        </div>
      </section>

      {!isAnalyticsView && (
        <>
          <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
            <ManagerKpi
              detail={text.needsTriageDetail}
              icon={ShieldAlert}
              label={text.needsTriage}
              tone={data.needsTriage.length ? "amber" : "blue"}
              value={data.needsTriage.length}
            />
            <ManagerKpi
              detail={text.unassignedUrgentDetail}
              icon={UserRoundX}
              label={text.unassignedUrgent}
              tone={data.unassignedUrgent.length ? "rose" : "blue"}
              value={data.unassignedUrgent.length}
            />
            <ManagerKpi
              detail={text.overdueDetail}
              icon={AlertTriangle}
              label={text.overdue}
              tone={data.overdue.length ? "rose" : "blue"}
              value={data.overdue.length}
            />
            <ManagerKpi
              detail={text.dueSoonDetail}
              icon={TimerReset}
              label={text.dueSoon}
              tone={data.dueSoon.length ? "amber" : "blue"}
              value={data.dueSoon.length}
            />
            <ManagerKpi
              detail={text.activeDetail}
              icon={Clock3}
              label={text.active}
              value={data.active.length}
            />
          </section>

          <section className="grid grid-cols-1 gap-4 xl:grid-cols-12">
            <ManagerPanel
              actionLabel={text.openQueue}
              className="xl:col-span-7"
              icon={TimerReset}
              onAction={() => onNavigate("tickets")}
              title={text.focusQueue}
            >
              {data.focusTickets.length ? (
                <div className="space-y-3">
                  {data.focusTickets.map((ticket) => (
                    <ManagerTicketItem key={ticket._id || ticket.id} text={text} ticket={ticket} />
                  ))}
                </div>
              ) : (
                <ManagerEmptyState loading={loading} loadingLabel={text.loading} message={text.noFocusTickets} />
              )}
            </ManagerPanel>

            <ManagerPanel
              className="xl:col-span-5"
              icon={UsersRound}
              title={text.teamLoad}
            >
              <ManagerRankList
                empty={text.noWorkloadData}
                items={data.workloadData}
                total={data.active.length}
              />
            </ManagerPanel>

            <ManagerPanel
              className="xl:col-span-6"
              icon={BarChart3}
              title={text.recurringIssues}
            >
              <ManagerRankList
                empty={text.noCategoryData}
                items={data.categoryData}
                total={tickets.length}
              />
            </ManagerPanel>

            <ManagerPanel
              className="xl:col-span-6"
              icon={ClipboardList}
              title={text.statusMix}
            >
              <ManagerRankList
                empty={text.noStatusData}
                items={data.statusData}
                total={tickets.length}
              />
            </ManagerPanel>
          </section>
        </>
      )}

      {isAnalyticsView && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-600 dark:text-blue-300">
                {text.analyticsEyebrow}
              </p>
              <h3 className="mt-1 text-lg font-black text-slate-950 dark:text-white">
                {text.analyticsTitle}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setActiveView("operations")}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              {text.operationsView}
            </button>
          </div>
          <DashboardAnalytics darkMode={darkMode} tickets={tickets} />
        </section>
      )}
    </div>
  );
}

function buildManagerDashboardData(tickets, text) {
  const active = tickets.filter((ticket) => !isCompleted(ticket));
  const overdue = active.filter(isOverdue);
  const dueSoon = active.filter(isDueSoon);
  const unassignedUrgent = active.filter(
    (ticket) => !ticket.assignedTo && ["critical", "high"].includes(ticket.priority),
  );
  const needsTriage = active.filter(
    (ticket) =>
      !ticket.assignedTo ||
      ["critical", "high"].includes(ticket.priority) ||
      isOverdue(ticket) ||
      isDueSoon(ticket),
  );
  const focusTickets = needsTriage
    .map((ticket) => ({
      ...ticket,
      riskRank: getManagerTicketRiskRank(ticket),
      riskLabel: getManagerTicketRiskLabel(ticket, text),
    }))
    .sort((a, b) => {
      const rankDiff = a.riskRank - b.riskRank;
      if (rankDiff) return rankDiff;
      return new Date(a.dueDate || a.createdAt) - new Date(b.dueDate || b.createdAt);
    })
    .slice(0, 6);

  return {
    active,
    categoryData: buildRankData(tickets, (ticket) => ticket.category || text.unknownCategory, 5),
    dueSoon,
    focusTickets,
    needsTriage,
    overdue,
    statusData: buildRankData(tickets, (ticket) => formatStatus(ticket.status || text.unknownStatus), 5),
    unassignedUrgent,
    workloadData: buildRankData(active, (ticket) => getAssigneeName(ticket, text.unassignedOwner), 6),
  };
}

function ManagerKpi({ detail, icon: Icon, label, tone = "blue", value }) {
  const toneClasses = {
    amber: "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200",
    blue: "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-200",
    rose: "bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-200",
  };

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <div className="flex items-start justify-between gap-3">
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
        <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${toneClasses[tone]}`}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
      </div>
    </article>
  );
}

function ManagerPanel({ actionLabel, children, className = "", icon: Icon, onAction, title }) {
  return (
    <section className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950 ${className}`}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-300">
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
            className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-black text-slate-700 transition hover:bg-blue-50 hover:text-blue-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {actionLabel}
          </button>
        )}
      </div>
      {children}
    </section>
  );
}

function ManagerTicketItem({ text, ticket }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-blue-700 ring-1 ring-blue-100 dark:bg-slate-950 dark:text-blue-200 dark:ring-blue-400/20">
              {ticket.ticketNumber || "-"}
            </span>
            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-black text-amber-700 ring-1 ring-amber-100 dark:bg-amber-500/15 dark:text-amber-200 dark:ring-amber-400/20">
              {ticket.riskLabel}
            </span>
          </div>
          <h4 className="mt-2 line-clamp-2 text-sm font-black text-slate-950 dark:text-white">
            {ticket.title}
          </h4>
          <p className="mt-2 line-clamp-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
            {ticket.category || text.unknownCategory} / {ticket.departmentName || ticket.department || "-"}
          </p>
        </div>
        <div className="grid min-w-[9rem] grid-cols-2 gap-2 text-xs">
          <ManagerMeta label={text.priorityLabel} value={formatStatus(ticket.priority || "-")} />
          <ManagerMeta label={text.dueLabel} value={formatDate(ticket.dueDate) || "-"} />
          <ManagerMeta label={text.ownerLabel} value={getAssigneeName(ticket, text.unassignedOwner)} />
          <ManagerMeta label={text.statusLabel} value={formatStatus(ticket.status || "-")} />
        </div>
      </div>
    </article>
  );
}

function ManagerRankList({ empty, items, total }) {
  if (!items.length) {
    return <ManagerEmptyState message={empty} />;
  }

  return (
    <div className="space-y-4">
      {items.map((item) => {
        const percentValue = total ? Math.round((item.value / total) * 100) : 0;
        return (
          <div key={item.label}>
            <div className="mb-2 flex items-center justify-between gap-3 text-xs">
              <span className="truncate font-black text-slate-700 dark:text-slate-200">
                {item.label}
              </span>
              <span className="shrink-0 text-slate-500 dark:text-slate-400">
                {item.value.toLocaleString()} / {percentValue}%
              </span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div
                className="h-full rounded-full bg-blue-600"
                style={{ width: `${Math.max(percentValue, 4)}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ManagerMeta({ label, value }) {
  return (
    <div className="min-w-0 rounded-lg bg-white px-3 py-2 ring-1 ring-slate-200 dark:bg-slate-950 dark:ring-slate-800">
      <p className="text-[10px] font-bold uppercase text-slate-400">{label}</p>
      <p className="mt-1 truncate font-bold text-slate-700 dark:text-slate-200">{value}</p>
    </div>
  );
}

function ManagerEmptyState({ loading, loadingLabel = "Loading...", message }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 p-5 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
      {loading ? loadingLabel : message}
    </div>
  );
}

function buildRankData(items, getLabel, limit) {
  return Object.entries(
    items.reduce((acc, item) => {
      const label = getLabel(item);
      acc[label] = (acc[label] || 0) + 1;
      return acc;
    }, {}),
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([label, value]) => ({ label, value }));
}

function getManagerTicketRiskRank(ticket) {
  if (isOverdue(ticket)) return 0;
  if (!ticket.assignedTo && ticket.priority === "critical") return 1;
  if (!ticket.assignedTo && ticket.priority === "high") return 2;
  if (isDueSoon(ticket)) return 3;
  if (ticket.priority === "critical") return 4;
  if (ticket.priority === "high") return 5;
  if (!ticket.assignedTo) return 6;
  return 99;
}

function getManagerTicketRiskLabel(ticket, text) {
  if (isOverdue(ticket)) return text.overdueRisk;
  if (!ticket.assignedTo && ["critical", "high"].includes(ticket.priority)) {
    return text.unassignedUrgentRisk;
  }
  if (isDueSoon(ticket)) return text.dueSoonRisk;
  if (["critical", "high"].includes(ticket.priority)) return text.urgentRisk;
  if (!ticket.assignedTo) return text.unassignedRisk;
  return text.needsTriage;
}

function getAssigneeName(ticket, fallback = "Unassigned") {
  if (!ticket?.assignedTo) return fallback;
  if (typeof ticket.assignedTo === "string") return ticket.assignedTo;
  return ticket.assignedTo.name || ticket.assignedTo.email || fallback;
}

function formatDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("th-TH", {
    day: "2-digit",
    month: "short",
  });
}

function formatStatus(status = "") {
  return status.replace("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function getManagerDashboardText(t) {
  return {
    active: pickText(t, "managerDashboard.active", "Active work"),
    activeDetail: pickText(t, "managerDashboard.activeDetail", "Tickets not closed in your scope"),
    analyticsEyebrow: pickText(t, "managerDashboard.analyticsEyebrow", "Analytics"),
    analyticsTitle: pickText(t, "managerDashboard.analyticsTitle", "Deeper performance view"),
    description: pickText(
      t,
      "managerDashboard.description",
      "Start with work that needs a manager decision, then open analytics when you want trends and performance detail.",
    ),
    dueLabel: pickText(t, "managerDashboard.dueLabel", "Due"),
    dueSoon: pickText(t, "managerDashboard.dueSoon", "Due soon"),
    dueSoonDetail: pickText(t, "managerDashboard.dueSoonDetail", "Active tickets close to due time"),
    dueSoonRisk: pickText(t, "managerDashboard.dueSoonRisk", "Due soon"),
    eyebrow: pickText(t, "managerDashboard.eyebrow", "Manager operations"),
    focusQueue: pickText(t, "managerDashboard.focusQueue", "Manager focus queue"),
    hideAnalytics: pickText(t, "managerDashboard.hideAnalytics", "Hide analytics"),
    loading: pickText(t, "common.loadingPage", "Loading page..."),
    monthlyReport: pickText(t, "managerDashboard.monthlyReport", "Monthly report"),
    needsTriage: pickText(t, "managerDashboard.needsTriage", "Needs triage"),
    needsTriageDetail: pickText(t, "managerDashboard.needsTriageDetail", "Unassigned, urgent, overdue, or due soon"),
    noCategoryData: pickText(t, "managerDashboard.noCategoryData", "No issue category data yet."),
    noFocusTickets: pickText(t, "managerDashboard.noFocusTickets", "No manager-focus tickets need attention right now."),
    noStatusData: pickText(t, "managerDashboard.noStatusData", "No status data yet."),
    noWorkloadData: pickText(t, "managerDashboard.noWorkloadData", "No active tickets for workload view yet."),
    openQueue: pickText(t, "managerDashboard.openQueue", "Open work queue"),
    operationsView: pickText(t, "managerDashboard.operationsView", "Operations"),
    overdue: pickText(t, "managerDashboard.overdue", "Overdue"),
    overdueDetail: pickText(t, "managerDashboard.overdueDetail", "Active tickets past due"),
    overdueRisk: pickText(t, "managerDashboard.overdueRisk", "Overdue"),
    ownerLabel: pickText(t, "managerDashboard.ownerLabel", "Owner"),
    priorityLabel: pickText(t, "managerDashboard.priorityLabel", "Priority"),
    recurringIssues: pickText(t, "managerDashboard.recurringIssues", "Recurring issue categories"),
    statusLabel: pickText(t, "managerDashboard.statusLabel", "Status"),
    statusMix: pickText(t, "managerDashboard.statusMix", "Status mix"),
    teamLoad: pickText(t, "managerDashboard.teamLoad", "Team workload"),
    title: pickText(t, "managerDashboard.title", "Team operations dashboard"),
    unassignedOwner: pickText(t, "managerDashboard.unassignedOwner", "Unassigned"),
    unassignedRisk: pickText(t, "managerDashboard.unassignedRisk", "Unassigned"),
    unassignedUrgent: pickText(t, "managerDashboard.unassignedUrgent", "Urgent unassigned"),
    unassignedUrgentDetail: pickText(t, "managerDashboard.unassignedUrgentDetail", "High/Critical without an owner"),
    unassignedUrgentRisk: pickText(t, "managerDashboard.unassignedUrgentRisk", "Urgent unassigned"),
    unknownCategory: pickText(t, "managerDashboard.unknownCategory", "Uncategorized"),
    unknownStatus: pickText(t, "managerDashboard.unknownStatus", "Unknown"),
    urgentRisk: pickText(t, "managerDashboard.urgentRisk", "Urgent work"),
    viewAnalytics: pickText(t, "managerDashboard.viewAnalytics", "View analytics"),
  };
}

function pickText(t, key, fallback) {
  const value = t?.(key);
  return value && value !== key ? value : fallback;
}

export default ManagerOperationsDashboard;
