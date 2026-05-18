import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import ConfirmModal from "../components/ConfirmModal";
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
  };

  const cancelEdit = () => {
    setEditingHotelId(null);
    setForm(emptyForm);
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

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950 md:p-6 xl:col-span-5">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h4 className="text-lg font-black text-slate-950 dark:text-white">
                {isEditing ? "Edit Hotel" : "Add Hotel"}
              </h4>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Hotel code is used in selectors and reporting.
              </p>
            </div>
            {isEditing && (
              <button
                type="button"
                onClick={cancelEdit}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900"
              >
                Cancel
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
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
              className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-blue-500 dark:shadow-slate-950/30 dark:hover:bg-blue-400"
            >
              {saving ? "Saving..." : isEditing ? "Save Hotel" : "Create Hotel"}
            </button>
          </form>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950 md:p-6 xl:col-span-7">
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

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => startEdit(hotel)}
                      className="rounded-xl bg-slate-200 px-4 py-2.5 text-sm font-bold text-slate-800 transition hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                    >
                      Edit
                    </button>
                    {isActive && (
                      <button
                        type="button"
                        disabled={deletingId === hotelId}
                        onClick={() => setPendingDeleteId(hotelId)}
                        className="rounded-xl bg-rose-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:bg-rose-300"
                      >
                        {deletingId === hotelId ? "Saving..." : "Deactivate"}
                      </button>
                    )}
                  </div>
                </article>
              );
            })}

            {!hotels.length && (
              <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-700">
                No hotels found
              </div>
            )}
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                  <th className="py-3">Hotel</th>
                  <th>Region</th>
                  <th>Timezone</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
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
                      <td className="py-4">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {hotel.name}
                        </div>
                        <div className="text-xs font-semibold text-blue-700 dark:text-blue-300">
                          {hotel.code}
                        </div>
                      </td>
                      <td className="text-slate-600 dark:text-slate-300">
                        {hotel.region || "-"}
                      </td>
                      <td className="text-slate-600 dark:text-slate-300">
                        {hotel.timezone || "-"}
                      </td>
                      <td>
                        <StatusBadge active={isActive} />
                      </td>
                      <td>
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => startEdit(hotel)}
                            className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                          >
                            Edit
                          </button>
                          {isActive && (
                            <button
                              type="button"
                              disabled={deletingId === hotelId}
                              onClick={() => setPendingDeleteId(hotelId)}
                              className="rounded-xl bg-rose-500 px-3 py-2 text-xs font-bold text-white transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:bg-rose-300"
                            >
                              {deletingId === hotelId ? "Saving..." : "Deactivate"}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {!hotels.length && (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-slate-500">
                      No hotels found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
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

function getErrorMessage(error, fallback) {
  return error?.response?.data?.message || error?.message || fallback;
}

export default HotelManagementPage;
