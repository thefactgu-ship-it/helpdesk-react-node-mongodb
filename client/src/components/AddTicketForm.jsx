function AddTicketForm({
  canAssignTickets = false,
  form,
  setForm,
  handleSubmit,
  submitting,
  users,
}) {
  const fieldClass =
    "w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-violet-400 dark:focus:bg-slate-900";
  const selectClass = `${fieldClass} appearance-none`;
  const labelClass = "text-sm font-semibold text-slate-700 dark:text-slate-300";

  return (
    <section className="mx-auto max-w-3xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/70 dark:border-slate-800 dark:bg-slate-950 dark:shadow-slate-950/40 md:p-10">
      <div className="mx-auto max-w-xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-sm font-black text-violet-700 ring-1 ring-violet-200 dark:bg-violet-500/20 dark:text-violet-200 dark:ring-violet-400/20">
            IT
          </div>
          <h3 className="text-2xl font-black text-slate-950 dark:text-white md:text-3xl">
            IT Service Ticket
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Field label="Title" labelClass={labelClass}>
              <input
                type="text"
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

            <Field label="Requester" labelClass={labelClass}>
              <input
                type="text"
                placeholder="Requester name"
                value={form.requester}
                minLength={2}
                maxLength={100}
                disabled={submitting}
                onChange={(e) =>
                  setForm({ ...form, requester: e.target.value })
                }
                className={fieldClass}
              />
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Minimum 2 characters.
              </p>
            </Field>

            {canAssignTickets && (
              <Field label="Assigned To" labelClass={labelClass}>
                <div className="relative">
                  <select
                    value={form.assignedTo}
                    disabled={submitting}
                    onChange={(e) =>
                      setForm({ ...form, assignedTo: e.target.value })
                    }
                    className={selectClass}
                  >
                    <option value="">Unassigned</option>
                    {users
                      .filter((user) => user.role !== "User")
                      .map((user) => (
                        <option key={user._id} value={user._id}>
                          {user.name} ({user.role})
                        </option>
                      ))}
                  </select>
                  <SelectChevron />
                </div>
              </Field>
            )}

            <Field label="Issue Category" labelClass={labelClass}>
              <div className="relative">
                <select
                  value={form.category}
                  disabled={submitting}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                  className={selectClass}
                >
                  <option value="General">General</option>
                  <option value="Software">Software</option>
                  <option value="Hardware">Hardware</option>
                  <option value="Network">Network</option>
                  <option value="Security">Security</option>
                </select>
                <SelectChevron />
              </div>
            </Field>

            <Field label="Urgency Level" labelClass={labelClass}>
              <div className="relative">
                <select
                  value={form.priority}
                  disabled={submitting}
                  onChange={(e) =>
                    setForm({ ...form, priority: e.target.value })
                  }
                  className={selectClass}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
                <SelectChevron />
              </div>
            </Field>

            <Field label="Department" labelClass={labelClass}>
              <div className="relative">
                <select
                  value={form.department}
                  disabled={submitting}
                  onChange={(e) =>
                    setForm({ ...form, department: e.target.value })
                  }
                  className={selectClass}
                >
                  <option value="IT">IT</option>
                  <option value="HR">HR</option>
                  <option value="Finance">Finance</option>
                  <option value="Operations">Operations</option>
                </select>
                <SelectChevron />
              </div>
            </Field>

            <Field label="Due Date" labelClass={labelClass}>
              <input
                type="datetime-local"
                value={form.dueDate}
                disabled={submitting}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                className={fieldClass}
              />
            </Field>
          </div>

          <Field label="Brief Description of the Issue" labelClass={labelClass}>
            <textarea
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

          <div className="flex justify-center pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-full bg-violet-600 px-7 py-3 text-sm font-black text-white shadow-lg shadow-violet-200 transition hover:-translate-y-0.5 hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-violet-500 dark:shadow-violet-950/40 dark:hover:bg-violet-400"
            >
              {submitting ? "Submitting..." : "Submit Ticket"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

function Field({ children, label, labelClass }) {
  return (
    <div className="space-y-2">
      <label className={labelClass}>{label}</label>
      {children}
    </div>
  );
}

function SelectChevron() {
  return (
    <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
      v
    </span>
  );
}

export default AddTicketForm;
