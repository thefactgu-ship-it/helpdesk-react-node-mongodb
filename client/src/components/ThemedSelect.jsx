import { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";

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
  const [activeIndex, setActiveIndex] = useState(-1);
  const [menuStyle, setMenuStyle] = useState({});
  const selectId = useId();
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
  const selectedIndex = normalizedOptions.findIndex(
    (option) => String(option.value) === String(value),
  );
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
        maxWidth,
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
    setActiveIndex(-1);
    triggerRef.current?.focus();
  };

  const openMenu = () => {
    if (disabled) return;
    const nextIndex = selectedIndex >= 0 ? selectedIndex : getNextEnabledIndex(normalizedOptions, -1, 1);
    setActiveIndex(nextIndex);
    setOpen(true);
  };

  const closeMenu = () => {
    setOpen(false);
    setActiveIndex(-1);
  };

  const moveActiveOption = (direction) => {
    setActiveIndex((current) =>
      getNextEnabledIndex(
        normalizedOptions,
        current < 0 ? selectedIndex : current,
        direction,
      ),
    );
  };

  const handleTriggerKeyDown = (event) => {
    if (disabled) return;

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) {
        openMenu();
        return;
      }
      moveActiveOption(event.key === "ArrowDown" ? 1 : -1);
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (!open) {
        openMenu();
        return;
      }
      const option = normalizedOptions[activeIndex];
      if (option) selectOption(option);
      return;
    }

    if (event.key === "Escape") {
      closeMenu();
    }
  };

  const menu = (
    <div
      ref={menuRef}
      style={menuPortal ? menuStyle : undefined}
      className={`${menuPortal ? "fixed" : `absolute mt-2 w-full min-w-48 ${isPill ? "right-0" : "left-0"}`} z-[9999] overflow-hidden rounded-2xl border border-purple-100 bg-white p-1.5 shadow-xl shadow-slate-200/60 dark:border-slate-700 dark:bg-slate-950 dark:shadow-slate-950/60`}
    >
      <div
        id={`${selectId}-listbox`}
        className={`${isSmall ? "max-h-56" : "max-h-72"} overflow-y-auto pr-1`}
        role="listbox"
      >
        {normalizedOptions.map((option, index) => {
          const selected = String(option.value) === String(value);
          const active = index === activeIndex;
          const meta = !compactOptions && (option.meta ?? getOptionMeta?.(option));
          const prefix = !compactOptions && (option.prefix ?? getOptionPrefix?.(option));

          return (
            <button
              id={`${selectId}-option-${index}`}
              key={`${option.value}-${option.label}`}
              type="button"
              role="option"
              aria-selected={selected}
              disabled={option.disabled}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => selectOption(option)}
              className={`flex w-full items-center gap-2.5 rounded-xl text-left transition disabled:cursor-not-allowed disabled:opacity-50 ${
                isSmall ? "px-2.5 py-2" : "px-3 py-2.5"
              } ${
                selected
                  ? "bg-purple-700 text-white shadow-sm dark:bg-purple-500 dark:shadow-slate-950/30"
                  : active
                    ? "bg-purple-50 text-purple-700 dark:bg-slate-900 dark:text-purple-200"
                  : "text-slate-700 hover:bg-purple-50 hover:text-purple-700 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-purple-200"
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
              <span className="min-w-0 flex-1 overflow-hidden">
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
        aria-controls={`${selectId}-listbox`}
        aria-activedescendant={
          open && activeIndex >= 0 ? `${selectId}-option-${activeIndex}` : undefined
        }
        onClick={() => {
          if (open) {
            closeMenu();
          } else {
            openMenu();
          }
        }}
        onKeyDown={handleTriggerKeyDown}
      className={`flex w-full min-w-0 items-center justify-between border bg-white text-left font-bold shadow-sm outline-none transition disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-950 ${
          isPill
            ? `${isSmall ? "min-h-11 px-3 text-xs" : "min-h-11 px-4 text-sm"} gap-2 rounded-full`
            : `${isSmall ? "min-h-11 rounded-xl px-3 py-2 text-xs" : "min-h-12 rounded-2xl px-4 py-3 text-sm"} gap-3`
        } ${
          open
            ? `${isSmall ? "ring-2" : "ring-4"} border-purple-500 text-purple-800 shadow-sm ring-purple-100 dark:border-purple-400 dark:text-purple-200 dark:shadow-slate-950/30 dark:ring-purple-500/10`
            : "border-purple-100 text-slate-700 hover:border-purple-200 hover:bg-purple-50/50 dark:border-slate-700 dark:text-slate-200 dark:hover:border-purple-400 dark:hover:bg-slate-900"
        }`}
      >
        <span className="min-w-0 flex-1 truncate">{selectedLabel}</span>
        <span
          className={`grid shrink-0 place-items-center rounded-full transition ${
            isSmall ? "h-5 w-5 text-[10px]" : "h-6 w-6 text-xs"
          } ${
            open
              ? "bg-purple-700 text-white"
              : "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-200"
          }`}
        >
          <ChevronDown
            className={`${isSmall ? "h-3.5 w-3.5" : "h-4 w-4"} transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            aria-hidden="true"
          />
        </span>
      </button>

      {open && (menuPortal ? createPortal(menu, document.body) : menu)}
    </div>
  );
}

function getNextEnabledIndex(options, startIndex, direction) {
  if (!options.length) return -1;

  for (let offset = 1; offset <= options.length; offset += 1) {
    const index = (startIndex + offset * direction + options.length) % options.length;
    if (!options[index]?.disabled) return index;
  }

  return -1;
}

export default ThemedSelect;
