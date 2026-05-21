import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import ActionMenu from "../components/ActionMenu";
import ConfirmModal from "../components/ConfirmModal";
import Drawer from "../components/Drawer";
import ThemedSelect from "../components/ThemedSelect";
import { canManageHotelSettings } from "../config/rolePolicy";
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

function AssetManagementPage({ currentUser, hotelId = "all", t = (key) => key, token }) {
  const [assets, setAssets] = useState([]);
  const [form, setForm] = useState(emptyAssetForm);
  const [editForm, setEditForm] = useState(emptyAssetForm);
  const [loading, setLoading] = useState(Boolean(token));
  const [saving, setSaving] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [deleteAssetId, setDeleteAssetId] = useState(null);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [formDrawerOpen, setFormDrawerOpen] = useState(false);
  const [openActionAssetId, setOpenActionAssetId] = useState(null);
  const isAdmin = canManageHotelSettings(currentUser?.role);
  const scopedParams = useMemo(
    () => (hotelId && hotelId !== "all" ? { hotelId } : undefined),
    [hotelId],
  );

  const fetchAssets = useCallback(async () => {
    if (!token) return;

    try {
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
    if (!token) return undefined;

    let ignore = false;

    const loadAssets = async () => {
      try {
        const data = await getAssets(token, scopedParams);
        if (!ignore) setAssets(data);
      } catch (error) {
        console.error("Failed to load assets", error);
        toast.error(getErrorMessage(error, "Failed to load assets"));
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    loadAssets();

    return () => {
      ignore = true;
    };
  }, [scopedParams, token]);

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
      setFormDrawerOpen(false);
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
    setOpenActionAssetId(null);
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

  const openCreateDrawer = () => {
    setForm(emptyAssetForm);
    setFormDrawerOpen(true);
  };

  const closeCreateDrawer = () => {
    setForm(emptyAssetForm);
    setFormDrawerOpen(false);
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
        t={t}
        updating={updating}
      />

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950 md:p-6">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-blue-600 dark:text-blue-300">
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

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950 md:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h4 className="text-lg font-black text-slate-950 dark:text-white">
              {t("settings.asset.setupTitle")}
            </h4>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {t("settings.asset.setupDescription")}
            </p>
          </div>
          <button
            type="button"
            onClick={openCreateDrawer}
            disabled={!isAdmin}
            className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t("settings.asset.add")}
          </button>
        </div>
      </section>

      <Drawer
        eyebrow={t("settings.eyebrow")}
        onClose={closeCreateDrawer}
        open={formDrawerOpen}
        subtitle={t("settings.asset.drawerHint")}
        title={t("settings.asset.add")}
        widthClass="max-w-3xl"
      >
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label={t("settings.asset.name")}>
              <input
                value={form.assetName}
                disabled={saving || !isAdmin}
                onChange={(event) => setFormValue(setForm, "assetName", event.target.value)}
                className={inputClass}
                placeholder="Front Desk PC"
              />
            </Field>

            <Field label={t("settings.asset.type")}>
              <ThemedSelect
                value={form.assetType}
                disabled={saving || !isAdmin}
                onChange={(value) => setFormValue(setForm, "assetType", value)}
                options={assetTypeOptions}
              />
            </Field>

            <Field label={t("settings.asset.serial")}>
              <input
                value={form.serialNumber}
                disabled={saving || !isAdmin}
                onChange={(event) => setFormValue(setForm, "serialNumber", event.target.value)}
                className={inputClass}
                placeholder="THG-PC-001"
              />
            </Field>

            <Field label={t("settings.asset.owner")}>
              <input
                value={form.owner}
                disabled={saving || !isAdmin}
                onChange={(event) => setFormValue(setForm, "owner", event.target.value)}
                className={inputClass}
                placeholder="Reception"
              />
            </Field>

            <Field label={t("settings.asset.department")}>
              <ThemedSelect
                value={form.department}
                disabled={saving || !isAdmin}
                onChange={(value) => setFormValue(setForm, "department", value)}
                options={departmentOptions}
              />
            </Field>

            <Field label={t("settings.asset.status")}>
              <ThemedSelect
                value={form.status}
                disabled={saving || !isAdmin}
                onChange={(value) => setFormValue(setForm, "status", value)}
                options={statusOptions}
              />
            </Field>

            <Field label={t("settings.asset.purchaseDate")}>
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

            <Field label={t("settings.asset.expectedLifeMonths")}>
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

            <Field label={t("settings.asset.condition")}>
              <ThemedSelect
                value={form.lifeCycle.condition}
                disabled={saving || !isAdmin}
                onChange={(value) => setLifeCycleValue(setForm, "condition", value)}
                options={conditionOptions}
              />
            </Field>

            <Field className="md:col-span-2" label={t("settings.asset.notes")}>
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
              className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-blue-500 dark:shadow-slate-950/30 dark:hover:bg-blue-400 md:col-span-2"
            >
              {saving ? t("settings.actions.saving") : t("settings.asset.create")}
            </button>
          </form>
      </Drawer>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950 md:p-6">
          <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h4 className="text-lg font-black text-slate-950 dark:text-white">
                {t("settings.asset.listTitle")}
              </h4>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {loading ? t("settings.asset.loading") : t("settings.asset.inventorySummary", { count: assets.length })}
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
                    <MobileMeta label={t("settings.asset.serial")} value={asset.serialNumber} />
                    <MobileMeta label={t("settings.asset.owner")} value={asset.owner || "-"} />
                    <MobileMeta label={t("settings.asset.age")} value={formatAge(asset.lifeCycle?.ageMonths, t)} />
                    <div className="rounded-lg bg-white p-3 dark:bg-slate-950">
                      <dt className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                        {t("settings.asset.lifecycle")}
                      </dt>
                      <dd className="mt-1">
                        <RecommendationBadge value={asset.lifeCycle?.recommendation} />
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {asset.owner || t("settings.asset.noOwner")}
                    </p>
                    <div className="relative" onClick={(event) => event.stopPropagation()}>
                      <AssetActions
                        deleting={deletingId === assetId}
                        isAdmin={isAdmin}
                        onDelete={() => requestDelete(assetId)}
                        onView={() => openAssetDetail(asset)}
                        open={openActionAssetId === assetId}
                        onToggle={() =>
                          setOpenActionAssetId(openActionAssetId === assetId ? null : assetId)
                        }
                        t={t}
                      />
                    </div>
                  </div>
                </article>
              );
            })}

            {!loading && !assets.length && (
              <SystemEmptyState title={t("settings.asset.emptyTitle")} description={t("settings.asset.emptyDescription")} />
            )}
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="min-w-[58rem] w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                  <th className="px-3 py-3">Asset</th>
                  <th className="px-3">Serial</th>
                  <th className="px-3">Owner</th>
                  <th className="px-3">{t("settings.asset.lifecycle")}</th>
                  <th className="px-3">Status</th>
                  <th className="px-3 text-right">Action</th>
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
                      <td className="max-w-64 px-3 py-4">
                        <div className="line-clamp-2 break-words font-bold text-slate-900 dark:text-white">
                          {asset.assetName}
                        </div>
                        <div className="break-words text-xs text-slate-500 dark:text-slate-400">
                          {asset.assetType} / {asset.department}
                        </div>
                      </td>
                      <td className="max-w-44 break-words px-3 font-semibold text-blue-700 dark:text-blue-300">
                        {asset.serialNumber}
                      </td>
                      <td className="max-w-44 break-words px-3 text-slate-600 dark:text-slate-300">
                        {asset.owner || "-"}
                      </td>
                      <td className="px-3">
                        <div className="space-y-1">
                          <RecommendationBadge value={asset.lifeCycle?.recommendation} />
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {formatAge(asset.lifeCycle?.ageMonths, t)}
                          </p>
                        </div>
                      </td>
                      <td className="px-3">
                        <StatusBadge status={asset.status} />
                      </td>
                      <td className="px-3 text-right">
                        <div className="flex justify-end gap-2">
                          <div className="relative">
                            <AssetActions
                              deleting={deletingId === assetId}
                              isAdmin={isAdmin}
                              onDelete={() => requestDelete(assetId)}
                              onView={() => openAssetDetail(asset)}
                              open={openActionAssetId === assetId}
                              onToggle={() =>
                                setOpenActionAssetId(openActionAssetId === assetId ? null : assetId)
                              }
                              t={t}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {!loading && !assets.length && (
                  <tr>
                    <td colSpan="6" className="py-8">
                      <SystemEmptyState title={t("settings.asset.emptyTitle")} description={t("settings.asset.emptyDescription")} />
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
const dateInputClass = `${inputClass} min-w-0 max-w-full appearance-none`;

function AssetDetailModal({
  asset,
  editForm,
  isAdmin,
  onClose,
  onEditFormChange,
  onSubmit,
  t,
  updating,
}) {
  if (!asset) return null;

  return (
    <Drawer
      eyebrow={t("settings.asset.details")}
      onClose={onClose}
      open={Boolean(asset)}
      subtitle={`${asset.serialNumber} / ${asset.assetType} / ${asset.department}`}
      title={asset.assetName}
      widthClass="max-w-4xl"
    >
        <div className="grid gap-4 lg:grid-cols-2">
          <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
            <h3 className="mb-4 text-xs font-bold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
              Summary
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <InfoItem label={t("settings.asset.name")} value={asset.assetName} />
              <InfoItem label={t("settings.asset.serial")} value={asset.serialNumber} />
              <InfoItem label={t("settings.asset.owner")} value={asset.owner || "-"} />
              <InfoItem label={t("settings.asset.department")} value={asset.department} />
              <InfoItem label={t("settings.asset.status")} value={asset.status} />
              <InfoItem label={t("settings.asset.condition")} value={asset.lifeCycle?.condition || "Good"} />
              <InfoItem label={t("settings.asset.age")} value={formatAge(asset.lifeCycle?.ageMonths, t)} />
              <InfoItem
                label={t("settings.asset.recommendation")}
                value={asset.lifeCycle?.recommendation || "Good"}
              />
            </div>
            {asset.lifeCycle?.notes && (
              <div className="mt-3 rounded-xl bg-white p-3 text-sm text-slate-600 shadow-sm dark:bg-slate-800 dark:text-slate-300">
                <p className="mb-1 text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  {t("settings.asset.notes")}
                </p>
                {asset.lifeCycle.notes}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
            <h3 className="mb-4 text-xs font-bold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
              {isAdmin ? t("settings.asset.edit") : t("settings.asset.readOnly")}
            </h3>

            <form onSubmit={onSubmit} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label={t("settings.asset.name")}>
                <input
                  value={editForm.assetName}
                  disabled={!isAdmin || updating}
                  onChange={(event) =>
                    setFormValue(onEditFormChange, "assetName", event.target.value)
                  }
                className={dateInputClass}
                />
              </Field>
              <Field label={t("settings.asset.type")}>
                <ThemedSelect
                  value={editForm.assetType}
                  disabled={!isAdmin || updating}
                  onChange={(value) => setFormValue(onEditFormChange, "assetType", value)}
                  options={assetTypeOptions}
                />
              </Field>
              <Field label={t("settings.asset.serial")}>
                <input
                  value={editForm.serialNumber}
                  disabled={!isAdmin || updating}
                  onChange={(event) =>
                    setFormValue(onEditFormChange, "serialNumber", event.target.value)
                  }
                  className={dateInputClass}
                />
              </Field>
              <Field label={t("settings.asset.owner")}>
                <input
                  value={editForm.owner}
                  disabled={!isAdmin || updating}
                  onChange={(event) =>
                    setFormValue(onEditFormChange, "owner", event.target.value)
                  }
                  className={inputClass}
                />
              </Field>
              <Field label={t("settings.asset.department")}>
                <ThemedSelect
                  value={editForm.department}
                  disabled={!isAdmin || updating}
                  onChange={(value) => setFormValue(onEditFormChange, "department", value)}
                  options={departmentOptions}
                />
              </Field>
              <Field label={t("settings.asset.status")}>
                <ThemedSelect
                  value={editForm.status}
                  disabled={!isAdmin || updating}
                  onChange={(value) => setFormValue(onEditFormChange, "status", value)}
                  options={statusOptions}
                />
              </Field>
              <Field label={t("settings.asset.purchaseDate")}>
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
              <Field label={t("settings.asset.expectedLife")}>
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
              <Field label={t("settings.asset.condition")}>
                <ThemedSelect
                  value={editForm.lifeCycle.condition}
                  disabled={!isAdmin || updating}
                  onChange={(value) =>
                    setLifeCycleValue(onEditFormChange, "condition", value)
                  }
                  options={conditionOptions}
                />
              </Field>
              <Field className="sm:col-span-2" label={t("settings.asset.notes")}>
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
                  className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-blue-500 dark:shadow-slate-950/30 dark:hover:bg-blue-400 sm:col-span-2"
                >
                  {updating ? t("settings.actions.saving") : t("settings.asset.saveChanges")}
                </button>
              )}
            </form>
          </section>
        </div>
    </Drawer>
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

function formatAge(ageMonths, t = (key) => key) {
  if (ageMonths === null || ageMonths === undefined) return t("settings.asset.noPurchaseDate");
  if (ageMonths < 12) return t("settings.asset.monthsUsed", { months: ageMonths });

  const years = Math.floor(ageMonths / 12);
  const months = ageMonths % 12;
  return months
    ? t("settings.asset.yearsMonthsUsed", { years, months })
    : t("settings.asset.yearsUsed", { years });
}

function Field({ children, className = "", label }) {
  return (
    <label className={`block min-w-0 ${className}`}>
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

function AssetActions({ deleting, isAdmin, onDelete, onToggle, onView, open, t }) {
  return (
    <ActionMenu
      open={open}
      onToggle={onToggle}
      actions={[
        { label: t("settings.actions.viewEdit"), onClick: onView },
        isAdmin && {
          label: deleting ? t("settings.actions.deleting") : t("settings.actions.delete"),
          danger: true,
          disabled: deleting,
          onClick: onDelete,
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

function StatusBadge({ status }) {
  const isActive = status === "Active";

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-bold ${
        isActive
          ? "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-200"
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
            : "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-200"
      }`}
    >
      {value}
    </span>
  );
}

export default AssetManagementPage;
