import { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
  const [menuPosition, setMenuPosition] = useState(null);
  const fullDetailLabel = pickText(t, "queue.actions.fullDetail", "Full detail");
  const actionCount = canDelete ? 3 : 2;

  useLayoutEffect(() => {
    if (!open) return undefined;

    const updatePosition = () => {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return;
      if (!rect.width && !rect.height) {
        setMenuPosition(null);
        return;
      }

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

  const menu = open && menuPosition
    ? createPortal(
        <>
          <button
            type="button"
            aria-label={t("common.close")}
            className="fixed inset-0 z-[9998] cursor-default bg-transparent"
            onClick={onToggle}
          />
          <div
            className="ops-menu-panel fixed z-[9999] w-44"
            style={menuPosition}
            role="menu"
          >
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                onToggle();
                onOpenDrawer();
              }}
              className="ops-menu-item"
            >
              {t("common.view")}
            </button>
            <button
              type="button"
              disabled={!canOpenDetails}
              role="menuitem"
              onClick={() => {
                onToggle();
                onViewFullDetail();
              }}
              className="ops-menu-item"
            >
              {fullDetailLabel}
            </button>
            {canDelete && (
              <button
                type="button"
                disabled={disabled}
                role="menuitem"
                onClick={() => {
                  onToggle();
                  onDelete();
                }}
                className="ops-menu-item-danger"
              >
                {deleting ? t("common.deleting") : t("common.delete")}
              </button>
            )}
          </div>
        </>,
        document.body,
      )
    : null;

  return (
    <div className="flex justify-end">
      <button
        ref={buttonRef}
        type="button"
        aria-label={t("queue.action")}
        aria-expanded={open}
        disabled={disabled && !canOpenDetails && !canDelete}
        onClick={onToggle}
        className="ops-icon-button"
      >
        <MoreVertical size={17} strokeWidth={2.4} />
      </button>
      {menu}
    </div>
  );
}

function pickText(t, key, fallback) {
  const value = t?.(key);
  return value && value !== key ? value : fallback;
}

export default QueueActionMenu;
