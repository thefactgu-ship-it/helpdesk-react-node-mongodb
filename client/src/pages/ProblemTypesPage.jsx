import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import ConfirmModal from "../components/ConfirmModal";
import {
  createProblemType,
  deleteProblemType,
  getProblemTypes,
} from "../services/problemTypeService";

const defaultProblemTypes = [
  "Hardware",
  "Software",
  "Network",
  "Account",
  "POS",
  "Printer",
];

function ProblemTypesPage({ currentUser, token }) {
  const [problemTypes, setProblemTypes] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [deleteTypeId, setDeleteTypeId] = useState(null);
  const isAdmin = currentUser?.role === "Admin";

  const fetchProblemTypes = useCallback(async () => {
    if (!token) return;

    try {
      setLoading(true);
      const data = await getProblemTypes(token);
      setProblemTypes(data);
    } catch (error) {
      console.error("Failed to load problem types", error);
      toast.error(getErrorMessage(error, "Failed to load problem types"));
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchProblemTypes();
  }, [fetchProblemTypes]);

  const addProblemType = async (event) => {
    event.preventDefault();
    if (!isAdmin) return;

    const nextName = name.trim();
    if (!nextName) {
      toast.error("Problem type name is required");
      return;
    }

    try {
      setSaving(true);
      await createProblemType(token, {
        name: nextName,
        description: description.trim(),
      });
      toast.success("Problem type added");
      setName("");
      setDescription("");
      await fetchProblemTypes();
    } catch (error) {
      console.error("Failed to create problem type", error);
      toast.error(getErrorMessage(error, "Failed to create problem type"));
    } finally {
      setSaving(false);
    }
  };

  const requestDelete = (id) => {
    if (!isAdmin) return;
    setDeleteTypeId(id);
  };

  const confirmDelete = async () => {
    if (!isAdmin || !deleteTypeId) return;

    try {
      setDeletingId(deleteTypeId);
      await deleteProblemType(token, deleteTypeId);
      toast.success("Problem type deleted");
      setDeleteTypeId(null);
      await fetchProblemTypes();
    } catch (error) {
      console.error("Failed to delete problem type", error);
      toast.error(getErrorMessage(error, "Failed to delete problem type"));
    } finally {
      setDeletingId(null);
    }
  };

  const visibleTypes = problemTypes.length
    ? problemTypes
    : defaultProblemTypes.map((type) => ({ name: type, description: "Default category" }));
  const pendingDeleteType = problemTypes.find(
    (type) => (type._id || type.id) === deleteTypeId,
  );

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/70 dark:border-slate-800 dark:bg-slate-950 dark:shadow-slate-950/40">
      <ConfirmModal
        open={!!deleteTypeId}
        title="Delete Problem Type"
        message={`Are you sure you want to delete ${
          pendingDeleteType?.name || "this problem type"
        }? This action cannot be undone.`}
        onCancel={() => setDeleteTypeId(null)}
        onConfirm={confirmDelete}
      />

      <p className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-violet-600 dark:text-violet-300">
        System
      </p>
      <h3 className="text-2xl font-black text-slate-950 dark:text-white">
        Problem Types
      </h3>
      <p className="mt-2 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
        Maintain common helpdesk categories such as Hardware, Software, Network, Account, POS, and Printer.
      </p>
      {!isAdmin && (
        <p className="mt-3 text-sm font-semibold text-slate-500 dark:text-slate-400">
          Read-only access. Only Admin can add problem types.
        </p>
      )}

      <form onSubmit={addProblemType} className="mt-6 grid grid-cols-1 gap-3 lg:grid-cols-5">
        <input
          type="text"
          value={name}
          disabled={saving || !isAdmin}
          onChange={(event) => setName(event.target.value)}
          placeholder="Add problem type"
          className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-violet-500 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-violet-400 lg:col-span-2"
        />
        <input
          type="text"
          value={description}
          disabled={saving || !isAdmin}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Description"
          className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-violet-500 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-violet-400 lg:col-span-2"
        />
        <button
          type="submit"
          disabled={saving || !isAdmin}
          className="rounded-2xl bg-violet-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-violet-200 transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-violet-500 dark:shadow-violet-950/40 dark:hover:bg-violet-400"
        >
          {saving ? "Adding..." : "Add"}
        </button>
      </form>

      <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {visibleTypes.map((type) => {
          const typeId = type._id || type.id;
          const canDelete = isAdmin && typeId;

          return (
            <div
              key={typeId || type.name}
              className="rounded-2xl border border-violet-100 bg-violet-50/60 p-4 dark:border-violet-500/20 dark:bg-violet-500/10"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="break-words text-sm font-black text-violet-700 dark:text-violet-200">
                    {type.name}
                  </div>
                  <p className="mt-1 break-words text-xs text-slate-500 dark:text-slate-400">
                    {type.description || "No description"}
                  </p>
                </div>

                {canDelete && (
                  <button
                    type="button"
                    disabled={deletingId === typeId}
                    onClick={() => requestDelete(typeId)}
                    className="shrink-0 rounded-xl bg-rose-500 px-3 py-2 text-xs font-bold text-white transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:bg-rose-300"
                  >
                    {deletingId === typeId ? "Deleting..." : "Delete"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {loading && (
        <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
          Loading problem types...
        </p>
      )}
    </section>
  );
}

function getErrorMessage(error, fallback) {
  return error?.response?.data?.message || error?.message || fallback;
}

export default ProblemTypesPage;
