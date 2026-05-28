import { useState } from "react";
import {
  Activity,
  CheckCircle2,
  ClipboardList,
  FileText,
  Gauge,
  Star,
} from "lucide-react";
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
import StatCard from "../components/StatCard";
import PeriodExecutiveSummary from "../components/PeriodExecutiveSummary";
import ThemedSelect from "../components/ThemedSelect";
import { buildExecutiveReportInsights } from "../utils/periodReportInsights";
import { getCompletionStats, getSuccessDetail, isCompletedTicket } from "../utils/ticketMetrics";
import {
  exportReportPrompt,
  getHotelScopeLabel,
  makeReportFilename,
} from "../utils/reportExport";

function QuarterlyYearlyPage({ hotels = [], selectedHotelId = "all", tickets = [] }) {
  const [mode, setMode] = useState("quarterly");
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const report = buildPeriodReport(tickets, Number(year), mode);
  const years = getAvailableYears(tickets);
  const scopeLabel = getHotelScopeLabel(selectedHotelId, hotels);
  const periodLabel = mode === "quarterly" ? `Quarterly ${year}` : `Yearly ${year}`;
  const filenameBase = makeReportFilename(`helpdesk-${mode}`, year, scopeLabel);
  const exportPayload = {
    filename: filenameBase,
    periodLabel,
    report,
    reportTitle: mode === "quarterly" ? "Quarterly Helpdesk Report" : "Yearly Helpdesk Report",
    scopeLabel,
    tickets: report.filteredTickets,
  };

  return (
    <div className="space-y-5">
      <section className="ops-panel flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="ops-section-label mb-2">
            Reports
          </p>
          <h3 className="text-2xl font-black text-slate-950 dark:text-white">
            Quarterly / Yearly
          </h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Compare ticket trend, waiting confirmation, closed work, and overdue volume by period.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
              View
            </span>
            <ThemedSelect
              className="sm:w-44"
              value={mode}
              onChange={setMode}
              options={[
                { value: "quarterly", label: "Quarterly", prefix: "Q" },
                { value: "yearly", label: "Yearly", prefix: "Y" },
              ]}
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
              Year
            </span>
            <ThemedSelect
              className="sm:w-36"
              value={year}
              onChange={setYear}
              options={years.map((item) => ({
                value: String(item),
                label: String(item),
                prefix: String(item).slice(2),
              }))}
            />
          </label>

          <div className="flex">
            <button
              type="button"
              onClick={() => exportReportPrompt({ ...exportPayload, filename: `${filenameBase}-ai-prompt.txt` })}
              className="ops-button-secondary px-4 py-3 text-sm"
            >
              <FileText size={16} />
              Export Prompt
            </button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 md:grid-cols-5">
        <StatCard className="pl-5" title="Tickets" value={report.total} detail={year} icon={ClipboardList} />
        <StatCard className="pl-5" title="Waiting Confirm" value={report.resolved} detail="resolved, not closed" icon={Activity} />
        <StatCard className="pl-5" title="Closed" value={report.closed} detail={`${report.completionRate}% of tickets`} icon={CheckCircle2} />
        <StatCard className="pl-5" title="SLA Success" value={`${report.successRate}%`} detail={report.successDetail} icon={Gauge} />
        <StatCard className="pl-5" title="Avg. Rating" value={report.avgSatisfactionLabel} detail={`${report.satisfactionCount} ratings`} icon={Star} />
      </section>

      <PeriodExecutiveSummary report={report} />

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <ReportPanel className="xl:col-span-8" title={`${report.label} Ticket Trend`}>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={report.periods}>
                <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 11 }} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fill: "#64748b", fontSize: 11 }} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ fill: "#10b981", r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ReportPanel>

        <ReportPanel className="xl:col-span-4" title="Year Snapshot">
          <div className="grid gap-3 text-sm">
            <SnapshotRow label="Best period" value={report.bestPeriod} />
            <SnapshotRow label="Most overdue period" value={report.mostOverduePeriod} />
            <SnapshotRow label="Waiting confirmation" value={report.resolved} />
            <SnapshotRow label="Closed tickets" value={report.closed} />
            <SnapshotRow label="Avg. resolve time" value={`${report.avgResolutionHours}h`} />
            <SnapshotRow label="Active tickets" value={report.active} />
          </div>
        </ReportPanel>

        <ReportPanel className="xl:col-span-12" title="Active / Waiting / Closed / Overdue Comparison">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={report.periods}>
                <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 11 }} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fill: "#64748b", fontSize: 11 }} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="active" fill="#64748b" radius={[8, 8, 0, 0]} />
                <Bar dataKey="resolved" fill="#f59e0b" radius={[8, 8, 0, 0]} />
                <Bar dataKey="closed" fill="#22c55e" radius={[8, 8, 0, 0]} />
                <Bar dataKey="overdue" fill="#e11d48" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex flex-wrap gap-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <LegendDot color="#64748b" label="Active" />
            <LegendDot color="#f59e0b" label="Waiting confirm" />
            <LegendDot color="#22c55e" label="Closed" />
            <LegendDot color="#e11d48" label="Overdue" />
          </div>
        </ReportPanel>
      </section>
    </div>
  );
}

