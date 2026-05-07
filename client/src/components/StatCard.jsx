function StatCard({ bars = [30, 52, 70, 44], detail, icon, title, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-950/80">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            {icon && (
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-700 dark:bg-violet-500/20 dark:text-violet-200">
                {icon}
              </span>
            )}
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
              {title}
            </p>
          </div>

          <div className="mt-4 flex items-end gap-2">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">
              {value}
            </h3>
            {detail && (
              <span className="pb-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                {detail}
              </span>
            )}
          </div>
        </div>

        <div className="flex h-12 items-end gap-1">
          {bars.map((height, index) => (
            <span
              key={`${height}-${index}`}
              className={`w-1.5 rounded-full ${
                index === 2
                  ? "bg-violet-500 dark:bg-violet-300"
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
