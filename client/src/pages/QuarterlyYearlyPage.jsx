import { useState } from "react";
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
import ThemedSelect from "../components/ThemedSelect";

function QuarterlyYearlyPage({ tickets }) {
  const [mode, setMode] = useState("quarterly");
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const report = buildPeriodReport(tickets, Number(year), mode);
  const years = getAvailableYears(tickets);

  return (
    <div className="space-y-5">
      <section className="flex flex-col gap-4 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/70 dark:border-slate-800 dark:bg-slate-950 dark:shadow-slate-950/40 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-violet-600 dark:text-violet-300">
            Reports
          </p>
          <h3 className="text-2xl font-black text-slate-950 dark:text-white">
            Quarterly / Yearly
          </h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Compare ticket trend, open, resolved, and overdue volume by period.
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
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 md:grid-cols-5">
        <StatCard title="Tickets" value={report.total} detail={year} icon="T" />
        <StatCard title="Open" value={report.open} detail="active" icon="O" />
        <StatCard title="Resolved" value={report.resolved} detail={`${report.resolvedRate}%`} icon="R" />
        <StatCard title="Overdue" value={report.overdue} detail="SLA risk" icon="!" />
        <StatCard title="Avg. Resolve" value={`${report.avgResolutionHours}h`} detail="time" icon="A" />
      </section>

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
                  stroke="#8b5cf6"
                  strokeWidth={3}
                  dot={{ fill: "#8b5cf6", r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ReportPanel>

        <ReportPanel className="xl:col-span-4" title="Year Snapshot">
          <div className="grid gap-3 text-sm">
            <SnapshotRow label="Best period" value={report.bestPeriod} />
            <SnapshotRow label="Most overdue period" value={report.mostOverduePeriod} />
            <SnapshotRow label="Closed tickets" value={report.closed} />
            <SnapshotRow label="Active tickets" value={report.active} />
          </div>
        </ReportPanel>

        <ReportPanel className="xl:col-span-12" title="Open / Resolved / Overdue Comparison">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={report.periods}>
                <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 11 }} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fill: "#64748b", fontSize: 11 }} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="open" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                <Bar dataKey="resolved" fill="#22c55e" radius={[8, 8, 0, 0]} />
                <Bar dataKey="overdue" fill="#ec4899" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex flex-wrap gap-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <LegendDot color="#8b5cf6" label="Open" />
            <LegendDot color="#22c55e" label="Resolved" />
            <LegendDot color="#ec4899" label="Overdue" />
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
  const open = yearTickets.filter((ticket) => ticket.status === "open").length;
  const active = yearTickets.filter(
    (ticket) => !["resolved", "closed"].includes(ticket.status),
  ).length;
  const overdue = yearTickets.filter((ticket) => isOverdue(ticket)).length;
  const resolvedWithTime = yearTickets.filter((ticket) => ticket.resolvedAt);
  const avgResolutionHours = resolvedWithTime.length
    ? Math.round(
        resolvedWithTime.reduce((sum, ticket) => {
          return sum + (new Date(ticket.resolvedAt) - new Date(ticket.createdAt)) / 3600000;
        }, 0) / resolvedWithTime.length,
      )
    : 0;

  return {
    active,
    avgResolutionHours,
    bestPeriod: getTopPeriod(periods, "total"),
    closed,
    label: mode === "quarterly" ? "Quarterly" : "Yearly",
    mostOverduePeriod: getTopPeriod(periods, "overdue"),
    open,
    overdue,
    periods,
    resolved,
    resolvedRate: total ? Math.round(((resolved + closed) / total) * 100) : 0,
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
    closed,
    name,
    open: tickets.filter((ticket) => ticket.status === "open").length,
    overdue: tickets.filter((ticket) => isOverdue(ticket)).length,
    resolved: resolved + closed,
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
      className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950/80 ${className}`}
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
    <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
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
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 shadow-lg dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
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
