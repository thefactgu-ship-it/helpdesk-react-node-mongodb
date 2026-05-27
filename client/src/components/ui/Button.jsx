import { cx } from "./classNames";

const variants = {
  danger:
    "border border-rose-500 bg-rose-600 text-white shadow-sm hover:bg-rose-700 dark:border-rose-400 dark:bg-rose-500 dark:hover:bg-rose-400",
  ghost:
    "border border-transparent bg-transparent text-slate-600 hover:bg-purple-50 hover:text-purple-700 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-purple-200",
  primary:
    "border border-purple-600 bg-purple-700 text-white shadow-sm hover:bg-purple-800 dark:border-purple-400 dark:bg-purple-500 dark:hover:bg-purple-400",
  secondary:
    "border border-purple-100 bg-white/85 text-slate-700 shadow-sm hover:border-purple-200 hover:bg-purple-50 hover:text-purple-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-purple-400 dark:hover:bg-slate-800 dark:hover:text-purple-100",
  subtle:
    "border border-purple-100 bg-purple-50/70 text-purple-700 hover:border-purple-200 hover:bg-purple-100 dark:border-purple-400/20 dark:bg-purple-500/15 dark:text-purple-100 dark:hover:bg-purple-500/25",
  success:
    "border border-emerald-500 bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 dark:border-emerald-400 dark:bg-emerald-500 dark:hover:bg-emerald-400",
};

const sizes = {
  icon: "h-11 w-11 p-0",
  lg: "min-h-12 px-5 py-3 text-sm",
  md: "min-h-11 px-4 py-2 text-sm",
  sm: "min-h-10 px-3 py-2 text-xs",
};

function Button({
  children,
  className = "",
  icon: Icon,
  iconOnly = false,
  size = "md",
  type = "button",
  variant = "secondary",
  ...props
}) {
  return (
    <button
      type={type}
      className={cx(
        "inline-flex shrink-0 items-center justify-center gap-2 rounded-lg font-black transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-60",
        sizes[iconOnly ? "icon" : size] || sizes.md,
        variants[variant] || variants.secondary,
        className,
      )}
      {...props}
    >
      {Icon && <Icon className={cx("h-4 w-4", size === "lg" && "h-5 w-5")} aria-hidden="true" />}
      {!iconOnly && children}
    </button>
  );
}

export default Button;
