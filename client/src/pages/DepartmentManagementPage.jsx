import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import ActionMenu from "../components/ActionMenu";
import ConfirmModal from "../components/ConfirmModal";
import Drawer from "../components/Drawer";
import ThemedSelect from "../components/ThemedSelect";
import {
  createDepartment,
  deactivateDepartment,
  updateDepartment,
} from "../services/departmentService";

const emptyForm = {
  name: "",
  code: "",
  hotelId: "",
  sortOrder: 100,
  active: true,
};
const departmentsPerPage = 8;

function DepartmentManagementPage({
  departments = [],
  hotels = [],
  onDepartmentsChange,
  selectedHotelId = "all",
  t = (key) => key,
  token,
}) {
  const [form, setForm] = useState({
    ...emptyForm,
    hotelId: selectedHotelId === "all" ? "" : selectedHotelId,
  });
  const [editingDepartmentId, setEditingDepartmentId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [formDrawerOpen, setFormDrawerOpen] = useState(false);
  const [openActionDepartmentId, setOpenActionDepartmentId] = useState(null);
  const isEditing = Boolean(editingDepartmentId);
  const activeDepartments = useMemo(
    () => departments.filter((department) => department.active !== false),
    [departments],
  );
  const totalPages = Math.max(1, Math.ceil(departments.length / departmentsPerPage));
  const visiblePage = Math.min(currentPage, totalPages);
  const paginatedDepartments = useMemo(() => {
    const startIndex = (visiblePage - 1) * departmentsPerPage;
    return departments.slice(startIndex, startIndex + departmentsPerPage);
  }, [departments, visiblePage]);
  const pendingDeleteDepartment = departments.find(
    (department) => (department._id || department.id) === pendingDeleteId,
  );

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.name.trim() || !form.code.trim()) {
      toast.error("Department name and code are required");
      return;
    }

    try {
      setSaving(true);
      const params = form.hotelId ? { hotelId: form.hotelId } : undefined;
      const payload = {
        name: form.name.trim(),
        code: form.code.trim().toUpperCase(),
        hotelId: form.hotelId || undefined,
        sortOrder: Number(form.sortOrder) || 100,
        active: form.active,
      };

      if (isEditing) {
        await updateDepartment(token, editingDepartmentId, payload, params);
        toast.success("Department updated");
      } else {
        await createDepartment(token, payload, params);
        toast.success("Department created");
      }

      setForm({ ...emptyForm, hotelId: selectedHotelId === "all" ? "" : selectedHotelId });
      setEditingDepartmentId(null);
      setFormDrawerOpen(false);
      setCurrentPage(1);
      await onDepartmentsChange();
    } catch (error) {
      console.error("Failed to save department", error);
      toast.error(getErrorMessage(error, "Failed to save department"));
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (department) => {
    setEditingDepartmentId(department._id || department.id);
    setForm({
      name: department.name || "",
      code: department.code || "",
      hotelId: department.hotelId?._id || department.hotelId || "",
      sortOrder: department.sortOrder || 100,
      active: department.active !== false,
    });
    setOpenActionDepartmentId(null);
    setFormDrawerOpen(true);
  };

  const cancelEdit = () => {
    setEditingDepartmentId(null);
    setForm({ ...emptyForm, hotelId: selectedHotelId === "all" ? "" : selectedHotelId });
    setFormDrawerOpen(false);
  };

  const openCreateDrawer = () => {
    setEditingDepartmentId(null);
    setForm({ ...emptyForm, hotelId: selectedHotelId === "all" ? "" : selectedHotelId });
    setFormDrawerOpen(true);
  };

  const confirmDeactivate = async () => {
    if (!pendingDeleteId) return;

    try {
      setDeletingId(pendingDeleteId);
      const department = departments.find((item) => (item._id || item.id) === pendingDeleteId);
      const hotelId = department?.hotelId?._id || department?.hotelId;
      await deactivateDepartment(token, pendingDeleteId, hotelId ? { hotelId } : undefined);
      toast.success("Department deactivated");
      setPendingDeleteId(null);
      setCurrentPage(visiblePage);
      await onDepartmentsChange();
    } catch (error) {
      console.error("Failed to deactivate department", error);
      toast.error(getErrorMessage(error, "Failed to deactivate department"));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-5">
      <ConfirmModal
        confirmLabel={t("settings.actions.deactivate")}
        open={!!pendingDeleteId}
        title={t("settings.department.deactivateTitle")}
        message={t("settings.department.deactivateMessage", {
          name: pendingDeleteDepartment?.name || "this department",
        })}
        onCancel={() => setPendingDeleteId(null)}
        onConfirm={confirmDeactivate}
      />

      <section className="ops-panel md:p-6">
        <p className="ops-section-label mb-2">
          System
        </p>
        <h3 className="text-2xl font-black text-slate-950 dark:text-white">
          Department Management
        </h3>
        <p className="mt-2 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
          Maintain hotel-scoped departments for tickets, users, and reports.
        </p>
      </section>

      <section className="ops-panel md:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h4 className="text-lg font-black text-slate-950 dark:text-white">
              {t("settings.department.setupTitle")}
            </h4>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {t("settings.department.setupDescription")}
            </p>
          </div>
          <button
            type="button"
            onClick={openCreateDrawer}
            className="ops-button-primary px-5 py-3 text-sm"
          >
            {t("settings.department.add")}
          </button>
        </div>
      </section>

      <Drawer
        eyebrow={t("settings.eyebrow")}
        onClose={cancelEdit}
        open={formDrawerOpen}
        subtitle={t("settings.department.drawerHint")}
        title={isEditing ? t("settings.department.edit") : t("settings.department.add")}
        widthClass="max-w-2xl"
      >
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label={t("settings.department.name")}>
              <input
                value={form.name}
                disabled={saving}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                className={inputClass}
                placeholder="Housekeeping"
              />
            </Field>

            <Field label={t("settings.department.code")}>
              <input
                value={form.code}
                disabled={saving}
                onChange={(event) => setForm({ ...form, code: event.target.value })}
                className={inputClass}
                placeholder="HK"
              />
            </Field>

            <Field label={t("settings.department.hotel")}>
              <ThemedSelect
                value={form.hotelId}
                disabled={saving || isEditing}
                onChange={(value) => setForm({ ...form, hotelId: value })}
                options={[
                  { value: "", label: t("settings.department.currentHotelScope"), prefix: "-" },
                  ...hotels.map((hotel) => ({
                    value: hotel._id || hotel.id,
                    label: `${hotel.code} / ${hotel.name}`,
                    meta: hotel.region || "Hotel",
                    prefix: String(hotel.code || "HT").slice(0, 2),
                  })),
                ]}
              />
            </Field>

            <Field label={t("settings.department.sortOrder")}>
              <input
                type="number"
                min="0"
                max="9999"
                value={form.sortOrder}
                disabled={saving}
                onChange={(event) => setForm({ ...form, sortOrder: event.target.value })}
                className={inputClass}
              />
            </Field>

            <label className="flex items-center gap-3 rounded-lg border border-slate-200/80 bg-white/90 px-4 py-3 text-sm font-semibold text-slate-700 backdrop-blur-sm dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
              <input
                type="checkbox"
                checked={form.active}
                disabled={saving}
                onChange={(event) => setForm({ ...form, active: event.target.checked })}
                className="h-4 w-4 accent-emerald-600"
              />
              {t("settings.department.activeToggle")}
            </label>

            <button
              type="submit"
              disabled={saving}
              className="ops-button-primary px-5 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-60 sm:col-span-2"
            >
              {saving ? t("settings.actions.saving") : isEditing ? t("settings.department.save") : t("settings.department.create")}
            </button>
          </form>
      </Drawer>

      <section className="ops-panel md:p-6">
          <div className="mb-5">
            <h4 className="text-lg font-black text-slate-950 dark:text-white">
              {t("settings.department.listTitle")}
            </h4>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {t("settings.department.summary", { active: activeDepartments.length, total: departments.length })}
            </p>
          </div>

          <div className="grid gap-3 md:hidden">
            {paginatedDepartments.map((department) => {
              const departmentId = department._id || department.id;
              const isActive = department.active !== false;

              return (
                <article
                  key={departmentId}
                  className="ops-card"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h4 className="break-words text-base font-black text-slate-950 dark:text-white">
                        {department.name}
                      </h4>
                      <p className="mt-1 font-mono text-xs font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-200">
                        {department.code}
                      </p>
                    </div>
                    <StatusBadge active={isActive} t={t} />
                  </div>

                  <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <MobileMeta label="Hotel" value={department.hotelId?.code || department.hotelId?.name || "-"} />
                    <MobileMeta label="Sort" value={department.sortOrder ?? 100} />
                  </dl>

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {t("settings.department.sortShort", { sort: department.sortOrder ?? 100 })}
                    </p>
                    <div className="relative" onClick={(event) => event.stopPropagation()}>
                      <DepartmentActions
                        deleting={deletingId === departmentId}
                        isActive={isActive}
                        onDeactivate={() => setPendingDeleteId(departmentId)}
                        onEdit={() => startEdit(department)}
                        open={openActionDepartmentId === departmentId}
                        onToggle={() =>
                          setOpenActionDepartmentId(openActionDepartmentId === departmentId ? null : departmentId)
                        }
                        t={t}
                      />
                    </div>
                  </div>
                </article>
              );
            })}

            {!departments.length && (
              <SystemEmptyState title={t("settings.department.emptyTitle")} description={t("settings.department.emptyDescription")} />
            )}
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="min-w-[48rem] w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                  <th className="px-3 py-3">Department</th>
                  <th className="px-3">Hotel</th>
                  <th className="px-3">Sort</th>
                  <th className="px-3">Status</th>
                  <th className="px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedDepartments.map((department) => {
                  const departmentId = department._id || department.id;
                  const isActive = department.active !== false;

                  return (
                    <tr
                      key={departmentId}
                      className="border-b border-slate-100 last:border-0 dark:border-slate-800"
                    >
                      <td className="max-w-64 px-3 py-4">
                        <div className="line-clamp-2 break-words font-bold text-slate-900 dark:text-white">
                          {department.name}
                        </div>
                        <div className="break-words font-mono text-xs font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-200">
                          {department.code}
                        </div>
                      </td>
                      <td className="max-w-56 break-words px-3 text-slate-600 dark:text-slate-300">
                        {department.hotelId?.code || department.hotelId?.name || "-"}
                      </td>
                      <td className="whitespace-nowrap px-3 text-slate-600 dark:text-slate-300">
                        {department.sortOrder ?? 100}
                      </td>
                      <td className="px-3">
                        <StatusBadge active={isActive} t={t} />
                      </td>
                      <td className="px-3">
                        <div className="flex justify-end gap-2">
                          <div className="relative">
                            <DepartmentActions
                              deleting={deletingId === departmentId}
                              isActive={isActive}
                              onDeactivate={() => setPendingDeleteId(departmentId)}
                              onEdit={() => startEdit(department)}
                              open={openActionDepartmentId === departmentId}
                              onToggle={() =>
                                setOpenActionDepartmentId(openActionDepartmentId === departmentId ? null : departmentId)
                              }
                              t={t}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {!departments.length && (
                  <tr>
                    <td colSpan="5" className="py-8">
                      <SystemEmptyState title={t("settings.department.emptyTitle")} description={t("settings.department.emptyDescription")} />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <PaginationControls
            currentPage={visiblePage}
            onPageChange={setCurrentPage}
            totalPages={totalPages}
          />
      </section>
    </div>
  );
}

const inputClass =
  "ops-input disabled:cursor-not-allowed disabled:opacity-60";

function Field({ children, label }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
        {label}
      </span>
      {children}
    </label>
  );
}

function StatusBadge({ active, t = (key) => key }) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-bold ${
        active
          ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-200 dark:ring-emerald-400/20"
          : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
      }`}
    >
      {active ? t("settings.active") : t("settings.inactive")}
    </span>
  );
}

function MobileMeta({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-200/80 bg-white/90 p-3 dark:border-white/10 dark:bg-white/5">
      <dt className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
        {label}
      </dt>
      <dd className="mt-1 break-words font-semibold text-slate-800 dark:text-slate-100">
        {value}
      </dd>
    </div>
  );
}

function DepartmentActions({ deleting, isActive, onDeactivate, onEdit, onToggle, open, t }) {
  return (
    <ActionMenu
      open={open}
      onToggle={onToggle}
      actions={[
        { label: t("settings.actions.edit"), onClick: onEdit },
        isActive && {
          label: deleting ? t("settings.actions.saving") : t("settings.actions.deactivate"),
          danger: true,
          disabled: deleting,
          onClick: onDeactivate,
        },
      ]}
    />
  );
}

function SystemEmptyState({ description, title }) {
  return (
    <div className="ops-empty-state p-6">
      <div className="ops-icon-primary mx-auto grid h-10 w-10 place-items-center text-sm font-black">
        0
      </div>
      <p className="mt-3 font-bold text-slate-800 dark:text-slate-100">{title}</p>
      <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
        {description}
      </p>
    </div>
  );
}

function PaginationControls({ currentPage, onPageChange, totalPages }) {
  if (totalPages <= 1) return null;

  return (
    <div className="mt-5 flex items-center justify-between gap-3">
      <button
        type="button"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        className="ops-button-secondary px-4 py-2 text-sm font-semibold disabled:opacity-40"
      >
        Previous
      </button>

      <span className="text-sm text-slate-500 dark:text-slate-400">
        Page {currentPage} of {totalPages}
      </span>

      <button
        type="button"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className="ops-button-secondary px-4 py-2 text-sm font-semibold disabled:opacity-40"
      >
        Next
      </button>
    </div>
  );
}

function getErrorMessage(error, fallback) {
  return error?.response?.data?.message || error?.message || fallback;
}

export default DepartmentManagementPage;
