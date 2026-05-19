import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useState } from "react";
import {
  Activity,
  CalendarDays,
  CheckCircle2,
  FileText,
  Gauge,
  Star,
} from "lucide-react";
import StatCard from "../components/StatCard";
import { getCompletionStats, getSuccessDetail, isCompletedTicket } from "../utils/ticketMetrics";
import {
  exportReportPrompt,
  getHotelScopeLabel,
  makeReportFilename,
} from "../utils/reportExport";

function MonthlyReportPage({ hotels = [], selectedHotelId = "all", tickets = [] }) {
  const [selectedMonth, setSelectedMonth] = useState(getMonthInputValue(new Date()));
  const report = buildMonthlyReport(tickets, selectedMonth);
  const scopeLabel = getHotelScopeLabel(selectedHotelId, hotels);
  const filenameBase = makeReportFilename("helpdesk-monthly", selectedMonth, scopeLabel);
  const exportPayload = {
    filename: filenameBase,
    periodLabel: report.monthLabel,
    report,
    reportTitle: "Monthly Helpdesk Report",
    scopeLabel,
    tickets: report.filteredTickets,
  };

  return (
    <div className="space-y-5">
      <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:shadow-slate-950/40 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-blue-600 dark:text-blue-300">
            Monthly Report
          </p>
          <h3 className="text-2xl font-black text-slate-950 dark:text-white">
            {report.monthLabel}
          </h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Summary is calculated from tickets created in the selected month.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
              Filter month
            </span>
            <input
              type="month"
              value={selectedMonth}
              onChange={(event) => setSelectedMonth(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-blue-400 md:w-56"
            />
          </label>

          <div className="flex">
            <button
              type="button"
              onClick={() => exportReportPrompt({ ...exportPayload, filename: `${filenameBase}-ai-prompt.txt` })}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:border-blue-200 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-blue-500"
            >
              <FileText size={16} />
              Export Prompt
            </button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 md:grid-cols-5">
        <StatCard title={report.shortMonthLabel} value={report.total} detail="tickets" icon={CalendarDays} />
        <StatCard title="Completion" value={`${report.completionRate}%`} detail={`${report.completedCount} done`} icon={CheckCircle2} />
        <StatCard title="Success Rate" value={`${report.successRate}%`} detail={report.successDetail} icon={Gauge} />
        <StatCard title="Open" value={report.open} detail="active" icon={Activity} />
        <StatCard title="Avg. Rating" value={report.avgSatisfactionLabel} detail={`${report.satisfactionCount} ratings`} icon={Star} />
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <ReportPanel className="xl:col-span-8" title="Monthly Ticket Trend">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={report.trend}>
                <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 11 }} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fill: "#64748b", fontSize: 11 }} tickLine={false} />
                <Tooltip content={<ChartTooltip labelSuffix="tickets" />} />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#2563eb"
                  strokeWidth={3}
                  dot={{ fill: "#2563eb", r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ReportPanel>

        <ReportPanel className="xl:col-span-4" title="Status Summary">
          <div className="space-y-4">
            {report.statusSummary.map((item) => (
              <ProgressRow key={item.name} {...item} total={report.total} />
            ))}
          </div>
        </ReportPanel>

        <ReportPanel className="xl:col-span-4" title="Top Categories">
          <div className="space-y-4">
            {report.topCategories.map((item) => (
              <ProgressRow key={item.name} {...item} total={report.total} />
            ))}
            {!report.topCategories.length && <EmptyState message="No category data" />}
          </div>
        </ReportPanel>

        <ReportPanel className="xl:col-span-4" title="Priority Summary">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={report.prioritySummary}>
                <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 11 }} tickLine={false} />
                <YAxis hide allowDecimals={false} />
                <Tooltip content={<ChartTooltip labelSuffix="tickets" />} />
                <Bar dataKey="value" radius={[12, 12, 0, 0]} fill="#2563eb" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ReportPanel>

        <ReportPanel className="xl:col-span-4" title="Monthly Snapshot">
          <div className="grid gap-3 text-sm">
            <SnapshotRow label="Most common category" value={report.topCategoryName} />
            <SnapshotRow label="Critical tickets" value={report.critical} />
            <SnapshotRow label="Closed tickets" value={report.closed} />
            <SnapshotRow label="Overdue tickets" value={report.overdue} />
            <SnapshotRow label="Avg. resolve time" value={`${report.avgResolutionHours}h`} />
            <SnapshotRow label="Active tickets" value={report.active} />
          </div>
        </ReportPanel>
      </section>
    </div>
  );
}

