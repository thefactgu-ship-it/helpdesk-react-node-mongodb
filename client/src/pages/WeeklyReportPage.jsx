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
import { useState } from "react";
import { Activity, CalendarDays, CheckCircle2, FileText, Gauge, Star } from "lucide-react";
import StatCard from "../components/StatCard";
import { getCompletionStats, isCompletedTicket } from "../utils/ticketMetrics";
import { exportReportPrompt, getHotelScopeLabel, makeReportFilename } from "../utils/reportExport";

const chartColors = {
  amber: "#f59e0b",
  axis: "#64748b",
  emerald: "#10b981",
  grid: "#dbe5e2",
  rose: "#e11d48",
  slate: "#334155",
  trend: "#0a1f23",
};

function WeeklyReportPage({ hotels = [], selectedHotelId = "all", t = (k) => k, tickets = [] }) {
  const [selectedWeek, setSelectedWeek] = useState(getWeekInputValue(new Date()));
  const report = buildWeeklyReport(tickets, selectedWeek, t);
  const scopeLabel = getHotelScopeLabel(selectedHotelId, hotels);
  const filenameBase = makeReportFilename("helpdesk-weekly", selectedWeek, scopeLabel);
  const exportPayload = {
    filename: filenameBase,
    periodLabel: report.weekLabel,
    report,
    reportTitle: t("reports.weekly.reportTitle"),
    scopeLabel,
    tickets: report.filteredTickets,
  };

  return (
    <div className="space-y-5">
      <section className="ops-panel flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="ops-section-label mb-2">{t("reports.weekly.eyebrow")}</p>
          <h3 className="text-2xl font-black text-slate-950 dark:text-white">{report.weekLabel}</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t("reports.weekly.description")}</p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">{t("reports.weekly.filterWeek")}</span>
            <input type="week" value={selectedWeek} onChange={(e) => setSelectedWeek(e.target.value)} className="ops-input font-bold md:w-56" />
          </label>

          <div className="flex">
            <button type="button" onClick={() => exportReportPrompt({ ...exportPayload, filename: `${filenameBase}-ai-prompt.txt` })} className="ops-button-secondary px-4 py-3 text-sm">
              <FileText size={16} />
              {t("reports.common.exportPrompt")}
            </button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 md:grid-cols-5">
        <StatCard className="pl-5" title={report.shortWeekLabel} value={report.total} detail={t("reports.common.tickets")} icon={CalendarDays} />
        <StatCard className="pl-5" title={t("reports.common.waitingConfirm")} value={report.resolved} detail={t("reports.common.resolvedNotClosed")} icon={Activity} />
        <StatCard className="pl-5" title={t("reports.common.closed")} value={report.closed} detail={t("reports.common.percentOfTickets", { percent: report.completionRate })} icon={CheckCircle2} />
        <StatCard className="pl-5" title={t("reports.common.slaSuccess")} value={`${report.successRate}%`} detail={report.successDetail} icon={Gauge} />
        <StatCard className="pl-5" title={t("reports.common.avgRating")} value={report.avgSatisfactionLabel} detail={t("reports.common.ratings", { count: report.satisfactionCount })} icon={Star} />
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <ReportPanel className="xl:col-span-8" title={t("reports.weekly.ticketTrend")}>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={report.trend}>
                <CartesianGrid stroke={chartColors.grid} strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fill: chartColors.axis, fontSize: 11 }} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fill: chartColors.axis, fontSize: 11 }} tickLine={false} />
                <Tooltip content={<ChartTooltip labelSuffix={t("reports.common.tickets")} />} />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke={chartColors.trend}
                  strokeWidth={3}
                  dot={{ fill: chartColors.trend, r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ReportPanel>

        <ReportPanel className="xl:col-span-4" title={t("reports.common.statusSummary")}>
          <div className="space-y-4">
            {report.statusSummary.map((item) => (
              <ProgressRow key={item.name} {...item} total={report.total} tone={getStatusTone(item.key)} />
            ))}
          </div>
        </ReportPanel>

        <ReportPanel className="xl:col-span-4" title={t("reports.common.topCategories")}>
          <div className="space-y-4">
            {report.topCategories.map((item, index) => (
              <ProgressRow key={item.name} {...item} total={report.total} tone={getCategoryTone(index)} />
            ))}
            {!report.topCategories.length && <EmptyState message={t("reports.common.noCategoryData")} />}
          </div>
        </ReportPanel>

        <ReportPanel className="xl:col-span-4" title={t("reports.common.prioritySummary")}>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={report.prioritySummary}>
                <XAxis dataKey="name" tick={{ fill: chartColors.axis, fontSize: 11 }} tickLine={false} />
                <YAxis hide allowDecimals={false} />
                <Tooltip content={<ChartTooltip labelSuffix={t("reports.common.tickets")} />} />
                <Bar dataKey="value" radius={[12, 12, 0, 0]}>
                  {report.prioritySummary.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ReportPanel>

        <ReportPanel className="xl:col-span-4" title={t("reports.weekly.snapshot")}>
          <div className="grid gap-3 text-sm">
            <SnapshotRow label={t("reports.common.mostCommonCategory")} value={report.topCategoryName} />
            <SnapshotRow label={t("reports.common.criticalTickets")} value={report.critical} />
            <SnapshotRow label={t("reports.common.waitingConfirmation")} value={report.resolved} />
            <SnapshotRow label={t("reports.common.closedTickets")} value={report.closed} />
            <SnapshotRow label={t("reports.common.overdueTickets")} value={report.overdue} />
            <SnapshotRow label={t("reports.common.avgResolveTime")} value={t("reports.common.hours", { value: report.avgResolutionHours })} />
            <SnapshotRow label={t("reports.common.activeTickets")} value={report.active} />
          </div>
        </ReportPanel>
      </section>
    </div>
  );
}

function buildWeeklyReport(tickets, selectedWeek, t) {
  const locale = t.language === "th" ? "th-TH" : "en-US";
  const selected = parseWeekInputValue(selectedWeek);
  const start = selected.start;
  const end = selected.end;

  const weekTickets = tickets.filter((ticket) => {
    const createdAt = new Date(ticket.createdAt);
    return createdAt >= start && createdAt <= end;
  });

  const total = weekTickets.length;
  const resolved = weekTickets.filter((ticket) => ticket.status === "resolved").length;
  const closed = weekTickets.filter((ticket) => ticket.status === "closed").length;
  const active = weekTickets.filter((ticket) => !isCompletedTicket(ticket)).length;
  const overdue = weekTickets.filter((ticket) => isOverdue(ticket)).length;
  const critical = weekTickets.filter((ticket) => ticket.priority === "critical").length;

  const resolvedWithTime = weekTickets.filter((ticket) => ticket.resolvedAt);
  const avgResolutionHours = resolvedWithTime.length
    ? Math.round(
        resolvedWithTime.reduce((sum, ticket) => sum + (new Date(ticket.resolvedAt) - new Date(ticket.createdAt)) / 3600000, 0) / resolvedWithTime.length,
      )
    : 0;

  const topCategories = countBy(weekTickets, "category").slice(0, 5).map(([name, value]) => ({ name, value }));
  const completionStats = getCompletionStats(weekTickets);

  const trend = Array.from({ length: 7 }, (_, idx) => {
    const day = new Date(start);
    day.setDate(start.getDate() + idx);
    const label = day.toLocaleDateString(locale, { month: "short", day: "numeric" });
    const count = weekTickets.filter((ticket) => {
      const created = new Date(ticket.createdAt);
      return created.getFullYear() === day.getFullYear() && created.getMonth() === day.getMonth() && created.getDate() === day.getDate();
    }).length;

    return { name: label, total: count };
  });

  return {
    active,
    avgResolutionHours,
    avgSatisfactionLabel: completionStats.satisfactionCount ? `${completionStats.avgSatisfactionScore}/5` : "-",
    closed,
    completedCount: completionStats.completedCount,
    completionRate: completionStats.completionRate,
    critical,
    filteredTickets: weekTickets,
    weekLabel: `${start.toLocaleDateString(locale, { month: "short", day: "numeric" })} - ${end.toLocaleDateString(locale, { month: "short", day: "numeric" })}`,
    overdue,
    prioritySummary: ["critical", "high", "medium", "low"].map((priority) => ({
      color: getPriorityColor(priority),
      name: t(`reports.priority.${priority}`),
      value: weekTickets.filter((ticket) => ticket.priority === priority).length,
    })),
    resolved,
    satisfactionCount: completionStats.satisfactionCount,
    shortWeekLabel: `${start.toLocaleDateString(locale, { month: "short" })} W${getWeekOfMonth(start)}`,
    successDetail: t("reports.common.onTime", { total: completionStats.successEligibleCount || 0, value: completionStats.successfulCount }),
    successRate: completionStats.successRate,
    statusSummary: ["open", "in_progress", "resolved", "closed"].map((status) => ({
      key: status,
      name: t(`reports.status.${status}`),
      value: weekTickets.filter((ticket) => ticket.status === status).length,
    })),
    topCategories,
    topCategoryName: topCategories[0]?.name || "-",
    total,
    trend,
  };
}

function getWeekInputValue(date) {
  const year = date.getFullYear();
  const week = String(getISOWeek(date)).padStart(2, "0");
  return `${year}-W${week}`;
}

function parseWeekInputValue(value) {
  if (!value) return { start: new Date(), end: new Date() };
  const [yearStr, weekStr] = value.split("-W");
  const year = Number(yearStr);
  const week = Number(weekStr);
  const start = getStartDateOfISOWeek(week, year);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function getISOWeek(date) {
  const tmp = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = tmp.getUTCDay() || 7;
  tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  return Math.ceil(((tmp - yearStart) / 86400000 + 1) / 7);
}

function getISOWeekYear(date) {
  const tmp = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = tmp.getUTCDay() || 7;
  tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum);
  return tmp.getUTCFullYear();
}

function getWeekOfMonth(date) {
  const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
  const weekStart = getStartDateOfISOWeek(getISOWeek(date), getISOWeekYear(date));
  const monthStartWeek = getStartDateOfISOWeek(getISOWeek(monthStart), getISOWeekYear(monthStart));

  const daysBetweenWeeks = Math.round((weekStart - monthStartWeek) / 86400000);
  return Math.floor(daysBetweenWeeks / 7) + 1;
}

function getStartDateOfISOWeek(week, year) {
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const dayOfWeek = jan4.getUTCDay() || 7;
  const start = new Date(Date.UTC(year, 0, 4 - (dayOfWeek - 1) + (week - 1) * 7));
  start.setUTCHours(0, 0, 0, 0);
  return start;
}

function countBy(items, getName) {
  const keyFn = typeof getName === "function" ? getName : (it) => it[getName] || "General";
  return Object.entries(items.reduce((acc, item) => {
    const name = keyFn(item) || "General";
    acc[name] = (acc[name] || 0) + 1;
    return acc;
  }, {})).sort((a, b) => b[1] - a[1]);
}

function isOverdue(ticket) {
  if (!ticket.dueDate) return false;
  if (["resolved", "closed"].includes(ticket.status)) return false;
  return new Date() > new Date(ticket.dueDate);
}

function getPriorityColor(priority) {
  return {
    critical: chartColors.rose,
    high: chartColors.amber,
    medium: chartColors.slate,
    low: chartColors.emerald,
  }[priority] || chartColors.slate;
}

function ReportPanel({ children, className = "", title }) {
  return (
    <section className={`ops-panel ${className}`}>
      <h3 className="mb-5 text-xs font-bold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
        {title}
      </h3>
      {children}
    </section>
  );
}

function ProgressRow({ name, tone = "slate", total, value }) {
  const percent = total ? Math.round((value / total) * 100) : 0;
  const toneClass = {
    amber: "bg-gradient-to-r from-amber-500 to-amber-300",
    emerald: "bg-gradient-to-r from-emerald-600 to-emerald-400",
    rose: "bg-gradient-to-r from-rose-600 to-rose-400",
    slate: "bg-gradient-to-r from-slate-700 to-slate-400",
  }[tone] || "bg-gradient-to-r from-slate-700 to-slate-400";

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3 text-xs">
        <span className="truncate font-semibold text-slate-600 dark:text-slate-300">{name}</span>
        <span className="shrink-0 text-slate-500 dark:text-slate-400">{value.toLocaleString()} / {percent}%</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-slate-200/80 dark:bg-white/10">
        <div className={`h-full rounded-full ${toneClass}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function getStatusTone(status) {
  if (status === "closed") return "emerald";
  if (status === "resolved") return "amber";
  if (status === "open") return "slate";
  return "slate";
}

function getCategoryTone(index) {
  return ["slate", "emerald", "amber", "rose", "slate"][index] || "slate";
}

function ChartTooltip({ active, label, labelSuffix, payload }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white/95 px-3 py-2 text-xs text-slate-700 shadow-[0_16px_40px_rgba(6,24,28,0.14)] backdrop-blur-md dark:border-white/10 dark:bg-[#07181c]/95 dark:text-slate-200">
      <p className="font-semibold">{label}</p>
      <p>{payload[0].value.toLocaleString()} {labelSuffix}</p>
    </div>
  );
}

function SnapshotRow({ label, value }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-200/80 bg-white/90 p-4 dark:border-white/10 dark:bg-white/5">
      <span className="text-slate-500 dark:text-slate-400">{label}</span>
      <strong className="text-slate-900 dark:text-white">{value}</strong>
    </div>
  );
}

function EmptyState({ message }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300/80 bg-white/70 p-5 text-center text-sm text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
      {message}
    </div>
  );
}

export default WeeklyReportPage;
