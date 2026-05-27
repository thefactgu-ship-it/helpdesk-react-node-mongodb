import { useMemo, useState } from "react";
import ThemedSelect from "../components/ThemedSelect";

function RequestUsersPage({ users }) {
  const [search, setSearch] = useState("");
  const [teamFilter, setTeamFilter] = useState("all");

  const requesters = useMemo(
    () => users.filter((user) => String(user.role || "").toLowerCase() === "user"),
    [users],
  );
  const teams = useMemo(
    () => ["all", ...new Set(requesters.map((user) => user.departmentId?.name || user.departmentName || user.team || "Support"))],
    [requesters],
  );
  const filteredRequesters = requesters.filter((user) => {
    const keyword = search.toLowerCase();
    const matchesSearch =
      user.name?.toLowerCase().includes(keyword) ||
      user.email?.toLowerCase().includes(keyword) ||
      user.team?.toLowerCase().includes(keyword) ||
      user.departmentName?.toLowerCase().includes(keyword) ||
      user.departmentId?.name?.toLowerCase().includes(keyword);
    const departmentName = user.departmentId?.name || user.departmentName || user.team || "Support";
    const matchesTeam = teamFilter === "all" || departmentName === teamFilter;

    return matchesSearch && matchesTeam;
  });

  return (
    <div className="space-y-5">
      <section className="ops-panel md:p-6">
        <p className="ops-section-label mb-2">
          System
        </p>
        <h3 className="text-2xl font-black text-slate-950 dark:text-white">
          Request Users
        </h3>
        <p className="mt-2 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
          People who submit helpdesk requests, separated from admin and staff accounts.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <SummaryCard label="Requesters" value={requesters.length} />
        <SummaryCard label="Departments" value={Math.max(teams.length - 1, 0)} />
        <SummaryCard label="Visible" value={filteredRequesters.length} />
      </section>

      <section className="ops-panel md:p-6">
        <div className="mb-5 flex min-w-0 flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search requesters..."
            className="ops-input md:w-80"
          />
          <ThemedSelect
            className="w-full min-w-0 md:w-56"
            value={teamFilter}
            onChange={setTeamFilter}
            options={teams.map((team) => ({
              value: team,
              label: team === "all" ? "All Teams" : team,
              prefix: team === "all" ? "ALL" : team.slice(0, 2).toUpperCase(),
            }))}
          />
        </div>

        <div className="grid gap-3 md:hidden">
          {filteredRequesters.map((user) => (
            <article
              key={user._id || user.id}
              className="ops-card"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h4 className="break-words text-base font-black text-slate-950 dark:text-white">
                    {user.name}
                  </h4>
                  <p className="mt-1 break-words text-sm font-semibold text-purple-700 dark:text-purple-200">
                    {user.email}
                  </p>
                </div>
                <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-bold text-purple-700 ring-1 ring-purple-100 dark:bg-purple-500/15 dark:text-purple-200 dark:ring-purple-400/20">
                  {user.role}
                </span>
              </div>

              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <MobileMeta
                  label="Department"
                  value={user.departmentId?.name || user.departmentName || user.team || "Support"}
                />
                <MobileMeta
                  label="Created"
                  value={user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "-"}
                />
              </dl>
            </article>
          ))}

          {!filteredRequesters.length && (
            <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-700">
              No requesters found
            </div>
          )}
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="min-w-[52rem] w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <th className="px-3 py-3">Requester</th>
                <th className="px-3">Email</th>
                <th className="px-3">Department</th>
                <th className="px-3">Role</th>
                <th className="px-3">Created</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequesters.map((user) => (
                <tr
                  key={user._id || user.id}
                  className="border-b border-slate-100 last:border-0 dark:border-slate-800"
                >
                  <td className="max-w-56 px-3 py-4">
                    <div className="line-clamp-2 break-words font-bold text-slate-900 dark:text-white">
                      {user.name}
                    </div>
                    <div className="break-words text-xs text-slate-500 dark:text-slate-400">
                      ID: {user._id || user.id}
                    </div>
                  </td>
                  <td className="max-w-64 break-words px-3 font-semibold text-purple-700 dark:text-purple-200">
                    {user.email}
                  </td>
                  <td className="max-w-56 break-words px-3 text-slate-600 dark:text-slate-300">
                    {user.departmentId?.name || user.departmentName || user.team || "Support"}
                  </td>
                  <td className="px-3">
                    <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-bold text-purple-700 ring-1 ring-purple-100 dark:bg-purple-500/15 dark:text-purple-200 dark:ring-purple-400/20">
                      {user.role}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-3 text-slate-500 dark:text-slate-400">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "-"}
                  </td>
                </tr>
              ))}

              {!filteredRequesters.length && (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-slate-500">
                    No requesters found
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

function SummaryCard({ label, value }) {
  return (
    <div className="ops-soft-kpi p-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <h3 className="mt-4 text-2xl font-black text-slate-900 dark:text-white">
        {value}
      </h3>
    </div>
  );
}

function MobileMeta({ label, value }) {
  return (
    <div className="rounded-lg border border-purple-100/70 bg-white/90 p-3 dark:border-purple-400/10 dark:bg-white/5">
      <dt className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
        {label}
      </dt>
      <dd className="mt-1 break-words font-semibold text-slate-800 dark:text-slate-100">
        {value}
      </dd>
    </div>
  );
}

export default RequestUsersPage;
