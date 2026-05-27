import Button from "./Button";
import { cx } from "./classNames";

function EmptyState({
  action,
  className = "",
  description,
  icon: Icon,
  title,
}) {
  return (
    <div
      className={cx(
        "ops-empty-state p-5 dark:border-purple-400/20 dark:bg-white/5",
        className,
      )}
    >
      {Icon && (
        <span className="ops-soft-icon mx-auto mb-3 grid h-11 w-11 place-items-center">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
      )}
      {title && (
        <h3 className="text-sm font-black text-slate-900 dark:text-white">
          {title}
        </h3>
      )}
      {description && (
        <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
          {description}
        </p>
      )}
      {action && (
        <Button
          className="mt-3"
          icon={action.icon}
          onClick={action.onClick}
          size="sm"
          variant={action.variant || "primary"}
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}

export default EmptyState;
