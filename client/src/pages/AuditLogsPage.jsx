import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import ThemedSelect from "../components/ThemedSelect";
import { getAuditLogs } from "../services/auditLogService";

const limit = 25;

const actionOptions = [
  { value: "all", label: "All actions", prefix: "A" },
  { value: "ticket.created", label: "Ticket created", prefix: "TC" },
  { value: "ticket.updated", label: "Ticket updated", prefix: "TU" },
  { value: "ticket.status_changed", label: "Ticket status changed", prefix: "TS" },
  { value: "ticket.assigned", label: "Ticket assigned", prefix: "TA" },
  { value: "ticket.claimed", label: "Ticket claimed", prefix: "CL" },
  { value: "ticket.resolved", label: "Ticket resolved", prefix: "TR" },
  { value: "ticket.closed", label: "Ticket closed", prefix: "CX" },
  { value: "ticket.satisfaction_submitted", label: "Satisfaction submitted", prefix: "SS" },
  { value: "ticket.deleted", label: "Ticket deleted", prefix: "TD" },
  { value: "user.created", label: "User created", prefix: "UC" },
  { value: "user.updated", label: "User updated", prefix: "UU" },
  { value: "user.deleted", label: "User deleted", prefix: "UD" },
  { value: "department.created", label: "Department created", prefix: "DC" },
  { value: "department.updated", label: "Department updated", prefix: "DU" },
  { value: "department.deactivated", label: "Department deactivated", prefix: "DD" },
  { value: "hotel.created", label: "Hotel created", prefix: "HC" },
  { value: "hotel.updated", label: "Hotel updated", prefix: "HU" },
  { value: "asset.created", label: "Asset created", prefix: "AC" },
  { value: "asset.updated", label: "Asset updated", prefix: "AU" },
  { value: "problem_type.created", label: "Problem type created", prefix: "PC" },
  { value: "problem_type.deleted", label: "Problem type deleted", prefix: "PD" },
];

