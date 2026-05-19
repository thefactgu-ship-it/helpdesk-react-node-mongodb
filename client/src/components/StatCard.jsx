function StatCard({ bars = [30, 52, 70, 44], detail, icon, title, value }) {
  const Icon = icon && typeof icon !== "string" ? icon : null;

  return (
    <div className="min-h-28 overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-950/80">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-start gap-2">
            {icon && (
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700 dark:bg-blue-500/20 dark:text-blue-200">
                {Icon ? <Icon className="h-3.5 w-3.5" aria-hidden="true" /> : icon}
              </span>
            )}
            <p className="min-w-0 break-words text-[11px] font-bold uppercase leading-4 tracking-[0.16em] text-slate-500 dark:text-slate-400">
              {title}
            </p>
          </div>

          <div className="mt-4 flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1">
            <h3 className="max-w-full truncate text-2xl font-black leading-none text-slate-900 dark:text-white">
              {value}
            </h3>
            {detail && (
              <span className="min-w-0 max-w-full text-xs font-semibold leading-tight text-slate-500 dark:text-slate-400">
                {detail}
              </span>
            )}
          </div>
        </div>

        <div className="ml-auto flex h-12 w-10 shrink-0 items-end justify-end gap-1" aria-hidden="true">
          {bars.map((height, index) => (
            <span
              key={`${height}-${index}`}
              className={`w-1.5 shrink-0 rounded-full ${
                index === 2
                  ? "bg-blue-500 dark:bg-blue-300"
                  : "bg-slate-200 dark:bg-slate-700"
              }`}
              style={{ height: `${height}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default StatCard;