function buildMonthlyReport(tickets, selectedMonth) {
  const selectedDate = parseMonthInputValue(selectedMonth);
  const monthTickets = tickets.filter((ticket) => {
    const createdAt = new Date(ticket.createdAt);
    return (
      createdAt.getMonth() === selectedDate.getMonth() &&
      createdAt.getFullYear() === selectedDate.getFullYear()
    );
  });

  const total = monthTickets.length;
  const resolved = monthTickets.filter((ticket) => ticket.status === "resolved").length;
  const closed = monthTickets.filter((ticket) => ticket.status === "closed").length;
  const open = monthTickets.filter((ticket) => ticket.status === "open").length;
  const active = monthTickets.filter((ticket) => !isCompletedTicket(ticket)).length;
  const overdue = monthTickets.filter((ticket) => isOverdue(ticket)).length;
  const critical = monthTickets.filter((ticket) => ticket.priority === "critical").length;

  const resolvedWithTime = monthTickets.filter((ticket) => ticket.resolvedAt);
  const avgResolutionHours = resolvedWithTime.length
    ? Math.round(
        resolvedWithTime.reduce((sum, ticket) => {
          return sum + (new Date(ticket.resolvedAt) - new Date(ticket.createdAt)) / 3600000;
        }, 0) / resolvedWithTime.length,
      )
    : 0;

  const topCategories = countBy(monthTickets, "category")
    .slice(0, 5)
    .map(([name, value]) => ({ name, value }));
  const completionStats = getCompletionStats(monthTickets);

  return {
    active,
    avgResolutionHours,
    avgSatisfactionLabel: completionStats.satisfactionCount
      ? `${completionStats.avgSatisfactionScore}/5`
      : "-",
    closed,
    completedCount: completionStats.completedCount,
    completionRate: completionStats.completionRate,
    critical,
    filteredTickets: monthTickets,
    monthLabel: selectedDate.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    }),
    open,
    overdue,
    prioritySummary: ["critical", "high", "medium", "low"].map((priority) => ({
      name: capitalize(priority),
      value: monthTickets.filter((ticket) => ticket.priority === priority).length,
    })),
    resolved,
    satisfactionCount: completionStats.satisfactionCount,
    shortMonthLabel: selectedDate.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    }),
    successDetail: getSuccessDetail(completionStats),
    successRate: completionStats.successRate,
    statusSummary: ["open", "in_progress", "resolved", "closed"].map((status) => ({
      name: formatStatus(status),
      value: monthTickets.filter((ticket) => ticket.status === status).length,
    })),
    topCategories,
    topCategoryName: topCategories[0]?.name || "-",
    total,
    trend: buildSixMonthTrend(tickets),
  };
}

function getMonthInputValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function parseMonthInputValue(value) {
  if (!value) return new Date();

  const [year, month] = value.split("-").map(Number);
  return new Date(year, month - 1, 1);
}

function buildSixMonthTrend(tickets) {
  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date();
    date.setDate(1);
    date.setMonth(date.getMonth() - (5 - index));

    return {
      name: date.toLocaleDateString("en-US", { month: "short" }),
      total: tickets.filter((ticket) => {
        const createdAt = new Date(ticket.createdAt);
        return (
          createdAt.getMonth() === date.getMonth() &&
          createdAt.getFullYear() === date.getFullYear()
        );
      }).length,
    };
  });
}

function countBy(items, key) {
  return Object.entries(
    items.reduce((acc, item) => {
      const name = item[key] || "General";
      acc[name] = (acc[name] || 0) + 1;
      return acc;
    }, {}),
  ).sort((a, b) => b[1] - a[1]);
}

function isOverdue(ticket) {
  if (!ticket.dueDate) return false;
  if (["resolved", "closed"].includes(ticket.status)) return false;
  return new Date() > new Date(ticket.dueDate);
}

function formatStatus(status) {
  return status.replace("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function ReportPanel({ children, className = "", title }) {
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

function ProgressRow({ name, total, value }) {
  const percent = total ? Math.round((value / total) * 100) : 0;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3 text-xs">
        <span className="truncate font-semibold text-slate-600 dark:text-slate-300">
          {name}
        </span>
        <span className="shrink-0 text-slate-500 dark:text-slate-400">
          {value.toLocaleString()} / {percent}%
        </span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div
          className="h-full rounded-full bg-gradient-to-r from-blue-600 to-blue-400"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

function SnapshotRow({ label, value }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
      <span className="text-slate-500 dark:text-slate-400">{label}</span>
      <strong className="text-slate-900 dark:text-white">{value}</strong>
    </div>
  );
}

function ChartTooltip({ active, label, labelSuffix, payload }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 shadow-lg dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
      <p className="font-semibold">{label}</p>
      <p>
        {payload[0].value.toLocaleString()} {labelSuffix}
      </p>
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

export default MonthlyReportPage;
