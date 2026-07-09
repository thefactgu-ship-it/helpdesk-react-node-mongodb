import { useState } from "react";
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
  currentUser,
  departments = [],
  t,
}) {
  const isWorkLogMode = ["admin", "groupadmin"].includes(
    String(currentUser?.role || "").toLowerCase()
  );
  const [requesterMode, setRequesterMode] = useState("registered");

  const fieldClass = "ops-input";
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

  const registeredUserOptions = users.map((u) => ({
    value: u._id || u.id,
    label: u.name,
    meta: `${u.role || "User"}${u.departmentName ? ` — ${u.departmentName}` : ""}`,
    prefix: getInitials(u.name),
  }));

  const departmentOptions = departments.map((dept) => ({
    value: dept._id || dept.id,
    label: dept.name,
    prefix: dept.code || "DP",
  }));

  const selectedPriority = canAssignTickets
    ? form.priority || "medium"
    : form.criticalRequested
      ? "high"
      : "medium";
  const priorityOptions = buildPriorityOptions(t);
  const priorityGuidance = buildPriorityGuidance(t);
  const selectedGuidance = priorityGuidance[selectedPriority] || priorityGuidance.medium;
  const GuidanceIcon = selectedGuidance.icon;

  // Custom Work Log labels
  const titleLabel = isWorkLogMode
    ? (t.language === "th" ? "หัวข้อการทำงาน / บันทึกงาน" : "Job Title / Work Log")
    : t("addTicket.titleLabel");
  const titlePlaceholder = isWorkLogMode
    ? (t.language === "th" ? "เช่น เปลี่ยนตลับหมึกเครื่องปริ้นแผนกบัญชี" : "e.g. Changed printer toner for Accounting dept")
    : t("addTicket.titlePlaceholder");
  const titleHint = isWorkLogMode
    ? (t.language === "th" ? "เขียนระบุงานที่ทำสั้นๆ" : "Brief description of the work done")
    : t("addTicket.titleHint");

  const descriptionLabel = isWorkLogMode
    ? (t.language === "th" ? "รายละเอียดการทำงาน" : "Work Details")
    : t("addTicket.descriptionLabel");
  const descriptionPlaceholder = isWorkLogMode
    ? (t.language === "th" ? "ระบุรายละเอียดเพิ่มเติม หรือขั้นตอนการแก้ไขปัญหา (ถ้ามี)" : "Enter additional details or steps taken to resolve the issue (optional)")
    : t("addTicket.descriptionPlaceholder");

  const headerChip = isWorkLogMode
    ? (t.language === "th" ? "บันทึกการทำงาน" : "Work Log")
    : t("addTicket.quickReport");
  const headerTitle = isWorkLogMode
    ? (t.language === "th" ? "บันทึกผลการทำงาน / ภาระงานไอที" : "IT Work Log / Record Job")
    : t("addTicket.title");
  const headerIntro = isWorkLogMode
    ? (t.language === "th" ? "บันทึกประวัติการทำงานเพื่อเก็บเป็นสถิติ โดยงานจะถูกบันทึกและปิดทันทีตามสเตตัสเสร็จสิ้น" : "Log completed IT tasks for statistics. Jobs are saved and closed immediately by default.")
    : t("addTicket.intro");

  const goalTitle = isWorkLogMode
    ? (t.language === "th" ? "บันทึกรวดเร็ว" : "Fast Logging")
    : t("addTicket.goalTitle");
  const goalBody = isWorkLogMode
    ? (t.language === "th" ? "บันทึกจบในที่เดียว ไม่รบกวนหน้าต่างคิวงานหลักของผู้ใช้ทั่วไป" : "Records work instantly in one step without affecting standard user workflows.")
    : t("addTicket.goalBody");

  const isClosed = form.status === "closed" || form.status === "resolved";
  const submitText = submitting
    ? (isWorkLogMode
      ? (isClosed
        ? (t.language === "th" ? "กำลังบันทึก..." : "Saving...")
        : (t.language === "th" ? "กำลังส่ง..." : "Submitting..."))
      : t("addTicket.submitting"))
    : (isWorkLogMode
      ? (isClosed
        ? (t.language === "th" ? "บันทึกผลการทำงาน" : "Save Work Log")
        : (t.language === "th" ? "บันทึกและส่งเข้าคิว" : "Log & Send to Queue"))
      : t("addTicket.submitTicket"));

  return (
    <section className="ops-soft-panel mx-auto max-w-4xl md:p-6">
      <div className="mb-6 flex flex-col gap-3 border-b border-slate-200/80 pb-5 dark:border-white/10 md:flex-row md:items-start md:justify-between">
        <div className="max-w-2xl">
          <p className="ops-chip-primary">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            {headerChip}
          </p>
          <h3 className="mt-3 text-2xl font-black tracking-tight text-slate-950 dark:text-white">
            {headerTitle}
          </h3>
          <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
            {headerIntro}
          </p>
        </div>
        <div className="rounded-lg border border-emerald-100/90 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-950 shadow-[0_8px_24px_rgba(16,185,129,0.07)] dark:border-emerald-400/15 dark:bg-emerald-500/10 dark:text-emerald-100">
          <p className="font-black">{goalTitle}</p>
          <p className="mt-1 text-xs leading-5 text-emerald-800 dark:text-emerald-100/80">{goalBody}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-5 lg:grid-cols-[1.4fr_0.9fr]">
          <div className="space-y-5 rounded-xl border border-slate-200/80 bg-white/70 p-4 dark:border-white/10 dark:bg-white/[0.03]">
            <Field label={titleLabel} labelClass={labelClass} required>
              <input
                type="text"
                required
                placeholder={titlePlaceholder}
                value={form.title}
                minLength={5}
                maxLength={200}
                disabled={submitting}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className={fieldClass}
              />
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {titleHint}
              </p>
            </Field>

            {isWorkLogMode && (
              <>
                <Field
                  label={
                    <div className="flex items-center justify-between">
                      <span>{t.language === "th" ? "ผู้รับบริการ / ทำงานให้ใคร" : "Who did you work for?"}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const nextMode = requesterMode === "registered" ? "custom" : "registered";
                          setRequesterMode(nextMode);
                          setForm((prev) => ({ ...prev, requester: "", requesterUserId: "" }));
                        }}
                        className="text-xs font-bold text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300"
                      >
                        {requesterMode === "registered"
                          ? (t.language === "th" ? "ระบุชื่อเอง" : "Type custom name")
                          : (t.language === "th" ? "เลือกผู้ใช้ในระบบ" : "Select registered user")}
                      </button>
                    </div>
                  }
                  labelClass={labelClass}
                  required
                >
                  {requesterMode === "registered" ? (
                    <ThemedSelect
                      value={form.requesterUserId || ""}
                      disabled={submitting}
                      placeholder={t.language === "th" ? "ค้นหาและเลือกผู้ใช้ในระบบ..." : "Search and select user..."}
                      onChange={(value) => {
                        const selectedUser = users.find((u) => (u._id || u.id) === value);
                        if (selectedUser) {
                          const userDeptId = selectedUser.departmentId?._id || selectedUser.departmentId || "";
                          const userDeptName = selectedUser.departmentName || "";
                          setForm((prev) => ({
                            ...prev,
                            requesterUserId: value,
                            requester: selectedUser.name,
                            departmentId: userDeptId || prev.departmentId,
                            department: userDeptName || prev.department,
                          }));
                        }
                      }}
                      options={registeredUserOptions}
                    />
                  ) : (
                    <input
                      type="text"
                      required
                      placeholder={t.language === "th" ? "พิมพ์ชื่อผู้รับบริการ เช่น คุณสมศักดิ์" : "Type requester name, e.g. John Doe"}
                      value={form.requester}
                      disabled={submitting}
                      onChange={(e) => setForm({ ...form, requester: e.target.value, requesterUserId: "" })}
                      className={fieldClass}
                    />
                  )}
                </Field>

                <Field
                  label={t.language === "th" ? "แผนกที่รับบริการ" : "Department of Recipient"}
                  labelClass={labelClass}
                  required
                >
                  <ThemedSelect
                    value={form.departmentId || ""}
                    disabled={submitting || !departmentOptions.length}
                    placeholder={t.language === "th" ? "เลือกแผนก..." : "Select department..."}
                    onChange={(value) => {
                      const selectedDept = departments.find((dept) => (dept._id || dept.id) === value);
                      if (selectedDept) {
                        setForm({
                          ...form,
                          departmentId: value,
                          department: selectedDept.name,
                        });
                      }
                    }}
                    options={departmentOptions}
                  />
                </Field>
              </>
            )}

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
                            ? "border-slate-800 bg-slate-800 text-white dark:border-teal-100/30 dark:bg-[#0a1f23]"
                            : "border-slate-200 bg-white/85 text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
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

            <Field label={descriptionLabel} labelClass={labelClass} required>
              <textarea
                required
                rows="4"
                placeholder={descriptionPlaceholder}
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
                  {isWorkLogMode && (
                    <Field
                      label={t.language === "th" ? "ผลการทำงาน / สถานะ" : "Job Status / Outcome"}
                      labelClass={labelClass}
                    >
                      <ThemedSelect
                        value={form.status || "closed"}
                        disabled={submitting}
                        onChange={(value) => setForm({ ...form, status: value })}
                        options={[
                          {
                            value: "closed",
                            label: t.language === "th" ? "เสร็จสิ้น (บันทึกงานย้อนหลัง)" : "Closed (Completed)",
                            meta: t.language === "th" ? "งานดำเนินการเสร็จเรียบร้อยแล้ว" : "Job is finished and resolved",
                          },
                          {
                            value: "open",
                            label: t.language === "th" ? "เปิดงานค้างไว้ (ส่งเข้าคิว IT)" : "Open (Add to queue)",
                            meta: t.language === "th" ? "งานที่ต้องทำต่อหรือให้ทีมตามงาน" : "Requires further work or tracking",
                          },
                        ]}
                      />
                    </Field>
                  )}

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
                <p className="mt-3 rounded-md bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 dark:bg-white/[0.06] dark:text-teal-50">
                  {t("addTicket.creating")}
                </p>
              )}
            </Card>
          </aside>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-200/80 pt-5 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {isWorkLogMode
              ? (t.language === "th"
                ? "บันทึกแล้ว ระบบจะปิดงานและลงข้อมูลในระบบประวัติการทำงานทันที"
                : "Saving will close the job and log it in the work history immediately.")
              : t("addTicket.submitHint")}
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
                {submitText}
              </>
            ) : (
              <>
                <Send className="h-4 w-4" aria-hidden="true" />
                {submitText}
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
      iconClass: "bg-slate-100 text-slate-700 dark:bg-white/[0.06] dark:text-teal-50",
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
