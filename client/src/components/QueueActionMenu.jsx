import { useLayoutEffect, useRef, useState } from "react";
import { MoreVertical } from "lucide-react";

function QueueActionMenu({
  canDelete,
  canOpenDetails,
  deleting,
  disabled,
  onDelete,
  onOpenDrawer,
  onToggle,
  onViewFullDetail,
  open,
  t,
}) {
  const buttonRef = useRef(null);
  const [menuPosition, setMenuPosition] = useState({ left: 0, top: 0 });
  const fullDetailLabel = pickText(t, "queue.actions.fullDetail", "Full detail");
  const actionCount = canDelete ? 3 : 2;

  useLayoutEffect(() => {
    if (!open) return undefined;

    const updatePosition = () => {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return;

      const menuWidth = 176;
      const menuHeight = Math.max(48, actionCount * 40 + 8);
      const viewportPadding = 8;
      const hasSpaceBelow = window.innerHeight - rect.bottom >= menuHeight + viewportPadding;
      const left = Math.min(
        Math.max(viewportPadding, rect.right - menuWidth),
        window.innerWidth - menuWidth - viewportPadding,
      );
      const top = hasSpaceBelow
        ? rect.bottom + 6
        : Math.max(viewportPadding, rect.top - menuHeight - 6);

      setMenuPosition({ left, top });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [actionCount, open]);

  return (
    <div className="flex justify-end">
      <button
        ref={buttonRef}
        type="button"
        aria-label={t("queue.action")}
        aria-expanded={open}
        onClick={onToggle}
        className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-purple-100 bg-white/90 text-slate-600 shadow-sm backdrop-blur-sm transition hover:border-purple-200 hover:bg-purple-50 hover:text-purple-700 dark:border-purple-400/15 dark:bg-white/5 dark:text-slate-300 dark:hover:border-purple-400/25 dark:hover:bg-purple-500/10 dark:hover:text-purple-200"
      >
        <MoreVertical size={17} strokeWidth={2.4} />
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label={t("common.close")}
            className="fixed inset-0 z-10 cursor-default bg-transparent"
            onClick={onToggle}
          />
          <div
            className="fixed z-50 w-44 overflow-hidden rounded-xl border border-purple-100/90 bg-white/95 p-1.5 shadow-[0_18px_44px_rgba(29,10,52,0.18)] backdrop-blur-md dark:border-purple-400/15 dark:bg-[#140d24]/95"
            style={menuPosition}
          >
            <button
              type="button"
              onClick={() => {
                onToggle();
                onOpenDrawer();
              }}
              className="w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-purple-50 hover:text-purple-700 dark:text-slate-200 dark:hover:bg-purple-500/10 dark:hover:text-purple-200"
            >
              {t("common.view")}
            </button>
            <button
              type="button"
              disabled={!canOpenDetails}
              onClick={() => {
                onToggle();
                onViewFullDetail();
              }}
              className="w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-purple-50 hover:text-purple-700 disabled:cursor-not-allowed disabled:text-slate-400 disabled:hover:bg-transparent dark:text-slate-200 dark:hover:bg-purple-500/10 dark:hover:text-purple-200 dark:disabled:text-slate-600"
            >
              {fullDetailLabel}
            </button>
            {canDelete && (
              <button
                type="button"
                disabled={disabled}
                onClick={() => {
                  onToggle();
                  onDelete();
                }}
                className="w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-rose-600 hover:bg-rose-50 disabled:cursor-not-allowed disabled:text-slate-400 disabled:hover:bg-transparent dark:text-rose-300 dark:hover:bg-rose-500/10 dark:disabled:text-slate-600"
              >
                {deleting ? t("common.deleting") : t("common.delete")}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function pickText(t, key, fallback) {
  const value = t?.(key);
  return value && value !== key ? value : fallback;
}

export default QueueActionMenu;
