import { useEffect } from "react";
import { createPortal } from "react-dom";
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

  return createPortal(
    <div className="fixed inset-0 z-40 flex justify-end bg-slate-950/30 backdrop-blur-sm">
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
