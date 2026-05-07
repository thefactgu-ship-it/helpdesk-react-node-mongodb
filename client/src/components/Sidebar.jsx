function Sidebar() {
  return (
    <aside className="hidden w-64 border-r border-purple-100 bg-white p-6 dark:border-slate-700 dark:bg-slate-950 md:block">
      <div className="mb-10 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-600 text-white">
          H
        </div>

        <h1 className="text-xl font-bold text-purple-700 dark:text-purple-300">
          HelpDesk
        </h1>
      </div>

      <nav className="space-y-2 text-sm">
        <MenuItem active text="Dashboard" />
        <MenuItem text="Tickets" />
        <MenuItem text="Reports" />
        <MenuItem text="Users" />
        <MenuItem text="Settings" />
      </nav>
    </aside>
  );
}

function MenuItem({ text, active }) {
  return (
    <div
      className={`rounded-xl px-4 py-3 font-medium transition ${
        active
          ? "bg-purple-100 text-purple-700"
          : "text-slate-500 hover:bg-purple-50 hover:text-purple-700 dark:text-slate-300 dark:hover:bg-slate-800"
      }`}
    >
      {text}
    </div>
  );
}

export default Sidebar;