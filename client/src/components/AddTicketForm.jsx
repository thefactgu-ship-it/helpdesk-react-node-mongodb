import { AlertTriangle, CheckCircle2, Clock3, Send, Sparkles } from "lucide-react";
import ThemedSelect from "./ThemedSelect";
import { Button, Card } from "./ui";

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
  t,
}) {
  const fieldClass =
    "ops-input";
  const dateFieldClass = `${fieldClass} min-w-0 max-w-full appearance-none`;
  const labelClass = "text-sm font-black text-slate-800 dark:text-slate-200";

  const categoryOptions = problemTypes.filter((type) => type.active !== false);
  const hasProblemTypes = categoryOptions.length > 0;
  const suggestedCategories = categoryOptions.slice(0, 6);
  const assignableUsers = users.filter((user) =>
    ["admin", "manager", "agent", "staff"].includes(
      String(user.role || "").toLowerCase(),
    ),
  );
  const selectedPriority = canAssignTickets
    ? form.priority || "medium"
    : form.criticalRequested
      ? "high"
      : "medium";
  const priorityOptions = buildPriorityOptions(t);
  const priorityGuidance = buildPriorityGuidance(t);
  const selectedGuidance = priorityGuidance[selectedPriority] || priorityGuidance.medium;
  const GuidanceIcon = selectedGuidance.icon;

  return (
    <section className="ops-soft-panel mx-auto max-w-4xl md:p-6">
      <div className="mb-6 flex flex-col gap-3 border-b border-slate-200/80 pb-5 dark:border-white/10 md:flex-row md:items-start md:justify-between">
        <div className="max-w-2xl">
          <p className="ops-chip-primary">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            {t("addTicket.quickReport")}
          </p>
          <h3 className="mt-3 text-2xl font-black tracking-tight text-slate-950 dark:text-white">
            {t("addTicket.title")}
          </h3>
          <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
            {t("addTicket.intro")}
          </p>
        </div>
        <div className="rounded-lg border border-emerald-100/90 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-950 shadow-[0_8px_24px_rgba(16,185,129,0.07)] dark:border-emerald-400/15 dark:bg-emerald-500/10 dark:text-emerald-100">
          <p className="font-black">{t("addTicket.goalTitle")}</p>
          <p className="mt-1 text-xs leading-5 text-emerald-800 dark:text-emerald-100/80">{t("addTicket.goalBody")}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-5 lg:grid-cols-[1.4fr_0.9fr]">
          <div className="space-y-5 rounded-xl border border-slate-200/80 bg-white/70 p-4 dark:border-white/10 dark:bg-white/[0.03]">
            <Field label={t("addTicket.titleLabel")} labelClass={labelClass} required>
              <input
                type="text"
                required
                placeholder={t("addTicket.titlePlaceholder")}
                value={form.title}
                minLength={5}
                maxLength={200}
                disabled={submitting}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className={fieldClass}
              />
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t("addTicket.titleHint")}
              </p>
            </Field>

            <Field label={t("addTicket.categoryLabel")} labelClass={labelClass} required>
              <ThemedSelect
                value={form.category}
                disabled={submitting || loadingProblemTypes || !hasProblemTypes}
                emptyLabel={
                  loadingProblemTypes ? t("addTicket.loadingCategories") : t("addTicket.noCategories")
                }
                onChange={(value) => setForm({ ...form, category: value })}
                options={categoryOptions.map((type) => ({
                  value: type.name,
                  label: type.name,
                  meta: type.description || t("addTicket.categoryMetaFallback"),
                  prefix: "#",
                }))}
              />
              {suggestedCategories.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {suggestedCategories.map((type) => {
                    const selected = form.category === type.name;
                    return (
                      <button
                        key={type._id || type.id || type.name}
                        type="button"
                        disabled={submitting}
                        onClick={() => setForm({ ...form, category: type.name })}
                        className={`rounded-full border px-3 py-1.5 text-xs font-bold transition-colors duration-200 ${
                          selected
                            ? "border-purple-600 bg-purple-700 text-white dark:border-purple-400 dark:bg-purple-500"
                            : "border-slate-200 bg-white/85 text-slate-600 hover:border-purple-200 hover:bg-purple-50 hover:text-purple-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
                        }`}
                      >
                        {type.name}
                      </button>
                    );
                  })}
                </div>
              )}
              {!loadingProblemTypes && !hasProblemTypes && (
                <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 dark:bg-rose-500/10 dark:text-rose-200">
                  {t("addTicket.categoryAdminHint")}
                </p>
              )}
            </Field>

            <Field label={t("addTicket.descriptionLabel")} labelClass={labelClass} required>
              <textarea
                required
                rows="4"
                placeholder={t("addTicket.descriptionPlaceholder")}
                value={form.description}
                disabled={submitting}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                className={`${fieldClass} min-h-28 resize-y leading-6`}
              />
            </Field>
          </div>

          <aside className="space-y-4">
            <Card className="border-slate-200/80 dark:border-white/10">
              <div className="flex items-start gap-3">
                <span className={`mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg ${selectedGuidance.iconClass}`}>
                  <GuidanceIcon className="h-4 w-4" aria-hidden="true" />
                </span>
                <div>
                  <p className="font-black text-slate-900 dark:text-white">
                    {t("addTicket.priority")}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
                    {selectedGuidance.description}
                  </p>
                </div>
              </div>

              {!canAssignTickets && (
                <label className="mt-4 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50/80 p-3 text-sm text-amber-950 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-100">
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
                    <span className="block font-bold">{t("addTicket.urgent")}</span>
                    <span className="mt-1 block text-xs leading-5 text-amber-800 dark:text-amber-100/80">
                      {t("addTicket.urgentHint")}
                    </span>
                  </span>
                </label>
              )}
            </Card>

            {canAssignTickets && (
              <Card>
                <p className="text-sm font-black text-slate-900 dark:text-white">
                  {t("addTicket.triage")}
                </p>
                <div className="mt-4 space-y-4">
                  <Field label={t("addTicket.priority")} labelClass={labelClass}>
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

                  <Field label={t("addTicket.assign")} labelClass={labelClass}>
                    <ThemedSelect
                      value={form.assignedTo || ""}
                      disabled={submitting || !assignableUsers.length}
                      emptyLabel={t("addTicket.unassignedOption")}
                      onChange={(value) => setForm({ ...form, assignedTo: value })}
                      options={[
                        { value: "", label: t("addTicket.unassignedOption"), prefix: "-" },
                        ...assignableUsers.map((user) => ({
                          value: user._id || user.id,
                          label: user.name,
                          meta: user.role,
                          prefix: getInitials(user.name),
                        })),
                      ]}
                    />
                  </Field>

                  <Field label={t("addTicket.due")} labelClass={labelClass}>
                    <input
                      type="datetime-local"
                      value={form.dueDate || ""}
                      disabled={submitting}
                      onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                      className={dateFieldClass}
                    />
                  </Field>
                </div>
              </Card>
            )}

            <Card className="border-slate-200/80 bg-white/90 dark:border-white/10 dark:bg-white/[0.04]">
              <p className="text-sm font-black text-slate-900 dark:text-white">
                {t("addTicket.summary")}
              </p>
              <dl className="mt-3 space-y-2 text-sm">
                <SummaryItem label={t("addTicket.requester")} value={submissionSummary?.requester} />
                <SummaryItem label={t("addTicket.department")} value={submissionSummary?.department} />
                <SummaryItem label={t("addTicket.priority")} value={submissionSummary?.priority} />
              </dl>
              {submitting && (
                  <p className="mt-3 rounded-md bg-purple-50 px-3 py-2 text-xs font-semibold text-purple-700 dark:bg-purple-500/10 dark:text-purple-200">
                  {t("addTicket.creating")}
                </p>
              )}
            </Card>
          </aside>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-200/80 pt-5 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {t("addTicket.submitHint")}
          </p>
          <Button
            type="submit"
            disabled={submitting || !hasProblemTypes}
            className="min-h-12 px-6 py-3"
            variant="primary"
          >
            {submitting ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                {t("addTicket.submitting")}
              </>
            ) : (
              <>
                <Send className="h-4 w-4" aria-hidden="true" />
                {t("addTicket.submitTicket")}
              </>
            )}
          </Button>
        </div>
      </form>
    </section>
  );
}

