import { X } from "lucide-react";
import Button from "./Button";
import { cx } from "./classNames";

function DrawerShell({
  actions,
  children,
  className = "",
  eyebrow,
  onClose,
  subtitle,
  title,
  widthClass = "max-w-xl",
}) {
  return (
    <aside
      className={cx(
        "relative flex h-dvh max-h-dvh w-full min-w-0 flex-col overflow-hidden border-l border-slate-200/90 bg-white/95 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-[#07181c]/95",
        widthClass,
        className,
      )}
    >
      <div className="shrink-0 bg-white/80 backdrop-blur-xl flex items-start justify-between gap-4 border-b border-slate-200/80 p-5 dark:border-white/10 dark:bg-[#07181c]/80">
        <div className="min-w-0">
          {eyebrow && (
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-700 dark:text-teal-50">
              {eyebrow}
            </p>
          )}
          <h3 className="mt-2 line-clamp-2 text-2xl font-black text-slate-950 dark:text-white">
            {title}
          </h3>
          {subtitle && (
            <p className="mt-1 break-words text-sm leading-6 text-slate-500 dark:text-slate-400">
              {subtitle}
            </p>
          )}
        </div>
        <Button aria-label="Close drawer" icon={X} iconOnly onClick={onClose} variant="ghost" />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-5">{children}</div>

      {actions && (
        <div className="shrink-0 border-t border-slate-200/80 bg-white/90 p-5 shadow-[0_-12px_30px_rgba(6,24,28,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-[#07181c]/90">
          {actions}
        </div>
      )}
    </aside>
  );
}

export default DrawerShell;
