import { useMemo, useState } from "react";

function RequestUsersPage({ users }) {
  const [search, setSearch] = useState("");
  const [teamFilter, setTeamFilter] = useState("all");

  const requesters = useMemo(
    () => users.filter((user) => String(user.role || "").toLowerCase() === "user"),
    [users],
  );
  const teams = useMemo(
    () => ["all", ...new Set(requesters.map((user) => user.team || "Support"))],
    [requesters],
  );
  const filteredRequesters = requesters.filter((user) => {
    const keyword = search.toLowerCase();
    const matchesSearch =
      user.name?.toLowerCase().includes(keyword) ||
      user.email?.toLowerCase().includes(keyword) ||
      user.team?.toLowerCase().includes(keyword);
    const matchesTeam = teamFilter === "all" || user.team === teamFilter;

    return matchesSearch && matchesTeam;
  });

  return (
    <div className="space-y-5">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/70 dark:border-slate-800 dark:bg-slate-950 dark:shadow-slate-950/40">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-violet-600 dark:text-violet-300">
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
        <SummaryCard label="Teams" value={Math.max(teams.length - 1, 0)} />
        <SummaryCard label="Visible" value={filteredRequesters.length} />
      </section>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/70 dark:border-slate-800 dark:bg-slate-950 dark:shadow-slate-950/40">
        <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search requesters..."
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-violet-500 focus:bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-violet-400 md:w-80"
          />
          <select
            value={teamFilter}
            onChange={(event) => setTeamFilter(event.target.value)}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-violet-500 focus:bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-violet-400"
          >
            {teams.map((team) => (
              <option key={team} value={team}>
                {team === "all" ? "All Teams" : team}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <th className="py-3">Requester</th>
                <th>Email</th>
                <th>Team</th>
                <th>Role</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequesters.map((user) => (
                <tr
                  key={user._id || user.id}
                  className="border-b border-slate-100 last:border-0 dark:border-slate-800"
                >
                  <td className="py-4">
                    <div className="font-bold text-slate-900 dark:text-white">
                      {user.name}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      ID: {user._id || user.id}
                    </div>
                  </td>
                  <td className="font-semibold text-violet-700 dark:text-violet-300">
                    {user.email}
                  </td>
                  <td className="text-slate-600 dark:text-slate-300">
                    {user.team || "Support"}
                  </td>
                  <td>
                    <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-bold text-violet-700 dark:bg-violet-500/20 dark:text-violet-200">
                      {user.role}
                    </span>
                  </td>
                  <td className="text-slate-500 dark:text-slate-400">
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
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/80">
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <h3 className="mt-4 text-2xl font-black text-slate-900 dark:text-white">
        {value}
      </h3>
    </div>
  );
}

export default RequestUsersPage;