function buildPriorityOptions(t) {
  return [
    { value: "low", label: t("addTicket.priorities.low"), meta: t("addTicket.priorityMeta.low"), prefix: "L" },
    { value: "medium", label: t("addTicket.priorities.medium"), meta: t("addTicket.priorityMeta.medium"), prefix: "M" },
    { value: "high", label: t("addTicket.priorities.high"), meta: t("addTicket.priorityMeta.high"), prefix: "H" },
    { value: "critical", label: t("addTicket.priorities.critical"), meta: t("addTicket.priorityMeta.critical"), prefix: "C" },
  ];
}

function buildPriorityGuidance(t) {
  return {
    low: {
      icon: CheckCircle2,
      iconClass: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200",
      description: t("addTicket.guidance.low"),
    },
    medium: {
      icon: Clock3,
      iconClass: "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-200",
      description: t("addTicket.guidance.medium"),
    },
    high: {
      icon: AlertTriangle,
      iconClass: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-100",
      description: t("addTicket.guidance.high"),
    },
    critical: {
      icon: AlertTriangle,
      iconClass: "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-100",
      description: t("addTicket.guidance.critical"),
    },
  };
}

function Field({ children, label, labelClass, required = false }) {
  return (
    <div className="min-w-0 space-y-2">
      <label className={labelClass}>
        {label}
        {required && (
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
    <div className="flex items-center justify-between gap-3 rounded-md bg-white/90 px-3 py-2 ring-1 ring-slate-200 dark:bg-white/5 dark:ring-white/10">
      <dt className="text-xs font-semibold text-slate-500 dark:text-slate-400">
        {label}
      </dt>
      <dd className="min-w-0 truncate text-right font-bold text-slate-800 dark:text-slate-100">
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
