import { useEffect } from "react";
import { createPortal } from "react-dom";
import { useBodyScrollLock } from "../hooks/useBodyScrollLock";
import { DrawerShell } from "./ui";

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
  useBodyScrollLock(open);

  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, open]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-40 flex items-stretch justify-end bg-slate-950/30 backdrop-blur-sm">
      <button
        type="button"
        aria-label="Close drawer"
        className="absolute inset-0 h-full w-full cursor-default"
        onClick={onClose}
      />
      <DrawerShell
        actions={actions}
        eyebrow={eyebrow}
        onClose={onClose}
        subtitle={subtitle}
        title={title}
        widthClass={widthClass}
      >
        {children}
      </DrawerShell>
    </div>,
    document.body,
  );
}

export default Drawer;
