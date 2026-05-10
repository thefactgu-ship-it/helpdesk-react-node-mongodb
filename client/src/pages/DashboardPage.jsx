import DashboardAnalytics from "../components/DashboardAnalytics";

function DashboardPage({ darkMode, loading, tickets }) {
  if (loading && !tickets.length) {
    return (
      <div className="space-y-5">
        <section className="grid grid-cols-1 gap-3 md:grid-cols-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="h-28 animate-pulse rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950/80"
            />
          ))}
        </section>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-12">
          {["xl:col-span-3", "xl:col-span-6", "xl:col-span-3"].map(
            (className, index) => (
              <div
                key={index}
                className={`${className} h-72 animate-pulse rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950/80`}
              />
            ),
          )}
        </section>
      </div>
    );
  }

  if (!tickets.length) {
    return (
      <section className="rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-xl shadow-slate-200/70 dark:border-slate-800 dark:bg-slate-950 dark:shadow-slate-950/40">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-sm font-black text-violet-700 ring-1 ring-violet-200 dark:bg-violet-500/20 dark:text-violet-200 dark:ring-violet-400/20">
          IT
        </div>
        <h3 className="text-2xl font-black text-slate-950 dark:text-white">
          No tickets yet
        </h3>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
          Dashboard metrics will appear after helpdesk tickets are created.
        </p>
      </section>
    );
  }

  return <DashboardAnalytics darkMode={darkMode} tickets={tickets} />;
}

export default DashboardPage;
