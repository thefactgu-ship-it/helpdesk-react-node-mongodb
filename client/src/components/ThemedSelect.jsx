import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

function ThemedSelect({
  className = "",
  compactOptions = false,
  disabled = false,
  emptyLabel,
  getOptionMeta,
  getOptionPrefix,
  menuPortal = true,
  menuWidth = "trigger",
  onChange,
  options = [],
  placeholder = "Select",
  size = "md",
  value,
  variant = "field",
}) {
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState({});
  const dropdownRef = useRef(null);
  const menuRef = useRef(null);
  const triggerRef = useRef(null);
  const normalizedOptions = useMemo(
    () =>
      options.map((option) =>
        typeof option === "string"
          ? { value: option, label: option }
          : {
              value: option.value ?? option.id ?? "",
              label: option.label ?? option.name ?? String(option.value ?? ""),
              disabled: option.disabled || false,
              meta: option.meta,
              prefix: option.prefix,
            },
      ),
    [options],
  );
  const selectedOption = normalizedOptions.find(
    (option) => String(option.value) === String(value),
  );
  const selectedLabel = selectedOption?.label || emptyLabel || placeholder;
  const isPill = variant === "pill";
  const isSmall = size === "sm";

  useEffect(() => {
    if (!open) return;

    const closeOnOutsideClick = (event) => {
      const clickedTrigger = dropdownRef.current?.contains(event.target);
      const clickedMenu = menuRef.current?.contains(event.target);

      if (!clickedTrigger && !clickedMenu) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", closeOnOutsideClick, true);

    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open || !menuPortal) return;

    const updateMenuPosition = () => {
      const triggerRect = triggerRef.current?.getBoundingClientRect();
      if (!triggerRect) return;

      const viewportPadding = 12;
      const menuHeight = isSmall ? 224 : 288;
      const spaceBelow = window.innerHeight - triggerRect.bottom - viewportPadding;
      const spaceAbove = triggerRect.top - viewportPadding;
      const openUp = spaceBelow < menuHeight && spaceAbove > spaceBelow;
      const computedWidth =
        typeof menuWidth === "number"
          ? menuWidth
          : menuWidth === "content"
            ? Math.max(triggerRect.width, 192)
            : triggerRect.width;
      const maxWidth = window.innerWidth - viewportPadding * 2;
      const width = Math.min(computedWidth, maxWidth);
      const left = Math.min(
        Math.max(triggerRect.left, viewportPadding),
        window.innerWidth - width - viewportPadding,
      );
      const top = openUp
        ? Math.max(viewportPadding, triggerRect.top - menuHeight - 8)
        : Math.min(triggerRect.bottom + 8, window.innerHeight - viewportPadding);

      setMenuStyle({
        left,
        maxHeight: Math.max(
          96,
          openUp ? Math.min(menuHeight, spaceAbove - 8) : Math.min(menuHeight, spaceBelow - 8),
        ),
        top,
        width,
      });
    };

    updateMenuPosition();
    window.addEventListener("resize", updateMenuPosition);
    window.addEventListener("scroll", updateMenuPosition, true);

    return () => {
      window.removeEventListener("resize", updateMenuPosition);
      window.removeEventListener("scroll", updateMenuPosition, true);
    };
  }, [isSmall, menuPortal, menuWidth, open]);

  const selectOption = (option) => {
    if (option.disabled) return;
    onChange?.(option.value);
    setOpen(false);
  };

  const menu = (
    <div
      ref={menuRef}
      style={menuPortal ? menuStyle : undefined}
      className={`${menuPortal ? "fixed" : `absolute mt-2 w-full min-w-48 ${isPill ? "right-0" : "left-0"}`} z-[9999] overflow-hidden rounded-2xl border border-violet-100 bg-white p-1.5 shadow-2xl shadow-slate-200/80 dark:border-slate-700 dark:bg-slate-950 dark:shadow-slate-950/60`}
    >
      <div
        className={`${isSmall ? "max-h-56" : "max-h-72"} overflow-y-auto pr-1`}
        role="listbox"
      >
        {normalizedOptions.map((option) => {
          const selected = String(option.value) === String(value);
          const meta = !compactOptions && (option.meta ?? getOptionMeta?.(option));
          const prefix = !compactOptions && (option.prefix ?? getOptionPrefix?.(option));

          return (
            <button
              key={`${option.value}-${option.label}`}
              type="button"
              role="option"
              aria-selected={selected}
              disabled={option.disabled}
              onClick={() => selectOption(option)}
              className={`flex w-full items-center gap-2.5 rounded-xl text-left transition disabled:cursor-not-allowed disabled:opacity-50 ${
                isSmall ? "px-2.5 py-2" : "px-3 py-2.5"
              } ${
                selected
                  ? "bg-violet-600 text-white shadow-md shadow-violet-200 dark:bg-violet-500 dark:shadow-violet-950/40"
                  : "text-slate-700 hover:bg-violet-50 hover:text-violet-700 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-violet-200"
              }`}
            >
              {prefix && (
                <span
                  className={`grid shrink-0 place-items-center rounded-xl font-black ${
                    isSmall ? "h-6 w-6 text-[9px]" : "h-8 w-8 text-[10px]"
                  } ${
                    selected
                      ? "bg-white/20 text-white"
                      : "bg-slate-100 text-slate-500 dark:bg-slate-900 dark:text-slate-400"
                  }`}
                >
                  {prefix}
                </span>
              )}
              <span className="min-w-0 flex-1">
                <span className={`${isSmall ? "text-xs" : "text-sm"} block truncate font-bold`}>
                  {option.label}
                </span>
                {meta && (
                  <span
                    className={`block truncate text-xs ${
                      selected
                        ? "text-white/75"
                        : "text-slate-400 dark:text-slate-500"
                    }`}
                  >
                    {meta}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => !disabled && setOpen((current) => !current)}
        className={`flex w-full items-center justify-between border bg-white text-left font-bold shadow-sm outline-none transition disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-950 ${
          isPill
            ? `${isSmall ? "h-9 px-3 text-xs" : "h-11 px-4 text-sm"} gap-2 rounded-full`
            : `${isSmall ? "min-h-9 rounded-xl px-3 py-2 text-xs" : "min-h-12 rounded-2xl px-4 py-3 text-sm"} gap-3`
        } ${
          open
            ? `${isSmall ? "ring-2" : "ring-4"} border-violet-500 text-violet-700 shadow-lg shadow-violet-100 ring-violet-100 dark:border-violet-400 dark:text-violet-200 dark:shadow-violet-950/30 dark:ring-violet-500/10`
            : "border-violet-200 text-slate-700 hover:border-violet-400 hover:bg-violet-50/60 dark:border-slate-700 dark:text-slate-200 dark:hover:border-violet-400 dark:hover:bg-slate-900"
        }`}
      >
        <span className="min-w-0 flex-1 truncate">{selectedLabel}</span>
        <span
          className={`grid shrink-0 place-items-center rounded-full transition ${
            isSmall ? "h-5 w-5 text-[10px]" : "h-6 w-6 text-xs"
          } ${
            open
              ? "bg-violet-600 text-white"
              : "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-200"
          }`}
        >
          {open ? "^" : "v"}
        </span>
      </button>

      {open && (menuPortal ? createPortal(menu, document.body) : menu)}
    </div>
  );
}

export default ThemedSelect;
