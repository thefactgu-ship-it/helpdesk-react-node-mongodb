import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import StatCard from "./StatCard";
import { getCompletionStats, getSuccessDetail, isCompletedTicket } from "../utils/ticketMetrics";

const purple = "#8b5cf6";
const purpleDark = "#a78bfa";
const gridLight = "#e5e7eb";
const gridDark = "#334155";
const textLight = "#64748b";
const textDark = "#cbd5e1";

function formatStatus(status) {
  return status.replace("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function daysBetween(start, end = new Date()) {
  const diff = end - new Date(start);
  return Math.max(0, Math.ceil(diff / 86400000));
}

function hoursUntil(value, now = new Date()) {
  if (!value) return null;
  return Math.ceil((new Date(value) - now) / 3600000);
}

function getAssigneeName(ticket) {
  return ticket.assignedTo?.name || ticket.assignedTo?.email || "Unassigned";
}

function getEscalationLevel(ticket, now = new Date()) {
  if (isCompletedTicket(ticket)) return null;

  const remainingHours = hoursUntil(ticket.dueDate, now);
  const unassigned = !ticket.assignedTo;

  if (remainingHours !== null && remainingHours < 0) return "L2";
  if (ticket.priority === "critical" && unassigned) return "L2";
  if (ticket.priority === "critical") return "L1";
  if (remainingHours !== null && remainingHours <= 4) return "L1";
  if (ticket.priority === "high" && unassigned) return "L1";

  return null;
}

function getEscalationReason(ticket, now = new Date()) {
  const remainingHours = hoursUntil(ticket.dueDate, now);
  if (remainingHours !== null && remainingHours < 0) {
    return `${Math.abs(remainingHours)}h overdue`;
  }
  if (!ticket.assignedTo) return "Unassigned";
  if (remainingHours !== null && remainingHours <= 4) return `${remainingHours}h left`;
  return ticket.priority === "critical" ? "Critical priority" : "Needs review";
}

function getWeekLabel(date) {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function buildDashboardData(tickets) {
  const total = tickets.length;
  const open = tickets.filter((ticket) => ticket.status === "open").length;
  const resolved = tickets.filter((ticket) => ticket.status === "resolved").length;
  const closed = tickets.filter((ticket) => ticket.status === "closed").length;
  const overdue = tickets.filter((ticket) => ticket.isOverdue).length;
  const activeTickets = tickets.filter(
    (ticket) => !isCompletedTicket(ticket),
  );
  const completionStats = getCompletionStats(tickets);
  const now = new Date();

  const avgDaysOpen = activeTickets.length
    ? Math.round(
        activeTickets.reduce(
          (sum, ticket) => sum + daysBetween(ticket.createdAt),
          0,
        ) / activeTickets.length,
      )
    : 0;

  const statusLabels = ["open", "in_progress", "resolved", "closed"];
  const statusData = statusLabels.map((status) => ({
    name: formatStatus(status),
    value: tickets.filter((ticket) => ticket.status === status).length,
    percent: total
      ? Math.round(
          (tickets.filter((ticket) => ticket.status === status).length / total) *
            100,
        )
      : 0,
  }));

  const categoryData = Object.entries(
    tickets.reduce((acc, ticket) => {
      const category = ticket.category || "General";
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {}),
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, value]) => ({
      name,
      value,
      percent: total ? Math.round((value / total) * 100) : 0,
    }));

  const severityData = [
    {
      name: "Critical",
      value: tickets.filter((ticket) => ticket.priority === "critical").length,
    },
    {
      name: "High",
      value: tickets.filter((ticket) => ticket.priority === "high").length,
    },
    {
      name: "Medium",
      value: tickets.filter((ticket) => ticket.priority === "medium").length,
    },
    {
      name: "Low",
      value: tickets.filter((ticket) => ticket.priority === "low").length,
    },
    {
      name: "Unassigned",
      value: tickets.filter((ticket) => !ticket.assignedTo).length,
    },
  ];

  const openDayBuckets = [
    { name: "1-5", min: 0, max: 5 },
    { name: "6-10", min: 6, max: 10 },
    { name: "11-15", min: 11, max: 15 },
    { name: "16-20", min: 16, max: 20 },
    { name: "21-25", min: 21, max: 25 },
    { name: ">25", min: 26, max: Infinity },
  ].map((bucket) => ({
    name: bucket.name,
    value: activeTickets.filter((ticket) => {
      const openDays = daysBetween(ticket.createdAt);
      return openDays >= bucket.min && openDays <= bucket.max;
    }).length,
  }));

  const weeklyTrend = Array.from({ length: 9 }, (_, index) => {
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    end.setDate(end.getDate() - (8 - index) * 7);

    const start = new Date(end);
    start.setDate(end.getDate() - 6);
    start.setHours(0, 0, 0, 0);

    return {
      name: getWeekLabel(start),
      value: tickets.filter((ticket) => {
        const createdAt = new Date(ticket.createdAt);
        return createdAt >= start && createdAt <= end;
      }).length,
    };
  });

  const slaTickets = activeTickets.filter((ticket) => ticket.dueDate);
  const breachedSla = slaTickets.filter((ticket) => hoursUntil(ticket.dueDate, now) < 0);
  const dueSoon = slaTickets.filter((ticket) => {
    const remainingHours = hoursUntil(ticket.dueDate, now);
    return remainingHours >= 0 && remainingHours <= 4;
  });
  const unassignedUrgent = activeTickets.filter(
    (ticket) =>
      !ticket.assignedTo &&
      ["critical", "high"].includes(ticket.priority),
  );
  const escalationQueue = activeTickets
    .map((ticket) => ({
      ...ticket,
      escalationLevel: getEscalationLevel(ticket, now),
      escalationReason: getEscalationReason(ticket, now),
      remainingHours: hoursUntil(ticket.dueDate, now),
    }))
    .filter((ticket) => ticket.escalationLevel)
    .sort((a, b) => {
      const levelRank = { L2: 0, L1: 1 };
      const levelDiff = levelRank[a.escalationLevel] - levelRank[b.escalationLevel];
      if (levelDiff) return levelDiff;
      return (a.remainingHours ?? 9999) - (b.remainingHours ?? 9999);
    })
    .slice(0, 6);

  return {
    avgDaysOpen,
    categoryData,
    closed,
    open,
    openDayBuckets,
    overdue,
    resolved,
    completionStats,
    severityData,
    sla: {
      breached: breachedSla.length,
      dueSoon: dueSoon.length,
      escalationQueue,
      unassignedUrgent: unassignedUrgent.length,
    },
    statusData,
    total,
    weeklyTrend,
  };
}

function DashboardAnalytics({ darkMode, tickets }) {
  const data = buildDashboardData(tickets);
  const axisColor = darkMode ? textDark : textLight;
  const gridColor = darkMode ? gridDark : gridLight;
  const accent = darkMode ? purpleDark : purple;

  const chartTheme = {
    axisColor,
    gridColor,
    accent,
    tooltipClass:
      "rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 shadow-lg dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200",
  };

  return (
    <div className="space-y-5">
      <section className="grid grid-cols-1 gap-3 md:grid-cols-5">
        <StatCard
          title="Tickets"
          value={data.total.toLocaleString()}
          icon="T"
          bars={[36, 50, 62, 48]}
        />
        <StatCard
          title="Open"
          value={data.open.toLocaleString()}
          detail={`${percent(data.open, data.total)}%`}
          icon="O"
          bars={[24, 42, 70, 38]}
        />
        <StatCard
          title="Resolved"
          value={data.resolved.toLocaleString()}
          detail={`${percent(data.resolved, data.total)}%`}
          icon="R"
          bars={[30, 45, 58, 35]}
        />
        <StatCard
          title="Avg. Days Open"
          value={data.avgDaysOpen}
          icon="D"
          bars={[20, 28, 56, 44]}
        />
        <StatCard
          title="Success Rate"
          value={`${data.completionStats.successRate}%`}
          detail={getSuccessDetail(data.completionStats)}
          icon="S"
          bars={[26, 40, 75, 36]}
        />
      </section>

      <section className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <StatCard
          title="SLA Breached"
          value={data.sla.breached.toLocaleString()}
          detail="active tickets"
          icon="!"
          bars={[72, 48, 66, 32]}
        />
        <StatCard
          title="Due In 4h"
          value={data.sla.dueSoon.toLocaleString()}
          detail="needs follow-up"
          icon="4"
          bars={[24, 54, 78, 42]}
        />
        <StatCard
          title="Urgent Unassigned"
          value={data.sla.unassignedUrgent.toLocaleString()}
          detail="high or critical"
          icon="U"
          bars={[40, 62, 36, 70]}
        />
        <StatCard
          title="Escalation Queue"
          value={data.sla.escalationQueue.length.toLocaleString()}
          detail="L1 / L2 watch"
          icon="E"
          bars={[52, 34, 74, 58]}
        />
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <DashboardPanel className="xl:col-span-12" title="SLA And Escalation Queue">
          {data.sla.escalationQueue.length ? (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {data.sla.escalationQueue.map((ticket) => (
                <EscalationItem key={ticket._id || ticket.id} ticket={ticket} />
              ))}
            </div>
          ) : (
            <EmptyState message="No tickets currently need escalation" />
          )}
        </DashboardPanel>

        <DashboardPanel className="xl:col-span-3" title="By Ticket Status">
          <div className="space-y-5">
            {data.statusData.map((item) => (
              <ProgressRow
                key={item.name}
                label={item.name}
                percent={item.percent}
                value={item.value}
              />
            ))}
          </div>
        </DashboardPanel>

        <DashboardPanel className="xl:col-span-6" title="Tickets Weekly Trend">
          <div className="mb-4 flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
            <LegendDot label="Created" />
            <span className="font-semibold text-slate-800 dark:text-slate-100">
              {data.weeklyTrend.reduce((sum, item) => sum + item.value, 0)} total
            </span>
            <span>last 9 weeks</span>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.weeklyTrend}>
                <CartesianGrid stroke={chartTheme.gridColor} strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: chartTheme.axisColor, fontSize: 11 }}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: chartTheme.axisColor, fontSize: 11 }}
                  tickLine={false}
                />
                <Tooltip content={<ChartTooltip />} />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={chartTheme.accent}
                  strokeWidth={3}
                  dot={{ fill: chartTheme.accent, r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </DashboardPanel>

        <DashboardPanel className="xl:col-span-3" title="By Severity">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.severityData}>
                <XAxis
                  dataKey="name"
                  tick={{ fill: chartTheme.axisColor, fontSize: 10 }}
                  tickLine={false}
                />
                <YAxis hide allowDecimals={false} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="value" radius={[14, 14, 0, 0]} fill={accent}>
                  {data.severityData.map((entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={index === 0 || index === 1 ? "#ec4899" : accent}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </DashboardPanel>

        <DashboardPanel className="xl:col-span-3" title="By Issue Category">
          <div className="space-y-4">
            {data.categoryData.map((item) => (
              <ProgressRow
                key={item.name}
                label={item.name}
                percent={item.percent}
                value={item.value}
              />
            ))}
            {!data.categoryData.length && (
              <EmptyState message="No issue category data yet" />
            )}
          </div>
        </DashboardPanel>

        <DashboardPanel className="xl:col-span-6" title="By Success Rate">
          <div className="flex h-full min-h-40 flex-col justify-center">
            <div className="mb-5 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>0%</span>
              <span>{getSuccessDetail(data.completionStats)}</span>
              <span>50%</span>
              <span>100%</span>
            </div>
            <div className="relative h-5 rounded-full bg-slate-100 dark:bg-slate-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-600 via-purple-500 to-violet-400"
                style={{ width: `${data.completionStats.successRate}%` }}
              />
              <div
                className="absolute top-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-4 border-white bg-violet-500 text-sm font-bold text-white shadow-lg dark:border-slate-950"
                style={{ left: `${Math.max(8, data.completionStats.successRate)}%` }}
              >
                {data.completionStats.successRate}
              </div>
            </div>
          </div>
        </DashboardPanel>

        <DashboardPanel className="xl:col-span-3" title="By Open Days">
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.openDayBuckets}>
                <XAxis
                  dataKey="name"
                  tick={{ fill: chartTheme.axisColor, fontSize: 10 }}
                  tickLine={false}
                />
                <YAxis hide allowDecimals={false} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="value" radius={[12, 12, 0, 0]} fill={accent} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </DashboardPanel>
      </section>
    </div>
  );
}

function EscalationItem({ ticket }) {
  const isL2 = ticket.escalationLevel === "L2";

  return (
    <article className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-3 flex items-center justify-between gap-3">
        <span
          className={`rounded-full px-2.5 py-1 text-[11px] font-black ${
            isL2
              ? "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-200"
              : "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200"
          }`}
        >
          {ticket.escalationLevel}
        </span>
        <span className="truncate text-[11px] font-bold uppercase text-slate-400">
          {ticket.ticketNumber || ticket.priority}
        </span>
      </div>
      <h4 className="line-clamp-2 text-sm font-black text-slate-900 dark:text-white">
        {ticket.title}
      </h4>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <EscalationMeta label="Reason" value={ticket.escalationReason} />
        <EscalationMeta label="Owner" value={getAssigneeName(ticket)} />
        <EscalationMeta label="Priority" value={formatStatus(ticket.priority)} />
        <EscalationMeta
          label="Due"
          value={ticket.dueDate ? new Date(ticket.dueDate).toLocaleString() : "No SLA"}
        />
      </div>
    </article>
  );
}

function EscalationMeta({ label, value }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
        {label}
      </p>
      <p className="truncate font-semibold text-slate-700 dark:text-slate-200">
        {value}
      </p>
    </div>
  );
}

function percent(value, total) {
  if (!total) return 0;
  return Math.round((value / total) * 100);
}

function DashboardPanel({ children, className = "", title }) {
  return (
    <section
      className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950/80 ${className}`}
    >
      <h3 className="mb-5 text-xs font-bold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
        {title}
      </h3>
      {children}
    </section>
  );
}

function ProgressRow({ label, percent, value }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3 text-xs">
        <span className="truncate font-semibold text-slate-600 dark:text-slate-300">
          {label}
        </span>
        <span className="shrink-0 text-slate-500 dark:text-slate-400">
          {value.toLocaleString()} / {percent}%
        </span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div
          className="h-full rounded-full bg-gradient-to-r from-violet-600 to-purple-400"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

function LegendDot({ label }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="h-2.5 w-2.5 rounded-full bg-violet-500" />
      {label}
    </span>
  );
}

function ChartTooltip({ active, label, payload }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 shadow-lg dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
      <p className="font-semibold">{label}</p>
      <p>{payload[0].value.toLocaleString()} tickets</p>
    </div>
  );
}

function EmptyState({ message }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 p-5 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
      {message}
    </div>
  );
}

export default DashboardAnalytics;
