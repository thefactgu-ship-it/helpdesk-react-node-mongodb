import { cx } from "./classNames";
import Button from "./Button";

function PageHeader({
  actions,
  children,
  className = "",
  description,
  eyebrow,
  icon: Icon,
  primaryAction,
  title,
  variant = "default",
}) {
  const isHero = variant === "hero";

  return (
    <header className={cx(isHero ? "ops-dashboard-hero md:p-6" : "ops-page-header", className)}>
      <div className="min-w-0">
        {eyebrow && (
          <div className={cx("inline-flex items-center gap-2", isHero ? "ops-chip-primary" : "ops-chip")}>
            {Icon && <Icon className="h-4 w-4" aria-hidden="true" />}
            {eyebrow}
          </div>
        )}
        <h1 className={cx(isHero ? "mt-3 text-2xl" : "text-2xl", "font-black text-slate-950 dark:text-white")}>
          {title}
        </h1>
        {description && (
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
            {description}
          </p>
        )}
        {children}
      </div>

      {(actions || primaryAction) && (
        <div className="flex shrink-0 flex-wrap items-center gap-3">
          {actions}
          {primaryAction && (
            <Button
              icon={primaryAction.icon}
              onClick={primaryAction.onClick}
              variant={primaryAction.variant || "primary"}
            >
              {primaryAction.label}
            </Button>
          )}
        </div>
      )}
    </header>
  );
}

export default PageHeader;
