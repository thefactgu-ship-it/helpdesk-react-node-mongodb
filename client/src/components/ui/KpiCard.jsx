import { cx } from "./classNames";

const tones = {
  amber: "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200",
  emerald: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200",
  purple: "bg-slate-100 text-slate-700 dark:bg-white/[0.06] dark:text-teal-50",
  rose: "bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-200",
};

function KpiCard({
  className = "",
  detail,
  icon: Icon,
  label,
  tone = "purple",
  value,
}) {
  return (
    <article className={cx("ops-soft-kpi", className)}>
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-3xl font-black text-slate-950 dark:text-white">
            {typeof value === "number" ? value.toLocaleString() : value}
          </p>
          <p className="mt-1 text-sm font-black text-slate-700 dark:text-slate-200">
            {label}
          </p>
          {detail && (
            <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
              {detail}
            </p>
          )}
        </div>
        {Icon && (
          <span className={cx("grid h-11 w-11 shrink-0 place-items-center rounded-lg", tones[tone] || tones.purple)}>
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>
        )}
      </div>
    </article>
  );
}

export default KpiCard;
