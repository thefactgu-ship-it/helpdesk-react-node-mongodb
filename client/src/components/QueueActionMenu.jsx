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
  return (
    <div className="flex justify-end">
      <button
        type="button"
        aria-label={t("queue.action")}
        aria-expanded={open}
        onClick={onToggle}
        className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-slate-950 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
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
          <div className="absolute right-0 top-10 z-20 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white p-1 shadow-xl dark:border-slate-700 dark:bg-slate-900">
            <button
              type="button"
              onClick={() => {
                onToggle();
                onOpenDrawer();
              }}
              className="w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
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
              className="w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400 disabled:hover:bg-transparent dark:text-slate-200 dark:hover:bg-slate-800 dark:disabled:text-slate-600"
            >
              Full detail
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

export default QueueActionMenu;
