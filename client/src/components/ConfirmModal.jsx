import { useEffect } from "react";
import { createPortal } from "react-dom";
import { useBodyScrollLock } from "../hooks/useBodyScrollLock";
import { Button, ModalShell } from "./ui";

function ConfirmModal({
  children,
  confirmDisabled = false,
  confirmLabel = "Delete",
  open,
  title,
  message,
  onCancel,
  onConfirm,
}) {
  useBodyScrollLock(open);

  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onCancel();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
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
      <ModalShell
        actions={(
          <>
            <Button onClick={onCancel} variant="secondary">
              Cancel
            </Button>
            <Button disabled={confirmDisabled} onClick={onConfirm} variant="danger">
              {confirmLabel}
            </Button>
          </>
        )}
        className="max-w-md"
        labelledBy="confirm-modal-title"
        title={title}
      >
        <p className="text-sm leading-6 text-slate-500 dark:text-slate-300">
          {message}
        </p>
        {children && <div className="mt-4">{children}</div>}
      </ModalShell>
    </div>,
    document.body,
  );
}

export default ConfirmModal;
