import { cx } from "./classNames";

const variants = {
  danger:
    "border border-rose-500 bg-rose-600 text-white shadow-sm hover:bg-rose-700 dark:border-rose-400 dark:bg-rose-500 dark:hover:bg-rose-400",
  ghost:
    "border border-transparent bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/[0.07] dark:hover:text-teal-50",
  primary:
    "border border-[#0a1f23] bg-[#0a1f23] text-white shadow-sm hover:bg-[#123237] dark:border-teal-100 dark:bg-teal-100 dark:text-[#06181c] dark:hover:bg-white",
  secondary:
    "border border-slate-200 bg-white/85 text-slate-700 shadow-sm hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-200 dark:hover:border-white/20 dark:hover:bg-white/[0.09] dark:hover:text-teal-50",
  subtle:
    "border border-slate-200 bg-slate-100/80 text-slate-700 hover:border-slate-300 hover:bg-slate-200/70 dark:border-teal-100/15 dark:bg-white/[0.06] dark:text-teal-50 dark:hover:bg-white/[0.1]",
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
