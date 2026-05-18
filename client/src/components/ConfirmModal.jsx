import { useEffect } from "react";
import { createPortal } from "react-dom";

function ConfirmModal({ open, title, message, onCancel, onConfirm }) {
  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onCancel();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onCancel, open]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 px-3 pb-3 pt-16 backdrop-blur-sm sm:items-center sm:p-4">
      <button
        type="button"
        aria-label="Close confirmation dialog"
        className="absolute inset-0 h-full w-full cursor-default"
        onClick={onCancel}
      />
      <div
        aria-labelledby="confirm-modal-title"
        aria-modal="true"
        className="relative w-full max-w-md rounded-t-2xl bg-white p-6 shadow-2xl dark:bg-slate-800 sm:rounded-2xl"
        role="dialog"
      >
        <h3 id="confirm-modal-title" className="text-lg font-bold text-slate-900 dark:text-white">
          {title}
        </h3>

        <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">
          {message}
        </p>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className="rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-600"
          >
            Delete
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default ConfirmModal;
