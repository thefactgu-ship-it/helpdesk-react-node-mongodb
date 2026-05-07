const menuGroups = [
  {
    label: "Main",
    items: [
      { id: "dashboard", text: "Dashboard", icon: "DB", enabled: true },
      { id: "tickets", text: "Helpdesk Tickets", icon: "TK", enabled: true },
      { id: "add-ticket", text: "Add Ticket", icon: "+", enabled: true },
    ],
  },
  {
    label: "Reports",
    items: [
      { id: "monthly-report", text: "Monthly Report", icon: "MR", enabled: false },
      { id: "quarterly-report", text: "Quarterly / Yearly", icon: "Q", enabled: false },
    ],
  },
  {
    label: "System",
    adminOnly: true,
    items: [
      { id: "assets", text: "Asset Management", icon: "AM", enabled: false },
      { id: "user-management", text: "User Management", icon: "UM", enabled: true },
      { id: "request-users", text: "Request Users", icon: "RU", enabled: false },
      { id: "problem-types", text: "Problem Types", icon: "#", enabled: false },
    ],
  },
];

function getInitials(name) {
  if (!name) return "SA";

  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function Sidebar({ activePage, currentUser, onNavigate, onLogout }) {
  const userName = currentUser?.name || "Welcome";
  const userRole = currentUser?.role || "User";
  const userTeam = currentUser?.team || "Support";
  const isAdmin = currentUser?.role === "Admin";

  return (
    <aside className="flex w-full flex-col border-b border-slate-200 bg-white text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 md:min-h-[calc(100vh-3rem)] md:w-72 md:border-b-0 md:border-r">
      <div className="border-b border-slate-100 p-5 dark:border-slate-800">
        <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-600 text-sm font-bold text-white shadow-lg shadow-violet-200 dark:shadow-violet-950/40">
          IT
        </div>

        <div>
          <h1 className="text-2xl font-black leading-tight text-slate-950 dark:text-white">
            IT Helpdesk
          </h1>
          <p className="text-xs font-medium text-violet-600 dark:text-violet-300">
            Thavorn Hotels Group
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-7 px-4 py-5 text-sm">
        {menuGroups
          .filter((group) => !group.adminOnly || isAdmin)
          .map((group) => (
          <div key={group.label}>
            <p className="mb-2 px-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-600">
              {group.label}
            </p>

            <div className="space-y-1">
              {group.items.map((item) => (
                <MenuItem
                  key={item.id}
                  active={activePage === item.id}
                  enabled={item.enabled}
                  icon={item.icon}
                  text={item.text}
                  onClick={() => item.enabled && onNavigate(item.id)}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-slate-100 p-4 dark:border-slate-800">
        <div className="mb-3 flex items-center gap-3 rounded-2xl bg-slate-100 p-3 dark:bg-slate-900">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-600 text-xs font-bold text-white">
            {getInitials(userName)}
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-950 dark:text-white">
              {userName}
            </p>
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">
              {userRole}
              {userTeam ? ` / ${userTeam}` : ""}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="w-full rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-bold text-rose-600 transition hover:border-rose-300 hover:bg-rose-100 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-200 dark:hover:bg-rose-500/20"
        >
          Logout
        </button>
      </div>
    </aside>
  );
}

function MenuItem({ text, icon, active, enabled, onClick }) {
  return (
    <button
      type="button"
      disabled={!enabled}
      onClick={onClick}
      className={`relative flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-semibold transition ${
        active
          ? "bg-violet-600 text-white shadow-lg shadow-violet-200 dark:bg-violet-500 dark:shadow-violet-950/40"
          : enabled
            ? "text-slate-600 hover:bg-violet-50 hover:text-violet-700 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-violet-200"
            : "cursor-not-allowed text-slate-300 dark:text-slate-700"
      }`}
    >
      {active && (
        <span className="absolute -left-4 top-2 h-[calc(100%-1rem)] w-1 rounded-r bg-violet-600 dark:bg-violet-300" />
      )}
      <span
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-xl text-[10px] font-black ${
          active
            ? "bg-white/20 text-white"
            : "bg-slate-100 text-slate-500 dark:bg-slate-900 dark:text-slate-500"
        }`}
      >
        {icon}
      </span>
      {text}
    </button>
  );
}

export default Sidebar;
