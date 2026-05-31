import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import ActionMenu from "../components/ActionMenu";
import ConfirmModal from "../components/ConfirmModal";
import Drawer from "../components/Drawer";
import {
  createHotel,
  deactivateHotel,
  updateHotel,
} from "../services/hotelService";

const emptyForm = {
  name: "",
  code: "",
  region: "Phuket",
  timezone: "Asia/Bangkok",
  active: true,
};

const HOTEL_CODE_EDIT_ROLES = ["GroupAdmin", "Admin"];

function HotelManagementPage({
  currentUser,
  hotels = [],
  onHotelsChange,
  t = (key) => key,
  token,
}) {
  const [form, setForm] = useState(emptyForm);
  const [editingHotelId, setEditingHotelId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const [formDrawerOpen, setFormDrawerOpen] = useState(false);
  const [openActionHotelId, setOpenActionHotelId] = useState(null);
  const isEditing = Boolean(editingHotelId);
  const canEditHotelCode = HOTEL_CODE_EDIT_ROLES.includes(currentUser?.role);
  const activeHotels = useMemo(
    () => hotels.filter((hotel) => hotel.active !== false),
    [hotels],
  );
  const inactiveHotels = useMemo(
    () => hotels.filter((hotel) => hotel.active === false),
    [hotels],
  );
  const pendingDeleteHotel = hotels.find(
    (hotel) => (hotel._id || hotel.id) === pendingDeleteId,
  );

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.name.trim() || !form.code.trim()) {
      toast.error("Hotel name and code are required");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        name: form.name.trim(),
        code: form.code.trim().toUpperCase(),
        region: form.region.trim() || "Default",
        timezone: form.timezone.trim() || "Asia/Bangkok",
        active: form.active,
      };

      if (isEditing) {
        await updateHotel(token, editingHotelId, payload);
        toast.success("Hotel updated");
      } else {
        await createHotel(token, payload);
        toast.success("Hotel created");
      }

      setForm(emptyForm);
      setEditingHotelId(null);
      setFormDrawerOpen(false);
      await onHotelsChange();
    } catch (error) {
      console.error("Failed to save hotel", error);
      toast.error(getErrorMessage(error, "Failed to save hotel"));
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (hotel) => {
    setEditingHotelId(hotel._id || hotel.id);
    setForm({
      name: hotel.name || "",
      code: hotel.code || "",
      region: hotel.region || "Default",
      timezone: hotel.timezone || "Asia/Bangkok",
      active: hotel.active !== false,
    });
    setOpenActionHotelId(null);
    setFormDrawerOpen(true);
  };

  const cancelEdit = () => {
    setEditingHotelId(null);
    setForm(emptyForm);
    setFormDrawerOpen(false);
  };

  const openCreateDrawer = () => {
    setEditingHotelId(null);
    setForm(emptyForm);
    setFormDrawerOpen(true);
  };

  const confirmDeactivate = async () => {
    if (!pendingDeleteId) return;

    try {
      setDeletingId(pendingDeleteId);
      await deactivateHotel(token, pendingDeleteId);
      toast.success("Hotel deactivated");
      setPendingDeleteId(null);
      await onHotelsChange();
    } catch (error) {
      console.error("Failed to deactivate hotel", error);
      toast.error(getErrorMessage(error, "Failed to deactivate hotel"));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-5">
      <ConfirmModal
        confirmLabel={t("settings.actions.deactivate")}
        open={!!pendingDeleteId}
        title={t("settings.hotel.deactivateTitle")}
        message={t("settings.hotel.deactivateMessage", {
          name: pendingDeleteHotel?.name || "this hotel",
        })}
        onCancel={() => setPendingDeleteId(null)}
        onConfirm={confirmDeactivate}
      />

      <section className="ops-panel md:p-6">
        <p className="ops-section-label mb-2">
          Group
        </p>
        <h3 className="text-2xl font-black text-slate-950 dark:text-white">
          Hotel Management
        </h3>
        <p className="mt-2 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
          Add hotels for tenant-scoped helpdesk data, reports, assets, and user access.
        </p>
      </section>

      <section className="ops-panel md:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h4 className="text-lg font-black text-slate-950 dark:text-white">
              {t("settings.hotel.setupTitle")}
            </h4>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {t("settings.hotel.setupDescription")}
            </p>
          </div>
          <button
            type="button"
            onClick={openCreateDrawer}
            className="ops-button-primary px-5 py-3 text-sm"
          >
            {t("settings.hotel.add")}
          </button>
        </div>
      </section>

      <Drawer
        eyebrow={t("settings.eyebrow")}
        onClose={cancelEdit}
        open={formDrawerOpen}
        subtitle={t("settings.hotel.drawerHint")}
        title={isEditing ? t("settings.hotel.edit") : t("settings.hotel.add")}
        widthClass="max-w-2xl"
      >
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label={t("settings.hotel.name")}>
              <input
                value={form.name}
                disabled={saving}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                className={inputClass}
                placeholder="Thavorn Beach Village"
              />
            </Field>

            <Field label={t("settings.hotel.code")}>
              <input
                value={form.code}
                disabled={saving || (isEditing && !canEditHotelCode)}
                onChange={(event) => setForm({ ...form, code: event.target.value })}
                className={inputClass}
                placeholder="TBV"
              />
              {isEditing && canEditHotelCode && (
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  {t("settings.hotel.codeEditHint")}
                </p>
              )}
            </Field>

            <Field label={t("settings.hotel.region")}>
              <input
                value={form.region}
                disabled={saving}
                onChange={(event) => setForm({ ...form, region: event.target.value })}
                className={inputClass}
                placeholder="Phuket"
              />
            </Field>

            <Field label={t("settings.hotel.timezone")}>
              <input
                value={form.timezone}
                disabled={saving}
                onChange={(event) => setForm({ ...form, timezone: event.target.value })}
                className={inputClass}
                placeholder="Asia/Bangkok"
              />
            </Field>

            <label className="ops-form-toggle">
              <input
                type="checkbox"
                checked={form.active}
                disabled={saving}
                onChange={(event) => setForm({ ...form, active: event.target.checked })}
                className="h-4 w-4 accent-emerald-600"
              />
              {t("settings.hotel.activeToggle")}
            </label>

            <button
              type="submit"
              disabled={saving}
              className="ops-button-primary px-5 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-60 sm:col-span-2"
            >
              {saving ? t("settings.actions.saving") : isEditing ? t("settings.hotel.save") : t("settings.hotel.create")}
            </button>
          </form>
      </Drawer>

      <section className="ops-panel md:p-6">
          <div className="mb-5">
            <h4 className="text-lg font-black text-slate-950 dark:text-white">
              {t("settings.hotel.listTitle")}
            </h4>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {t("settings.hotel.activeSummary", { active: activeHotels.length })}
              {inactiveHotels.length ? t("settings.hotel.inactiveSummary", { inactive: inactiveHotels.length }) : ""}
            </p>
          </div>

          <div className="grid gap-3 md:hidden">
            {hotels.map((hotel) => {
              const hotelId = hotel._id || hotel.id;
              const isActive = hotel.active !== false;

              return (
                <article
                  key={hotelId}
                  className="ops-card"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h4 className="break-words text-base font-black text-slate-950 dark:text-white">
                        {hotel.name}
                      </h4>
                      <p className="mt-1 font-mono text-xs font-bold uppercase tracking-wide text-amber-700 dark:text-amber-200">
                        {hotel.code}
                      </p>
                    </div>
                    <StatusBadge active={isActive} t={t} />
                  </div>

                  <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <MobileMeta label="Region" value={hotel.region || "-"} />
                    <MobileMeta label="Timezone" value={hotel.timezone || "-"} />
                  </dl>

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {hotel.region || "-"} / {hotel.timezone || "-"}
                    </p>
                    <div className="relative" onClick={(event) => event.stopPropagation()}>
                      <HotelActions
                        deleting={deletingId === hotelId}
                        isActive={isActive}
                        onDeactivate={() => setPendingDeleteId(hotelId)}
                        onEdit={() => startEdit(hotel)}
                        open={openActionHotelId === hotelId}
                        onToggle={() =>
                          setOpenActionHotelId(openActionHotelId === hotelId ? null : hotelId)
                        }
                        t={t}
                      />
                    </div>
                  </div>
                </article>
              );
            })}

            {!hotels.length && (
              <SystemEmptyState title={t("settings.hotel.emptyTitle")} description={t("settings.hotel.emptyDescription")} />
            )}
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="min-w-[48rem] w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                  <th className="px-3 py-3">Hotel</th>
                  <th className="px-3">Region</th>
                  <th className="px-3">Timezone</th>
                  <th className="px-3">Status</th>
                  <th className="px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {hotels.map((hotel) => {
                  const hotelId = hotel._id || hotel.id;
                  const isActive = hotel.active !== false;

                  return (
                    <tr
                      key={hotelId}
                      className="border-b border-slate-100 last:border-0 dark:border-slate-800"
                    >
                      <td className="max-w-64 px-3 py-4">
                        <div className="line-clamp-2 break-words font-bold text-slate-900 dark:text-white">
                          {hotel.name}
                        </div>
                        <div className="break-words font-mono text-xs font-bold uppercase tracking-wide text-amber-700 dark:text-amber-200">
                          {hotel.code}
                        </div>
                      </td>
                      <td className="max-w-40 break-words px-3 text-slate-600 dark:text-slate-300">
                        {hotel.region || "-"}
                      </td>
                      <td className="max-w-48 break-words px-3 text-slate-600 dark:text-slate-300">
                        {hotel.timezone || "-"}
                      </td>
                      <td className="px-3">
                        <StatusBadge active={isActive} t={t} />
                      </td>
                      <td className="px-3">
                        <div className="flex justify-end gap-2">
                          <div className="relative">
                            <HotelActions
                              deleting={deletingId === hotelId}
                              isActive={isActive}
                              onDeactivate={() => setPendingDeleteId(hotelId)}
                              onEdit={() => startEdit(hotel)}
                              open={openActionHotelId === hotelId}
                              onToggle={() =>
                                setOpenActionHotelId(openActionHotelId === hotelId ? null : hotelId)
                              }
                              t={t}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {!hotels.length && (
                  <tr>
                    <td colSpan="5" className="py-8">
                      <SystemEmptyState title={t("settings.hotel.emptyTitle")} description={t("settings.hotel.emptyDescription")} />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
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
    <div className="ops-meta-card">
      <dt className="ops-meta-label">
        {label}
      </dt>
      <dd className="ops-meta-value">
        {value}
      </dd>
    </div>
  );
}

function HotelActions({ deleting, isActive, onDeactivate, onEdit, onToggle, open, t }) {
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

function getErrorMessage(error, fallback) {
  return error?.response?.data?.message || error?.message || fallback;
}

export default HotelManagementPage;
