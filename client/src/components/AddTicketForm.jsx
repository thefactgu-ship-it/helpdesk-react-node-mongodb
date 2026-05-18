import ThemedSelect from "./ThemedSelect";

function AddTicketForm({
  form,
  setForm,
  handleSubmit,
  submitting,
  problemTypes = [],
  loadingProblemTypes = false,
  submissionSummary,
  canAssignTickets = false,
  users = [],
}) {
  const fieldClass =
    "w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-blue-400 dark:focus:bg-slate-900";
  const labelClass = "text-sm font-semibold text-slate-700 dark:text-slate-300";

  const categoryOptions = problemTypes.filter((type) => type.active !== false);
  const hasProblemTypes = categoryOptions.length > 0;
  const assignableUsers = users.filter((user) =>
    ["admin", "manager", "agent", "staff"].includes(
      String(user.role || "").toLowerCase(),
    ),
  );

  return (
    <section className="mx-auto max-w-3xl overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:shadow-slate-950/40 md:p-10">
      <div className="mx-auto max-w-xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-sm font-black text-blue-700 ring-1 ring-blue-200 dark:bg-blue-500/20 dark:text-blue-200 dark:ring-blue-400/20">
            IT
          </div>
          <h3 className="text-2xl font-black text-slate-950 dark:text-white md:text-3xl">
            IT Service Ticket
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 gap-5">
            <Field label="Title" labelClass={labelClass}>
              <input
                type="text"
                required
                placeholder="Ticket title"
                value={form.title}
                minLength={5}
                maxLength={200}
                disabled={submitting}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className={fieldClass}
              />
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Minimum 5 characters.
              </p>
            </Field>

            <Field label="Issue Category" labelClass={labelClass}>
              <ThemedSelect
                value={form.category}
                disabled={submitting || loadingProblemTypes || !hasProblemTypes}
                emptyLabel={
                  loadingProblemTypes ? "Loading problem types..." : "No problem types available"
                }
                onChange={(value) => setForm({ ...form, category: value })}
                options={categoryOptions.map((type) => ({
                  value: type.name,
                  label: type.name,
                  meta: type.description || "Issue category",
                  prefix: "#",
                }))}
              />
              {!loadingProblemTypes && !hasProblemTypes && (
                <p className="text-xs font-semibold text-rose-600 dark:text-rose-300">
                  Ask an admin to add a problem type before creating tickets.
                </p>
              )}
              {hasProblemTypes && !form.category && (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Required. Choose the category that best matches the issue.
                </p>
              )}
            </Field>
          </div>

          <Field label="Brief Description of the Issue" labelClass={labelClass}>
            <textarea
              required
              rows="4"
              placeholder="Add a short description"
              value={form.description}
              disabled={submitting}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              className={`${fieldClass} min-h-28 resize-y`}
            />
          </Field>

          {!canAssignTickets && (
            <label className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-100">
              <input
                type="checkbox"
                checked={Boolean(form.criticalRequested)}
                disabled={submitting}
                onChange={(e) =>
                  setForm({
                    ...form,
                    criticalRequested: e.target.checked,
                    priority: e.target.checked ? "high" : "medium",
                  })
                }
                className="mt-1 h-4 w-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
              />
              <span>
                <span className="block font-bold">This is urgent / affects operations</span>
                <span className="mt-1 block text-xs leading-5 text-amber-800 dark:text-amber-100/80">
                  We will send this as High priority and ask IT/Admin to review it for Critical.
                </span>
              </span>
            </label>
          )}

          {canAssignTickets && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Triage controls
              </p>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Urgency Level" labelClass={labelClass}>
                  <ThemedSelect
                    value={form.priority || "medium"}
                    disabled={submitting}
                    onChange={(value) =>
                      setForm({
                        ...form,
                        priority: value,
                        criticalRequested: value === "critical" ? false : form.criticalRequested,
                      })
                    }
                    options={priorityOptions}
                  />
                </Field>

                <Field label="Assigned To" labelClass={labelClass}>
                  <ThemedSelect
                    value={form.assignedTo || ""}
                    disabled={submitting || !assignableUsers.length}
                    emptyLabel="Unassigned"
                    onChange={(value) => setForm({ ...form, assignedTo: value })}
                    options={[
                      { value: "", label: "Unassigned", prefix: "-" },
                      ...assignableUsers.map((user) => ({
                        value: user._id || user.id,
                        label: user.name,
                        meta: user.role,
                        prefix: getInitials(user.name),
                      })),
                    ]}
                  />
                </Field>

                <Field label="Due Date" labelClass={labelClass}>
                  <input
                    type="datetime-local"
                    value={form.dueDate || ""}
                    disabled={submitting}
                    onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                    className={fieldClass}
                  />
                </Field>
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 dark:border-blue-500/20 dark:bg-blue-500/10">
            <p className="text-xs font-bold uppercase tracking-wide text-blue-700 dark:text-blue-200">
              Ticket details filled automatically
            </p>
            <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-3">
              <SummaryItem label="Requester" value={submissionSummary?.requester} />
              <SummaryItem label="Department" value={submissionSummary?.department} />
              <SummaryItem label="Priority" value={submissionSummary?.priority} />
            </dl>
            {form.criticalRequested && (
              <p className="mt-3 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-amber-700 shadow-sm dark:bg-slate-900 dark:text-amber-200">
                Critical review requested. IT/Admin will confirm whether this becomes Critical.
              </p>
            )}
          </div>

          <div className="flex justify-center pt-2">
            <button
              type="submit"
              disabled={submitting || !hasProblemTypes}
              className="rounded-full bg-blue-600 px-7 py-3 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-blue-500 dark:shadow-slate-950/30 dark:hover:bg-blue-400"
            >
              {submitting ? "Submitting..." : "Submit Ticket"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

const priorityOptions = [
  { value: "low", label: "Low", prefix: "L" },
  { value: "medium", label: "Medium", prefix: "M" },
  { value: "high", label: "High", prefix: "H" },
  { value: "critical", label: "Critical", prefix: "C" },
];

function Field({ children, label, labelClass }) {
  return (
    <div className="space-y-2">
      <label className={labelClass}>
        {label}
        {["Title", "Issue Category", "Brief Description of the Issue"].includes(label) && (
          <span className="ml-1 text-rose-500" aria-label="required">
            *
          </span>
        )}
      </label>
      {children}
    </div>
  );
}

function SummaryItem({ label, value }) {
  return (
    <div className="rounded-xl bg-white px-3 py-2 shadow-sm dark:bg-slate-900">
      <dt className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
        {label}
      </dt>
      <dd className="mt-1 break-words font-semibold text-slate-800 dark:text-slate-100">
        {value || "-"}
      </dd>
    </div>
  );
}

function getInitials(name) {
  return String(name || "U")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export default AddTicketForm;
