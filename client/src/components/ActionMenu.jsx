import { MoreVertical } from "lucide-react";

function ActionMenu({ actions, ariaLabel = "Actions", disabled = false, onToggle, open }) {
  const enabledActions = actions.filter(Boolean);

  return (
    <div className="flex justify-end">
      <button
        type="button"
        aria-label={ariaLabel}
        aria-expanded={open}
        disabled={disabled}
        onClick={onToggle}
        className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        <MoreVertical size={17} strokeWidth={2.4} />
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close actions"
            className="fixed inset-0 z-10 cursor-default bg-transparent"
            onClick={onToggle}
          />
          <div className="absolute right-0 top-10 z-20 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white p-1 shadow-xl dark:border-slate-700 dark:bg-slate-900">
            {enabledActions.map((action) => (
              <button
                key={action.label}
                type="button"
                disabled={action.disabled}
                onClick={() => {
                  onToggle();
                  action.onClick();
                }}
                className={`w-full rounded-lg px-3 py-2 text-left text-sm font-semibold transition disabled:cursor-not-allowed disabled:text-slate-400 disabled:hover:bg-transparent dark:disabled:text-slate-600 ${
                  action.danger
                    ? "text-rose-600 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-500/10"
                    : "text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                }`}
              >
                {action.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default ActionMenu;
