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

function HotelManagementPage({ hotels = [], onHotelsChange, token }) {
  const [form, setForm] = useState(emptyForm);
  const [editingHotelId, setEditingHotelId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const [formDrawerOpen, setFormDrawerOpen] = useState(false);
  const [openActionHotelId, setOpenActionHotelId] = useState(null);
  const isEditing = Boolean(editingHotelId);
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
        confirmLabel="Deactivate"
        open={!!pendingDeleteId}
        title="Deactivate Hotel"
        message={`Deactivate ${
          pendingDeleteHotel?.name || "this hotel"
        }? Existing records stay safe, but users should stop selecting it for new work.`}
        onCancel={() => setPendingDeleteId(null)}
        onConfirm={confirmDeactivate}
      />

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950 md:p-6">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-blue-600 dark:text-blue-300">
          Group
        </p>
        <h3 className="text-2xl font-black text-slate-950 dark:text-white">
          Hotel Management
        </h3>
        <p className="mt-2 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
          Add hotels for tenant-scoped helpdesk data, reports, assets, and user access.
        </p>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950 md:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h4 className="text-lg font-black text-slate-950 dark:text-white">
              Hotel setup
            </h4>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Add or update hotel records from a focused drawer.
            </p>
          </div>
          <button
            type="button"
            onClick={openCreateDrawer}
            className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-blue-700"
          >
            Add Hotel
          </button>
        </div>
      </section>

      <Drawer
        eyebrow="System setup"
        onClose={cancelEdit}
        open={formDrawerOpen}
        subtitle="Hotel code is used in selectors and reporting."
        title={isEditing ? "Edit Hotel" : "Add Hotel"}
        widthClass="max-w-2xl"
      >
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Hotel Name">
              <input
                value={form.name}
                disabled={saving}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                className={inputClass}
                placeholder="Thavorn Beach Village"
              />
            </Field>

            <Field label="Code">
              <input
                value={form.code}
                disabled={saving || isEditing}
                onChange={(event) => setForm({ ...form, code: event.target.value })}
                className={inputClass}
                placeholder="TBV"
              />
            </Field>

            <Field label="Region">
              <input
                value={form.region}
                disabled={saving}
                onChange={(event) => setForm({ ...form, region: event.target.value })}
                className={inputClass}
                placeholder="Phuket"
              />
            </Field>

            <Field label="Timezone">
              <input
                value={form.timezone}
                disabled={saving}
                onChange={(event) => setForm({ ...form, timezone: event.target.value })}
                className={inputClass}
                placeholder="Asia/Bangkok"
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
              Active hotel
            </label>

            <button
              type="submit"
              disabled={saving}
              className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-blue-500 dark:shadow-slate-950/30 dark:hover:bg-blue-400 sm:col-span-2"
            >
              {saving ? "Saving..." : isEditing ? "Save Hotel" : "Create Hotel"}
            </button>
          </form>
      </Drawer>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950 md:p-6">
          <div className="mb-5">
            <h4 className="text-lg font-black text-slate-950 dark:text-white">
              Hotels
            </h4>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {activeHotels.length} active hotels
              {inactiveHotels.length ? ` / ${inactiveHotels.length} inactive` : ""}
            </p>
          </div>

          <div className="grid gap-3 md:hidden">
            {hotels.map((hotel) => {
              const hotelId = hotel._id || hotel.id;
              const isActive = hotel.active !== false;

              return (
                <article
                  key={hotelId}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h4 className="break-words text-base font-black text-slate-950 dark:text-white">
                        {hotel.name}
                      </h4>
                      <p className="mt-1 text-sm font-bold text-blue-700 dark:text-blue-300">
                        {hotel.code}
                      </p>
                    </div>
                    <StatusBadge active={isActive} />
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
                      />
                    </div>
                  </div>
                </article>
              );
            })}

            {!hotels.length && (
              <SystemEmptyState title="No hotels found" description="Add the first hotel to enable scoped helpdesk data, users, reports, and assets." />
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
                        <div className="break-words text-xs font-semibold text-blue-700 dark:text-blue-300">
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
                        <StatusBadge active={isActive} />
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
                      <SystemEmptyState title="No hotels found" description="Add the first hotel to enable scoped helpdesk data, users, reports, and assets." />
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

function HotelActions({ deleting, isActive, onDeactivate, onEdit, onToggle, open }) {
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

function getErrorMessage(error, fallback) {
  return error?.response?.data?.message || error?.message || fallback;
}

export default HotelManagementPage;
