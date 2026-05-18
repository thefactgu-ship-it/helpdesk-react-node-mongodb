import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";
import ConfirmModal from "../components/ConfirmModal";
import ThemedSelect from "../components/ThemedSelect";
import {
  createAsset,
  deleteAsset,
  getAssets,
  updateAsset,
} from "../services/assetService";

const emptyAssetForm = {
  assetName: "",
  assetType: "Workstation",
  serialNumber: "",
  owner: "",
  department: "IT",
  status: "Active",
  lifeCycle: {
    purchaseDate: "",
    expectedLifeMonths: 36,
    condition: "Good",
    notes: "",
  },
};

const assetTypes = ["Workstation", "Laptop", "Printer", "Network", "POS", "Mobile", "Other"];
const departments = ["IT", "Front Office", "F&B", "Housekeeping", "Finance", "HR", "Operations"];
const statuses = ["Active", "In Repair", "Spare", "Retired"];
const conditions = ["Good", "Monitor", "Needs Repair", "End of Life"];
const assetTypeOptions = assetTypes.map((type) => ({ value: type, label: type, prefix: type.slice(0, 2).toUpperCase() }));
const departmentOptions = departments.map((department) => ({ value: department, label: department, prefix: department.slice(0, 2).toUpperCase() }));
const statusOptions = statuses.map((status) => ({ value: status, label: status, prefix: status.slice(0, 2).toUpperCase() }));
const conditionOptions = conditions.map((condition) => ({ value: condition, label: condition, prefix: condition.slice(0, 2).toUpperCase() }));

