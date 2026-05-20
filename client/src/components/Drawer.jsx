import { useEffect } from "react";
import { X } from "lucide-react";

function Drawer({
  actions,
  children,
  eyebrow,
  onClose,
  open,
  subtitle,
  title,
  widthClass = "max-w-xl",
}) {
  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-slate-950/30 backdrop-blur-sm">
      <button
        type="button"
        aria-label="Close drawer"
        className="absolute inset-0 h-full w-full cursor-default"
        onClick={onClose}
      />
      <aside className={`relative flex h-full w-full ${widthClass} flex-col bg-white shadow-2xl dark:bg-slate-950`}>
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5 dark:border-slate-800">
          <div className="min-w-0">
            {eyebrow && (
              <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-600 dark:text-blue-300">
                {eyebrow}
              </p>
            )}
            <h3 className="mt-2 line-clamp-2 text-2xl font-black text-slate-950 dark:text-white">
              {title}
            </h3>
            {subtitle && (
              <p className="mt-1 break-words text-sm text-slate-500 dark:text-slate-400">
                {subtitle}
              </p>
            )}
          </div>
          <button
            type="button"
            aria-label="Close drawer"
            onClick={onClose}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-950 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900"
          >
            <X size={18} strokeWidth={2.4} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {children}
        </div>

        {actions && (
          <div className="border-t border-slate-200 p-5 dark:border-slate-800">
            {actions}
          </div>
        )}
      </aside>
    </div>
  );
}

export default Drawer;