function AuditLogsPage({ hotels = [], selectedHotelId = "all", token }) {
  const [logs, setLogs] = useState([]);
  const [meta, setMeta] = useState({ page: 1, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(Boolean(token));
  const [filters, setFilters] = useState({
    action: "all",
    from: "",
    hotelId: selectedHotelId || "all",
    q: "",
    to: "",
  });

  const params = useMemo(() => {
    const next = { limit, page: meta.page };
    if (filters.action !== "all") next.action = filters.action;
    if (filters.hotelId && filters.hotelId !== "all") next.hotelId = filters.hotelId;
    if (filters.from) next.from = filters.from;
    if (filters.to) next.to = filters.to;
    if (filters.q.trim()) next.q = filters.q.trim();
    return next;
  }, [filters, meta.page]);

  useEffect(() => {
    if (!token) return undefined;

    let ignore = false;

    const loadLogs = async () => {
      await Promise.resolve();
      if (ignore) return;

      try {
        setLoading(true);
        const result = await getAuditLogs(token, params);
        if (ignore) return;
        setLogs(Array.isArray(result.data) ? result.data : []);
        setMeta(result.meta || { page: 1, total: 0, totalPages: 1 });
      } catch (error) {
        if (ignore) return;
        console.error("Failed to load audit logs", error);
        toast.error(error?.response?.data?.message || "Failed to load audit logs");
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    loadLogs();

    return () => {
      ignore = true;
    };
  }, [params, token]);

  const hotelOptions = useMemo(
    () => [
      { value: "all", label: "All hotels", prefix: "ALL" },
      ...hotels.map((hotel) => ({
        value: hotel._id || hotel.id,
        label: [hotel.code, hotel.name].filter(Boolean).join(" / ") || "Hotel",
        meta: hotel.region || "",
        prefix: String(hotel.code || hotel.name || "HT").slice(0, 2),
      })),
    ],
    [hotels],
  );

  const updateFilter = (field, value) => {
    setMeta((current) => ({ ...current, page: 1 }));
    setFilters((current) => ({ ...current, [field]: value }));
  };

  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-blue-600 dark:text-blue-300">
              Security audit
            </p>
            <h3 className="mt-2 text-2xl font-black text-slate-950 dark:text-white">
              Audit Logs
            </h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Review operational changes, account actions, and scoped system activity.
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm dark:border-slate-800 dark:bg-slate-900">
            <span className="font-black text-slate-950 dark:text-white">{meta.total || 0}</span>
            <span className="ml-2 text-slate-500 dark:text-slate-400">events found</span>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <input
            value={filters.q}
            onChange={(event) => updateFilter("q", event.target.value)}
            placeholder="Search action, role, target..."
            className="min-w-0 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
          <ThemedSelect
            value={filters.action}
            onChange={(value) => updateFilter("action", value)}
            options={actionOptions}
          />
          <ThemedSelect
            value={filters.hotelId}
            onChange={(value) => updateFilter("hotelId", value)}
            options={hotelOptions}
          />
          <input
            type="date"
            value={filters.from}
            onChange={(event) => updateFilter("from", event.target.value)}
            className="min-w-0 max-w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
          <input
            type="date"
            value={filters.to}
            onChange={(event) => updateFilter("to", event.target.value)}
            className="min-w-0 max-w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="overflow-x-auto">
          <table className="min-w-[56rem] w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-black uppercase tracking-wide text-slate-500 dark:bg-slate-900 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Actor</th>
                <th className="px-4 py-3">Hotel</th>
                <th className="px-4 py-3">Target</th>
                <th className="px-4 py-3">Path</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td className="px-4 py-10 text-center text-slate-500" colSpan={6}>
                    Loading audit logs...
                  </td>
                </tr>
              ) : logs.length ? (
                logs.map((log) => {
                  const actionMeta = getActionMeta(log.action);

                  return (
                    <tr key={log._id || `${log.action}-${log.createdAt}`} className="align-top">
                      <td className="whitespace-nowrap px-4 py-3 text-slate-500 dark:text-slate-400">
                        {formatDateTime(log.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          title={log.action}
                          className="inline-flex max-w-[14rem] items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-black text-blue-700 dark:bg-blue-500/15 dark:text-blue-200"
                        >
                          <span className="rounded-full bg-white px-1.5 py-0.5 text-[10px] leading-none text-blue-500 shadow-sm dark:bg-blue-950 dark:text-blue-200">
                            {actionMeta.prefix}
                          </span>
                          <span className="truncate">{actionMeta.label}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-bold text-slate-900 dark:text-white">
                          {log.actorId?.name || "System"}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {log.actorRole || log.actorId?.role || "-"}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                        {formatHotel(log.hotelId)}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-800 dark:text-slate-100">
                          {log.targetType || "-"}
                        </p>
                        <p className="max-w-[14rem] truncate text-xs text-slate-500 dark:text-slate-400">
                          {log.targetId || "-"}
                        </p>
                      </td>
                      <td className="max-w-[16rem] truncate px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
                        {log.method} {log.path}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td className="px-4 py-10 text-center text-slate-500" colSpan={6}>
                    No audit logs match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-3 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Page {meta.page || 1} of {meta.totalPages || 1}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={loading || (meta.page || 1) <= 1}
              onClick={() => setMeta((current) => ({ ...current, page: Math.max(1, current.page - 1) }))}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold disabled:opacity-50 dark:border-slate-700"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={loading || (meta.page || 1) >= (meta.totalPages || 1)}
              onClick={() => setMeta((current) => ({ ...current, page: current.page + 1 }))}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold disabled:opacity-50 dark:border-slate-700"
            >
              Next
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function formatDateTime(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString();
}

function formatHotel(hotel) {
  if (!hotel) return "-";
  return [hotel.code, hotel.name].filter(Boolean).join(" / ") || "Hotel";
}

function getActionMeta(action) {
  const match = actionOptions.find((option) => option.value === action);
  return match || { label: action || "-", prefix: "?" };
}

export default AuditLogsPage;
