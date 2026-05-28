import {
  AlertTriangle,
  Building2,
  Lightbulb,
  ListChecks,
} from "lucide-react";

function PeriodExecutiveSummary({ report }) {
  return (
    <section className="grid grid-cols-1 gap-4 xl:grid-cols-12">
      <ExecutivePanel
        className="xl:col-span-4"
        icon={AlertTriangle}
        title="Top Problem Areas"
      >
        <RankList
          emptyText="No problem category data in this period."
          items={report.topCategories}
          total={report.total}
        />
      </ExecutivePanel>

      <ExecutivePanel
        className="xl:col-span-4"
        icon={Building2}
        title="Hotel / Department Focus"
      >
        <FocusList
          emptyText="No hotel or department pattern yet."
          items={report.focusAreas}
        />
      </ExecutivePanel>

      <ExecutivePanel
        className="xl:col-span-4"
        icon={Lightbulb}
        title="Management Insight"
      >
        <InsightList insights={report.managementInsights} />
      </ExecutivePanel>

      <ExecutivePanel
        className="xl:col-span-12"
        icon={ListChecks}
        title="Recurring Issues"
      >
        <RecurringIssueList
          emptyText="No recurring issue pattern strong enough to highlight."
          items={report.recurringIssues}
        />
      </ExecutivePanel>
    </section>
  );
}

function ExecutivePanel({ children, className = "", icon: Icon, title }) {
  return (
    <section
      className={`ops-panel ${className}`}
    >
      <h3 className="mb-5 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-slate-100 text-slate-700 dark:bg-white/[0.06] dark:text-teal-50">
          <Icon size={15} />
        </span>
        <span>{title}</span>
      </h3>
      {children}
    </section>
  );
}

function RankList({ emptyText, items = [], total }) {
  if (!items.length) {
    return <EmptyReportText>{emptyText}</EmptyReportText>;
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <ProgressRow
          key={item.name}
          name={item.name}
          total={total}
          value={item.value}
        />
      ))}
    </div>
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
      <div className="h-3 overflow-hidden rounded-full bg-slate-200/80 dark:bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-slate-700 to-slate-400"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

function FocusList({ emptyText, items = [] }) {
  if (!items.length) {
    return <EmptyReportText>{emptyText}</EmptyReportText>;
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div
          key={item.name}
          className="ops-card p-3"
        >
          <div className="flex items-start justify-between gap-3">
            <p className="min-w-0 text-sm font-black text-slate-900 dark:text-white">
              {item.name}
            </p>
            <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-700 ring-1 ring-slate-200 dark:bg-white/[0.06] dark:text-teal-50 dark:ring-teal-100/15">
              {item.value}
            </span>
          </div>
          <p className="mt-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
            {item.overdue} overdue / {item.urgent} urgent
          </p>
        </div>
      ))}
    </div>
  );
}

function InsightList({ insights = [] }) {
  return (
    <div className="space-y-3">
      {insights.map((insight) => (
        <div
          key={insight}
          className="rounded-lg border-l-4 border-slate-700 bg-slate-100/80 px-3 py-2 text-sm font-semibold leading-6 text-slate-700 dark:border-teal-100/50 dark:bg-white/[0.06] dark:text-slate-200"
        >
          {insight}
        </div>
      ))}
    </div>
  );
}

function RecurringIssueList({ emptyText, items = [] }) {
  if (!items.length) {
    return <EmptyReportText>{emptyText}</EmptyReportText>;
  }

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <div
          key={item.name}
          className="ops-card flex items-start justify-between gap-4"
        >
          <p className="min-w-0 text-sm font-bold leading-6 text-slate-800 dark:text-slate-100">
            {item.name}
          </p>
          <span className="shrink-0 rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-700 dark:bg-amber-950 dark:text-amber-200">
            {item.value}x
          </span>
        </div>
      ))}
    </div>
  );
}

function EmptyReportText({ children }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300/80 bg-white/70 px-4 py-6 text-center text-sm font-semibold text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
      {children}
    </div>
  );
}

export default PeriodExecutiveSummary;
