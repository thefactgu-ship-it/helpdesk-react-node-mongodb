import { useLayoutEffect, useRef, useState } from "react";
import { MoreVertical } from "lucide-react";

function ActionMenu({ actions, ariaLabel = "Actions", disabled = false, onToggle, open }) {
  const buttonRef = useRef(null);
  const [menuPosition, setMenuPosition] = useState({ left: 0, top: 0 });
  const enabledActions = actions.filter(Boolean);

  useLayoutEffect(() => {
    if (!open) return undefined;

    const updatePosition = () => {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return;

      const menuWidth = 176;
      const menuHeight = Math.max(48, enabledActions.length * 40 + 8);
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
  }, [enabledActions.length, open]);

  return (
    <div className="flex justify-end">
      <button
        ref={buttonRef}
        type="button"
        aria-label={ariaLabel}
        aria-expanded={open}
        disabled={disabled}
        onClick={onToggle}
        className="ops-icon-button"
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
          <div
            className="ops-menu-panel fixed z-50 w-44"
            style={menuPosition}
            role="menu"
          >
            {enabledActions.map((action) => (
              <button
                key={action.label}
                type="button"
                disabled={action.disabled}
                role="menuitem"
                onClick={() => {
                  onToggle();
                  action.onClick();
                }}
                className={action.danger ? "ops-menu-item-danger" : "ops-menu-item"}
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