function buildPeriodReport(tickets, year, mode) {
  const yearTickets = tickets.filter((ticket) => {
    return new Date(ticket.createdAt).getFullYear() === year;
  });
  const periods = mode === "quarterly"
    ? buildQuarterlyPeriods(yearTickets)
    : buildYearlyPeriods(yearTickets);
  const total = yearTickets.length;
  const resolved = yearTickets.filter((ticket) => ticket.status === "resolved").length;
  const closed = yearTickets.filter((ticket) => ticket.status === "closed").length;
  const active = yearTickets.filter((ticket) => !isCompletedTicket(ticket)).length;
  const overdue = yearTickets.filter((ticket) => isOverdue(ticket)).length;
  const resolvedWithTime = yearTickets.filter((ticket) => ticket.resolvedAt);
  const avgResolutionHours = resolvedWithTime.length
    ? Math.round(
        resolvedWithTime.reduce((sum, ticket) => {
          return sum + (new Date(ticket.resolvedAt) - new Date(ticket.createdAt)) / 3600000;
        }, 0) / resolvedWithTime.length,
      )
    : 0;

  const completionStats = getCompletionStats(yearTickets);
  const executiveInsights = buildExecutiveReportInsights(yearTickets, {
    active,
    overdue,
    resolved,
    successRate: completionStats.successRate,
  });

  return {
    active,
    avgResolutionHours,
    avgSatisfactionLabel: completionStats.satisfactionCount
      ? `${completionStats.avgSatisfactionScore}/5`
      : "-",
    bestPeriod: getTopPeriod(periods, "total"),
    closed,
    completedCount: completionStats.completedCount,
    completionRate: completionStats.completionRate,
    filteredTickets: yearTickets,
    label: mode === "quarterly" ? "Quarterly" : "Yearly",
    mostOverduePeriod: getTopPeriod(periods, "overdue"),
    overdue,
    periods,
    resolved,
    ...executiveInsights,
    satisfactionCount: completionStats.satisfactionCount,
    successDetail: getSuccessDetail(completionStats),
    successRate: completionStats.successRate,
    total,
  };
}

function buildQuarterlyPeriods(tickets) {
  return ["Q1", "Q2", "Q3", "Q4"].map((name, index) => {
    const startMonth = index * 3;
    const periodTickets = tickets.filter((ticket) => {
      const month = new Date(ticket.createdAt).getMonth();
      return month >= startMonth && month <= startMonth + 2;
    });

    return buildPeriodItem(name, periodTickets);
  });
}

function buildYearlyPeriods(tickets) {
  const labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  return labels.map((name, month) => {
    const periodTickets = tickets.filter((ticket) => {
      return new Date(ticket.createdAt).getMonth() === month;
    });

    return buildPeriodItem(name, periodTickets);
  });
}

function buildPeriodItem(name, tickets) {
  const closed = tickets.filter((ticket) => ticket.status === "closed").length;
  const resolved = tickets.filter((ticket) => ticket.status === "resolved").length;

  return {
    active: tickets.filter((ticket) => !isCompletedTicket(ticket)).length,
    closed,
    name,
    overdue: tickets.filter((ticket) => isOverdue(ticket)).length,
    resolved,
    total: tickets.length,
  };
}

function getAvailableYears(tickets) {
  const currentYear = new Date().getFullYear();
  const years = new Set([currentYear]);

  tickets.forEach((ticket) => {
    years.add(new Date(ticket.createdAt).getFullYear());
  });

  return [...years].sort((a, b) => b - a);
}

function getTopPeriod(periods, key) {
  const top = [...periods].sort((a, b) => b[key] - a[key])[0];
  return top && top[key] ? `${top.name} (${top[key]})` : "-";
}

function isOverdue(ticket) {
  if (!ticket.dueDate) return false;
  if (["resolved", "closed"].includes(ticket.status)) return false;
  return new Date() > new Date(ticket.dueDate);
}

function ReportPanel({ children, className = "", title }) {
  return (
    <section
      className={`ops-panel ${className}`}
    >
      <h3 className="mb-5 text-xs font-bold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
        {title}
      </h3>
      {children}
    </section>
  );
}

function SnapshotRow({ label, value }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-purple-100/80 bg-white/90 p-4 dark:border-purple-400/10 dark:bg-white/5">
      <span className="text-slate-500 dark:text-slate-400">{label}</span>
      <strong className="text-slate-900 dark:text-white">{value}</strong>
    </div>
  );
}

function LegendDot({ color, label }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}

function ChartTooltip({ active, label, payload }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-purple-100 bg-white/95 px-3 py-2 text-xs text-slate-700 shadow-[0_16px_40px_rgba(29,10,52,0.16)] backdrop-blur-md dark:border-purple-400/15 dark:bg-[#140d24]/95 dark:text-slate-200">
      <p className="font-semibold">{label}</p>
      {payload.map((item) => (
        <p key={item.dataKey}>
          {item.name}: {item.value.toLocaleString()}
        </p>
      ))}
    </div>
  );
}

export default QuarterlyYearlyPage;
