import { AlertTriangle, CheckCircle2, Clock3, Send, Sparkles } from "lucide-react";
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
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-blue-400";
  const labelClass = "text-sm font-bold text-slate-800 dark:text-slate-200";

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
  const selectedGuidance = priorityGuidance[selectedPriority] || priorityGuidance.medium;
  const GuidanceIcon = selectedGuidance.icon;

  return (
    <section className="mx-auto max-w-4xl rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950 md:p-6">
      <div className="mb-6 flex flex-col gap-3 border-b border-slate-100 pb-5 dark:border-slate-800 md:flex-row md:items-start md:justify-between">
        <div className="max-w-2xl">
          <p className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 dark:bg-blue-500/15 dark:text-blue-200">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            แจ้งปัญหาเร็ว / Quick report
          </p>
          <h3 className="mt-3 text-2xl font-black text-slate-950 dark:text-white">
            แจ้งปัญหา / Add Ticket
          </h3>
          <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
            กรอกเฉพาะข้อมูลสำคัญก่อน ทีม IT จะใช้รายละเอียดนี้จัดคิวและติดตามงานต่อให้
          </p>
        </div>
        <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-100">
          <p className="font-bold">เป้าหมาย: 30-60 วินาที</p>
          <p className="mt-1 text-xs leading-5">หัวข้อ + หมวด + อธิบายสั้นๆ ก็ส่งได้แล้ว</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-5 lg:grid-cols-[1.4fr_0.9fr]">
          <div className="space-y-5">
            <Field label="หัวข้อปัญหา / Title" labelClass={labelClass} required>
              <input
                type="text"
                required
                placeholder="เช่น เครื่องปริ้น FO ใช้งานไม่ได้"
                value={form.title}
                minLength={5}
                maxLength={200}
                disabled={submitting}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className={fieldClass}
              />
              <p className="text-xs text-slate-500 dark:text-slate-400">
                เขียนให้รู้ว่าเกิดอะไรขึ้นและอยู่จุดไหน เช่น FO, POS, HK, Office
              </p>
            </Field>

            <Field label="หมวดปัญหา / Category" labelClass={labelClass} required>
              <ThemedSelect
                value={form.category}
                disabled={submitting || loadingProblemTypes || !hasProblemTypes}
                emptyLabel={
                  loadingProblemTypes ? "กำลังโหลดหมวดปัญหา..." : "ยังไม่มีหมวดปัญหา"
                }
                onChange={(value) => setForm({ ...form, category: value })}
                options={categoryOptions.map((type) => ({
                  value: type.name,
                  label: type.name,
                  meta: type.description || "เลือกหมวดที่ใกล้เคียงที่สุด",
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
                        className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${
                          selected
                            ? "border-blue-600 bg-blue-600 text-white"
                            : "border-slate-200 bg-slate-50 text-slate-600 hover:border-blue-300 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
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
                  กรุณาให้ Admin เพิ่ม Problem Type ก่อนสร้าง ticket
                </p>
              )}
            </Field>

            <Field label="รายละเอียดสั้นๆ / Brief description" labelClass={labelClass} required>
              <textarea
                required
                rows="4"
                placeholder="บอกอาการ, จุดที่เกิด, ผู้ได้รับผลกระทบ หรือสิ่งที่ลองแก้แล้ว"
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
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-start gap-3">
                <span className={`mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full ${selectedGuidance.iconClass}`}>
                  <GuidanceIcon className="h-4 w-4" aria-hidden="true" />
                </span>
                <div>
                  <p className="font-black text-slate-900 dark:text-white">
                    ความเร่งด่วน / Priority
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
                    {selectedGuidance.description}
                  </p>
                </div>
              </div>

              {!canAssignTickets && (
                <label className="mt-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-100">
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
                    <span className="block font-bold">กระทบงานด่วน / Urgent</span>
                    <span className="mt-1 block text-xs leading-5 text-amber-800 dark:text-amber-100/80">
                      ใช้เมื่อระบบหลักหยุด, แขกได้รับผลกระทบ, หรือ operation ทำงานต่อไม่ได้
                    </span>
                  </span>
                </label>
              )}
            </div>

            {canAssignTickets && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                <p className="text-sm font-black text-slate-900 dark:text-white">
                  จัดคิวเบื้องต้น / Triage
                </p>
                <div className="mt-4 space-y-4">
                  <Field label="ระดับความเร่งด่วน / Priority" labelClass={labelClass}>
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

                  <Field label="มอบหมายให้ / Assign" labelClass={labelClass}>
                    <ThemedSelect
                      value={form.assignedTo || ""}
                      disabled={submitting || !assignableUsers.length}
                      emptyLabel="ยังไม่มอบหมาย"
                      onChange={(value) => setForm({ ...form, assignedTo: value })}
                      options={[
                        { value: "", label: "ยังไม่มอบหมาย / Unassigned", prefix: "-" },
                        ...assignableUsers.map((user) => ({
                          value: user._id || user.id,
                          label: user.name,
                          meta: user.role,
                          prefix: getInitials(user.name),
                        })),
                      ]}
                    />
                  </Field>

                  <Field label="กำหนดเสร็จ / Due" labelClass={labelClass}>
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

            <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 dark:border-blue-500/20 dark:bg-blue-500/10">
              <p className="text-sm font-black text-blue-950 dark:text-blue-100">
                สรุปก่อนส่ง / Summary
              </p>
              <dl className="mt-3 space-y-2 text-sm">
                <SummaryItem label="ผู้แจ้ง / Requester" value={submissionSummary?.requester} />
                <SummaryItem label="แผนก / Department" value={submissionSummary?.department} />
                <SummaryItem label="Priority" value={submissionSummary?.priority} />
              </dl>
              {submitting && (
                <p className="mt-3 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-blue-700 dark:bg-slate-900 dark:text-blue-200">
                  กำลังสร้าง ticket และแจ้งทีมที่เกี่ยวข้อง...
                </p>
              )}
            </div>
          </aside>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-100 pt-5 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            ส่งแล้วระบบจะสร้าง ticket และแจ้งเตือนผู้เกี่ยวข้องทันที
          </p>
          <button
            type="submit"
            disabled={submitting || !hasProblemTypes}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-black text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-blue-500 dark:shadow-slate-950/30 dark:hover:bg-blue-400"
          >
            {submitting ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                กำลังส่ง / Submitting
              </>
            ) : (
              <>
                <Send className="h-4 w-4" aria-hidden="true" />
                ส่ง Ticket / Submit
              </>
            )}
          </button>
        </div>
      </form>
    </section>
  );
}

const priorityOptions = [
  { value: "low", label: "Low / ไม่เร่ง", meta: "งานทั่วไปหรือวางแผนได้", prefix: "L" },
  { value: "medium", label: "Medium / ปกติ", meta: "กระทบงานบางส่วน", prefix: "M" },
  { value: "high", label: "High / ด่วน", meta: "กระทบ operation หรือแขก", prefix: "H" },
  { value: "critical", label: "Critical / วิกฤต", meta: "ระบบหลักหยุดทำงาน", prefix: "C" },
];

const priorityGuidance = {
  low: {
    icon: CheckCircle2,
    iconClass: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200",
    description: "งานที่วางแผนได้ เช่น ขออุปกรณ์เสริม ขอสิทธิ์เพิ่ม หรือคำถามทั่วไป",
  },
  medium: {
    icon: Clock3,
    iconClass: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-200",
    description: "ค่าเริ่มต้นสำหรับปัญหาที่กระทบงานบางส่วน เช่น PC ช้า โปรแกรมใช้งานติดขัด",
  },
  high: {
    icon: AlertTriangle,
    iconClass: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-100",
    description: "ใช้เมื่อกระทบ operation หรือแขก เช่น printer FO เสีย, POS ใช้งานไม่ได้บางจุด",
  },
  critical: {
    icon: AlertTriangle,
    iconClass: "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-100",
    description: "ใช้เมื่อระบบหลักหยุด เช่น PMS down, internet ทั้งโรงแรมล่ม, payment ใช้ไม่ได้",
  },
};

function Field({ children, label, labelClass, required = false }) {
  return (
    <div className="space-y-2">
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
    <div className="flex items-center justify-between gap-3 rounded-lg bg-white px-3 py-2 dark:bg-slate-900">
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
