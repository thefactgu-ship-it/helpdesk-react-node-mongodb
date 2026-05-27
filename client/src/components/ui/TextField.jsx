import { cx } from "./classNames";

function TextField({
  className = "",
  error,
  hint,
  id,
  label,
  textarea = false,
  ...props
}) {
  const Control = textarea ? "textarea" : "input";

  return (
    <label className="block min-w-0" htmlFor={id}>
      {label && (
        <span className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
          {label}
        </span>
      )}
      <Control
        id={id}
        className={cx(
          "ops-input",
          textarea && "min-h-28 resize-y",
          error && "border-rose-300 focus:border-rose-500 dark:border-rose-400/40 dark:focus:border-rose-300",
          className,
        )}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={hint || error ? `${id}-helper` : undefined}
        {...props}
      />
      {(hint || error) && (
        <span
          id={`${id}-helper`}
          className={cx(
            "mt-1.5 block text-xs leading-5",
            error ? "text-rose-600 dark:text-rose-300" : "text-slate-500 dark:text-slate-400",
          )}
        >
          {error || hint}
        </span>
      )}
    </label>
  );
}

export default TextField;
