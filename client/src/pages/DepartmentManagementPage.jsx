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
        confirmLabel="Deactivate"
        open={!!pendingDeleteId}
        title="Deactivate Department"
        message={`Deactivate ${
          pendingDeleteDepartment?.name || "this department"
        }? Existing tickets keep their history, but it will stop appearing in new forms.`}
        onCancel={() => setPendingDeleteId(null)}
        onConfirm={confirmDeactivate}
      />

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950 md:p-6">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-blue-600 dark:text-blue-300">
          System
        </p>
        <h3 className="text-2xl font-black text-slate-950 dark:text-white">
          Department Management
        </h3>
        <p className="mt-2 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
          Maintain hotel-scoped departments for tickets, users, and reports.
        </p>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950 md:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h4 className="text-lg font-black text-slate-950 dark:text-white">
              Department setup
            </h4>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Add or update hotel-scoped departments from a focused drawer.
            </p>
          </div>
          <button
            type="button"
            onClick={openCreateDrawer}
            className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-blue-700"
          >
            Add Department
          </button>
        </div>
      </section>

      <Drawer
        eyebrow="System setup"
        onClose={cancelEdit}
        open={formDrawerOpen}
        subtitle="Department code keeps reporting and filters consistent."
        title={isEditing ? "Edit Department" : "Add Department"}
        widthClass="max-w-2xl"
      >
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Department Name">
              <input
                value={form.name}
                disabled={saving}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                className={inputClass}
                placeholder="Housekeeping"
              />
            </Field>

            <Field label="Code">
              <input
                value={form.code}
                disabled={saving}
                onChange={(event) => setForm({ ...form, code: event.target.value })}
                className={inputClass}
                placeholder="HK"
              />
            </Field>

            <Field label="Hotel">
              <ThemedSelect
                value={form.hotelId}
                disabled={saving || isEditing}
                onChange={(value) => setForm({ ...form, hotelId: value })}
                options={[
                  { value: "", label: "Current hotel scope", prefix: "-" },
                  ...hotels.map((hotel) => ({
                    value: hotel._id || hotel.id,
                    label: `${hotel.code} / ${hotel.name}`,
                    meta: hotel.region || "Hotel",
                    prefix: String(hotel.code || "HT").slice(0, 2),
                  })),
                ]}
              />
            </Field>

            <Field label="Sort Order">
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

            <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
              <input
                type="checkbox"
                checked={form.active}
                disabled={saving}
                onChange={(event) => setForm({ ...form, active: event.target.checked })}
                className="h-4 w-4 accent-blue-600"
              />
              Active department
            </label>

            <button
              type="submit"
              disabled={saving}
              className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-blue-500 dark:shadow-slate-950/30 dark:hover:bg-blue-400 sm:col-span-2"
            >
              {saving ? "Saving..." : isEditing ? "Save Department" : "Create Department"}
            </button>
          </form>
      </Drawer>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950 md:p-6">
          <div className="mb-5">
            <h4 className="text-lg font-black text-slate-950 dark:text-white">
              Departments
            </h4>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {activeDepartments.length} active / {departments.length} total departments
            </p>
          </div>

          <div className="grid gap-3 md:hidden">
            {paginatedDepartments.map((department) => {
              const departmentId = department._id || department.id;
              const isActive = department.active !== false;

              return (
                <article
                  key={departmentId}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h4 className="break-words text-base font-black text-slate-950 dark:text-white">
                        {department.name}
                      </h4>
                      <p className="mt-1 text-sm font-bold text-blue-700 dark:text-blue-300">
                        {department.code}
                      </p>
                    </div>
                    <StatusBadge active={isActive} />
                  </div>

                  <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <MobileMeta label="Hotel" value={department.hotelId?.code || department.hotelId?.name || "-"} />
                    <MobileMeta label="Sort" value={department.sortOrder ?? 100} />
                  </dl>

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Sort {department.sortOrder ?? 100}
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
                      />
                    </div>
                  </div>
                </article>
              );
            })}

            {!departments.length && (
              <SystemEmptyState title="No departments found" description="Add departments so requesters and staff can route tickets cleanly." />
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
                        <div className="break-words text-xs font-semibold text-blue-700 dark:text-blue-300">
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
                        <StatusBadge active={isActive} />
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
                      <SystemEmptyState title="No departments found" description="Add departments so requesters and staff can route tickets cleanly." />
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
  "w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-blue-400";

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

function StatusBadge({ active }) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-bold ${
        active
          ? "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-200"
          : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
      }`}
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function MobileMeta({ label, value }) {
  return (
    <div className="rounded-lg bg-white p-3 dark:bg-slate-950">
      <dt className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
        {label}
      </dt>
      <dd className="mt-1 break-words font-semibold text-slate-800 dark:text-slate-100">
        {value}
      </dd>
    </div>
  );
}

function DepartmentActions({ deleting, isActive, onDeactivate, onEdit, onToggle, open }) {
  return (
    <ActionMenu
      open={open}
      onToggle={onToggle}
      actions={[
        { label: "Edit", onClick: onEdit },
        isActive && {
          label: deleting ? "Saving..." : "Deactivate",
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
    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center dark:border-slate-700 dark:bg-slate-900">
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-white text-sm font-black text-blue-600 shadow-sm dark:bg-slate-950 dark:text-blue-300">
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
        className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold disabled:opacity-40 dark:border-slate-700"
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
        className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold disabled:opacity-40 dark:border-slate-700"
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
