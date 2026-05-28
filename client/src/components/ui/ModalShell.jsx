import { X } from "lucide-react";
import Button from "./Button";
import { cx } from "./classNames";

function ModalShell({
  actions,
  children,
  className = "",
  description,
  labelledBy = "modal-title",
  onClose,
  title,
}) {
  return (
    <div
      aria-labelledby={labelledBy}
      aria-modal="true"
      className={cx(
        "relative w-full max-w-lg rounded-t-xl border border-slate-200/90 bg-white/95 p-6 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-[#07181c]/95 sm:rounded-xl",
        className,
      )}
      role="dialog"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 id={labelledBy} className="text-lg font-black text-slate-950 dark:text-white">
            {title}
          </h3>
          {description && (
            <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
              {description}
            </p>
          )}
        </div>
        {onClose && (
          <Button aria-label="Close dialog" icon={X} iconOnly onClick={onClose} variant="ghost" />
        )}
      </div>

      <div className="mt-5">{children}</div>

      {actions && (
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          {actions}
        </div>
      )}
    </div>
  );
}

export default ModalShell;
