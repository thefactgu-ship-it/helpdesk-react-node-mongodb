import { cx } from "./classNames";

const tones = {
  amber:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/20 dark:bg-amber-500/15 dark:text-amber-200",
  blue:
    "border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-400/20 dark:bg-purple-500/15 dark:text-purple-200",
  emerald:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-500/15 dark:text-emerald-200",
  indigo:
    "border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-400/20 dark:bg-purple-500/15 dark:text-purple-100",
  neutral:
    "border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200",
  rose:
    "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-400/20 dark:bg-rose-500/15 dark:text-rose-200",
};

function Badge({ children, className = "", icon: Icon, tone = "indigo", ...props }) {
  return (
    <span
      className={cx(
        "inline-flex min-h-7 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-black leading-none",
        tones[tone] || tones.indigo,
        className,
      )}
      {...props}
    >
      {Icon && <Icon className="h-3.5 w-3.5" aria-hidden="true" />}
      {children}
    </span>
  );
}

export default Badge;