function AssetManagementPage({ currentUser, hotelId = "all", token }) {
  const [assets, setAssets] = useState([]);
  const [form, setForm] = useState(emptyAssetForm);
  const [editForm, setEditForm] = useState(emptyAssetForm);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [deleteAssetId, setDeleteAssetId] = useState(null);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const isAdmin = ["GroupAdmin", "Admin", "HotelAdmin"].includes(currentUser?.role);
  const scopedParams = useMemo(
    () => (hotelId && hotelId !== "all" ? { hotelId } : undefined),
    [hotelId],
  );

  const fetchAssets = useCallback(async () => {
    if (!token) return;

    try {
      setLoading(true);
      const data = await getAssets(token, scopedParams);
      setAssets(data);
    } catch (error) {
      console.error("Failed to load assets", error);
      toast.error(getErrorMessage(error, "Failed to load assets"));
    } finally {
      setLoading(false);
    }
  }, [scopedParams, token]);

  useEffect(() => {

    fetchAssets();
  }, [fetchAssets]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!isAdmin) return;

    if (!form.assetName.trim() || !form.assetType.trim() || !form.serialNumber.trim()) {
      toast.error("Asset name, type, and serial number are required");
      return;
    }

    try {
      setSaving(true);
      await createAsset(token, buildPayload(form), scopedParams);
      toast.success("Asset created");
      setForm(emptyAssetForm);
      await fetchAssets();
    } catch (error) {
      console.error("Failed to create asset", error);
      toast.error(getErrorMessage(error, "Failed to create asset"));
    } finally {
      setSaving(false);
    }
  };

  const requestDelete = (id) => {
    if (!isAdmin) return;
    setDeleteAssetId(id);
  };

  const confirmDelete = async () => {
    if (!isAdmin) return;

    try {
      setDeletingId(deleteAssetId);
      await deleteAsset(token, deleteAssetId, scopedParams);
      toast.success("Asset deleted");
      setDeleteAssetId(null);
      await fetchAssets();
    } catch (error) {
      console.error("Failed to delete asset", error);
      toast.error(getErrorMessage(error, "Failed to delete asset"));
    } finally {
      setDeletingId(null);
    }
  };

  const openAssetDetail = (asset) => {
    setSelectedAsset(asset);
    setEditForm(assetToForm(asset));
  };

  const closeAssetDetail = () => {
    setSelectedAsset(null);
    setEditForm(emptyAssetForm);
  };

  const handleUpdate = async (event) => {
    event.preventDefault();
    if (!selectedAsset || !isAdmin) return;

    if (!editForm.assetName.trim() || !editForm.assetType.trim() || !editForm.serialNumber.trim()) {
      toast.error("Asset name, type, and serial number are required");
      return;
    }

    try {
      setUpdating(true);
      const assetId = selectedAsset._id || selectedAsset.id;
      const updated = await updateAsset(token, assetId, buildPayload(editForm), scopedParams);
      toast.success("Asset updated");
      await fetchAssets();
      setSelectedAsset(updated);
      setEditForm(assetToForm(updated));
    } catch (error) {
      console.error("Failed to update asset", error);
      toast.error(getErrorMessage(error, "Failed to update asset"));
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-5">
      <ConfirmModal
        open={!!deleteAssetId}
        title="Delete Asset"
        message={`Are you sure you want to delete ${
          assets.find((asset) => (asset._id || asset.id) === deleteAssetId)
            ?.assetName || "this asset"
        }? This action cannot be undone.`}
        onCancel={() => setDeleteAssetId(null)}
        onConfirm={confirmDelete}
      />

      <AssetDetailModal
        asset={selectedAsset}
        editForm={editForm}
        isAdmin={isAdmin}
        onClose={closeAssetDetail}
        onEditFormChange={setEditForm}
        onSubmit={handleUpdate}
        updating={updating}
      />

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950 md:p-6">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-violet-600 dark:text-violet-300">
          System
        </p>
        <h3 className="text-2xl font-black text-slate-950 dark:text-white">
          Asset Management
        </h3>
        <p className="mt-2 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
          Track hotel IT assets and life cycle recommendations for repair or replacement planning.
        </p>
        {!isAdmin && (
          <p className="mt-3 text-sm font-semibold text-slate-500 dark:text-slate-400">
            Read-only access. Only Admin can create, edit, or delete assets.
          </p>
        )}
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950 md:p-6 xl:col-span-5">
          <h4 className="text-lg font-black text-slate-950 dark:text-white">
            Add Asset
          </h4>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Life cycle is used to estimate whether an asset is healthy, should be monitored, repaired, or replaced.
          </p>

          <form onSubmit={handleSubmit} className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-1">
            <Field label="Asset Name">
              <input
                value={form.assetName}
                disabled={saving || !isAdmin}
                onChange={(event) => setFormValue(setForm, "assetName", event.target.value)}
                className={inputClass}
                placeholder="Front Desk PC"
              />
            </Field>

            <Field label="Asset Type">
              <ThemedSelect
                value={form.assetType}
                disabled={saving || !isAdmin}
                onChange={(value) => setFormValue(setForm, "assetType", value)}
                options={assetTypeOptions}
              />
            </Field>

            <Field label="Serial Number">
              <input
                value={form.serialNumber}
                disabled={saving || !isAdmin}
                onChange={(event) => setFormValue(setForm, "serialNumber", event.target.value)}
                className={inputClass}
                placeholder="THG-PC-001"
              />
            </Field>

            <Field label="Owner">
              <input
                value={form.owner}
                disabled={saving || !isAdmin}
                onChange={(event) => setFormValue(setForm, "owner", event.target.value)}
                className={inputClass}
                placeholder="Reception"
              />
            </Field>

            <Field label="Department">
              <ThemedSelect
                value={form.department}
                disabled={saving || !isAdmin}
                onChange={(value) => setFormValue(setForm, "department", value)}
                options={departmentOptions}
              />
            </Field>

            <Field label="Status">
              <ThemedSelect
                value={form.status}
                disabled={saving || !isAdmin}
                onChange={(value) => setFormValue(setForm, "status", value)}
                options={statusOptions}
              />
            </Field>

            <Field label="Purchase Date">
              <input
                type="date"
                value={form.lifeCycle.purchaseDate}
                disabled={saving || !isAdmin}
                onChange={(event) =>
                  setLifeCycleValue(setForm, "purchaseDate", event.target.value)
                }
                className={inputClass}
              />
            </Field>

            <Field label="Expected Life (months)">
              <input
                type="number"
                min="1"
                max="240"
                value={form.lifeCycle.expectedLifeMonths}
                disabled={saving || !isAdmin}
                onChange={(event) =>
                  setLifeCycleValue(setForm, "expectedLifeMonths", event.target.value)
                }
                className={inputClass}
              />
            </Field>

            <Field label="Condition">
              <ThemedSelect
                value={form.lifeCycle.condition}
                disabled={saving || !isAdmin}
                onChange={(value) => setLifeCycleValue(setForm, "condition", value)}
                options={conditionOptions}
              />
            </Field>

            <Field className="md:col-span-2 xl:col-span-1" label="Life Cycle Notes">
              <textarea
                rows="3"
                value={form.lifeCycle.notes}
                disabled={saving || !isAdmin}
                onChange={(event) =>
                  setLifeCycleValue(setForm, "notes", event.target.value)
                }
                className={`${inputClass} resize-y`}
                placeholder="Maintenance notes"
              />
            </Field>

            <button
              type="submit"
              disabled={saving || !isAdmin}
              className="rounded-2xl bg-violet-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-violet-200 transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-violet-500 dark:shadow-violet-950/40 dark:hover:bg-violet-400 md:col-span-2 xl:col-span-1"
            >
              {saving ? "Saving..." : "Create Asset"}
            </button>
          </form>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950 md:p-6 xl:col-span-7">
          <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h4 className="text-lg font-black text-slate-950 dark:text-white">
                Asset List
              </h4>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {loading ? "Loading assets..." : `${assets.length} assets in inventory`}
              </p>
            </div>
          </div>

          <div className="grid gap-3 md:hidden">
            {assets.map((asset) => {
              const assetId = asset._id || asset.id;

              return (
                <article
                  key={assetId}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h4 className="break-words text-base font-black text-slate-950 dark:text-white">
                        {asset.assetName}
                      </h4>
                      <p className="mt-1 break-words text-sm text-slate-500 dark:text-slate-400">
                        {asset.assetType} / {asset.department}
                      </p>
                    </div>
                    <StatusBadge status={asset.status} />
                  </div>

                  <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <MobileMeta label="Serial" value={asset.serialNumber} />
                    <MobileMeta label="Owner" value={asset.owner || "-"} />
                    <MobileMeta label="Age" value={formatAge(asset.lifeCycle?.ageMonths)} />
                    <div className="rounded-lg bg-white p-3 dark:bg-slate-950">
                      <dt className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                        Life Cycle
                      </dt>
                      <dd className="mt-1">
                        <RecommendationBadge value={asset.lifeCycle?.recommendation} />
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => openAssetDetail(asset)}
                      className="rounded-xl bg-slate-200 px-4 py-2.5 text-sm font-bold text-slate-800 transition hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                    >
                      View
                    </button>
                    {isAdmin && (
                      <button
                        type="button"
                        disabled={deletingId === assetId}
                        onClick={() => requestDelete(assetId)}
                        className="rounded-xl bg-rose-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:bg-rose-300"
                      >
                        {deletingId === assetId ? "Deleting..." : "Delete"}
                      </button>
                    )}
                  </div>
                </article>
              );
            })}

            {!loading && !assets.length && (
              <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-700">
                No assets found
              </div>
            )}
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                  <th className="py-3">Asset</th>
                  <th>Serial</th>
                  <th>Owner</th>
                  <th>Life Cycle</th>
                  <th>Status</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {assets.map((asset) => {
                  const assetId = asset._id || asset.id;

                  return (
                    <tr
                      key={assetId}
                      className="border-b border-slate-100 last:border-0 dark:border-slate-800"
                    >
                      <td className="py-4">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {asset.assetName}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {asset.assetType} / {asset.department}
                        </div>
                      </td>
                      <td className="font-semibold text-violet-700 dark:text-violet-300">
                        {asset.serialNumber}
                      </td>
                      <td className="text-slate-600 dark:text-slate-300">
                        {asset.owner || "-"}
                      </td>
                      <td>
                        <div className="space-y-1">
                          <RecommendationBadge value={asset.lifeCycle?.recommendation} />
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {formatAge(asset.lifeCycle?.ageMonths)}
                          </p>
                        </div>
                      </td>
                      <td>
                        <StatusBadge status={asset.status} />
                      </td>
                      <td className="text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openAssetDetail(asset)}
                            className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                          >
                            View
                          </button>
                          {isAdmin && (
                            <button
                              type="button"
                              disabled={deletingId === assetId}
                              onClick={() => requestDelete(assetId)}
                              className="rounded-xl bg-rose-500 px-3 py-2 text-xs font-bold text-white transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:bg-rose-300"
                            >
                              {deletingId === assetId ? "Deleting..." : "Delete"}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {!loading && !assets.length && (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-slate-500">
                      No assets found
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
  "w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-violet-500 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-violet-400";

function AssetDetailModal({
  asset,
  editForm,
  isAdmin,
  onClose,
  onEditFormChange,
  onSubmit,
  updating,
}) {
  useEffect(() => {
    if (!asset) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [asset, onClose]);

  if (!asset) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 px-3 pb-3 pt-16 backdrop-blur-sm sm:items-center sm:py-4">
      <button
        type="button"
        aria-label="Close asset details"
        className="absolute inset-0 h-full w-full cursor-default"
        onClick={onClose}
      />
      <div
        aria-labelledby="asset-detail-title"
        aria-modal="true"
        className="relative max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-t-2xl bg-white p-5 shadow-2xl dark:bg-slate-900 sm:rounded-2xl"
        role="dialog"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 id="asset-detail-title" className="text-xl font-black text-slate-950 dark:text-white">
              Asset Details
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {asset.serialNumber} / {asset.assetType} / {asset.department}
            </p>
          </div>
          <button
            type="button"
            aria-label="Close asset details"
            onClick={onClose}
            className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            Close
          </button>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
            <h3 className="mb-4 text-xs font-bold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
              Summary
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <InfoItem label="Asset Name" value={asset.assetName} />
              <InfoItem label="Serial Number" value={asset.serialNumber} />
              <InfoItem label="Owner" value={asset.owner || "-"} />
              <InfoItem label="Department" value={asset.department} />
              <InfoItem label="Status" value={asset.status} />
              <InfoItem label="Condition" value={asset.lifeCycle?.condition || "Good"} />
              <InfoItem label="Age" value={formatAge(asset.lifeCycle?.ageMonths)} />
              <InfoItem
                label="Recommendation"
                value={asset.lifeCycle?.recommendation || "Good"}
              />
            </div>
            {asset.lifeCycle?.notes && (
              <div className="mt-3 rounded-xl bg-white p-3 text-sm text-slate-600 shadow-sm dark:bg-slate-800 dark:text-slate-300">
                <p className="mb-1 text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Notes
                </p>
                {asset.lifeCycle.notes}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
            <h3 className="mb-4 text-xs font-bold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
              {isAdmin ? "Edit Asset" : "Read Only"}
            </h3>

            <form onSubmit={onSubmit} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Asset Name">
                <input
                  value={editForm.assetName}
                  disabled={!isAdmin || updating}
                  onChange={(event) =>
                    setFormValue(onEditFormChange, "assetName", event.target.value)
                  }
                  className={inputClass}
                />
              </Field>
              <Field label="Asset Type">
                <ThemedSelect
                  value={editForm.assetType}
                  disabled={!isAdmin || updating}
                  onChange={(value) => setFormValue(onEditFormChange, "assetType", value)}
                  options={assetTypeOptions}
                />
              </Field>
              <Field label="Serial Number">
                <input
                  value={editForm.serialNumber}
                  disabled={!isAdmin || updating}
                  onChange={(event) =>
                    setFormValue(onEditFormChange, "serialNumber", event.target.value)
                  }
                  className={inputClass}
                />
              </Field>
              <Field label="Owner">
                <input
                  value={editForm.owner}
                  disabled={!isAdmin || updating}
                  onChange={(event) =>
                    setFormValue(onEditFormChange, "owner", event.target.value)
                  }
                  className={inputClass}
                />
              </Field>
              <Field label="Department">
                <ThemedSelect
                  value={editForm.department}
                  disabled={!isAdmin || updating}
                  onChange={(value) => setFormValue(onEditFormChange, "department", value)}
                  options={departmentOptions}
                />
              </Field>
              <Field label="Status">
                <ThemedSelect
                  value={editForm.status}
                  disabled={!isAdmin || updating}
                  onChange={(value) => setFormValue(onEditFormChange, "status", value)}
                  options={statusOptions}
                />
              </Field>
              <Field label="Purchase Date">
                <input
                  type="date"
                  value={editForm.lifeCycle.purchaseDate}
                  disabled={!isAdmin || updating}
                  onChange={(event) =>
                    setLifeCycleValue(onEditFormChange, "purchaseDate", event.target.value)
                  }
                  className={inputClass}
                />
              </Field>
              <Field label="Expected Life">
                <input
                  type="number"
                  min="1"
                  max="240"
                  value={editForm.lifeCycle.expectedLifeMonths}
                  disabled={!isAdmin || updating}
                  onChange={(event) =>
                    setLifeCycleValue(onEditFormChange, "expectedLifeMonths", event.target.value)
                  }
                  className={inputClass}
                />
              </Field>
              <Field label="Condition">
                <ThemedSelect
                  value={editForm.lifeCycle.condition}
                  disabled={!isAdmin || updating}
                  onChange={(value) =>
                    setLifeCycleValue(onEditFormChange, "condition", value)
                  }
                  options={conditionOptions}
                />
              </Field>
              <Field className="sm:col-span-2" label="Notes">
                <textarea
                  rows="3"
                  value={editForm.lifeCycle.notes}
                  disabled={!isAdmin || updating}
                  onChange={(event) =>
                    setLifeCycleValue(onEditFormChange, "notes", event.target.value)
                  }
                  className={`${inputClass} resize-y`}
                />
              </Field>

              {isAdmin && (
                <button
                  type="submit"
                  disabled={updating}
                  className="rounded-2xl bg-violet-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-violet-200 transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-violet-500 dark:shadow-violet-950/40 dark:hover:bg-violet-400 sm:col-span-2"
                >
                  {updating ? "Saving..." : "Save Changes"}
                </button>
              )}
            </form>
          </section>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function buildPayload(form) {
  return {
    ...form,
    assetName: form.assetName.trim(),
    serialNumber: form.serialNumber.trim(),
    owner: form.owner.trim(),
    lifeCycle: {
      ...form.lifeCycle,
      expectedLifeMonths: Number(form.lifeCycle.expectedLifeMonths),
      purchaseDate: form.lifeCycle.purchaseDate || undefined,
      notes: form.lifeCycle.notes.trim(),
    },
  };
}

function assetToForm(asset) {
  return {
    assetName: asset.assetName || "",
    assetType: asset.assetType || "Workstation",
    serialNumber: asset.serialNumber || "",
    owner: asset.owner || "",
    department: asset.department || "IT",
    status: asset.status || "Active",
    lifeCycle: {
      purchaseDate: formatDateInput(asset.lifeCycle?.purchaseDate),
      expectedLifeMonths: asset.lifeCycle?.expectedLifeMonths || 36,
      condition: asset.lifeCycle?.condition || "Good",
      notes: asset.lifeCycle?.notes || "",
    },
  };
}

function formatDateInput(value) {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
}

function setFormValue(setForm, field, value) {
  setForm((current) => ({ ...current, [field]: value }));
}

function setLifeCycleValue(setForm, field, value) {
  setForm((current) => ({
    ...current,
    lifeCycle: {
      ...current.lifeCycle,
      [field]: value,
    },
  }));
}

function getErrorMessage(error, fallback) {
  return error?.response?.data?.message || error?.message || fallback;
}

function formatAge(ageMonths) {
  if (ageMonths === null || ageMonths === undefined) return "No purchase date";
  if (ageMonths < 12) return `${ageMonths} months used`;

  const years = Math.floor(ageMonths / 12);
  const months = ageMonths % 12;
  return months ? `${years}y ${months}m used` : `${years}y used`;
}

function Field({ children, className = "", label }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
        {label}
      </span>
      {children}
    </label>
  );
}

function InfoItem({ label, value }) {
  return (
    <div className="rounded-xl bg-white p-3 shadow-sm dark:bg-slate-800">
      <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
        {value}
      </p>
    </div>
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

function StatusBadge({ status }) {
  const isActive = status === "Active";

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-bold ${
        isActive
          ? "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-200"
          : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
      }`}
    >
      {status}
    </span>
  );
}

function RecommendationBadge({ value = "Good" }) {
  const isReplace = value === "Replace";
  const isRepair = value === "Repair";
  const isMonitor = value === "Monitor";

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-bold ${
        isReplace || isRepair
          ? "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-200"
          : isMonitor
            ? "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200"
            : "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-200"
      }`}
    >
      {value}
    </span>
  );
}

export default AssetManagementPage;
