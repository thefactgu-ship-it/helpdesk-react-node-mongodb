function StatusPill({ label, tone = "info" }) {
  const className = {
    danger: "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-200 dark:ring-rose-400/20",
    warning: "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-200 dark:ring-amber-400/20",
    info: "bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-500/10 dark:text-blue-200 dark:ring-blue-400/20",
    neutral: "bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700",
  }[tone];

  return (
    <span className={`inline-flex max-w-full shrink-0 items-center break-words rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ${className}`}>
      {label}
    </span>
  );
}

export default StatusPill;
