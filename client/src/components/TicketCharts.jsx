import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";

function TicketCharts({ tickets, averageResolutionHours, overdueCount }) {
  const open = tickets.filter((t) => t.status === "open").length;
  const progress = tickets.filter((t) => t.status === "in_progress").length;
  const resolved = tickets.filter((t) => t.status === "resolved").length;
  const closed = tickets.filter((t) => t.status === "closed").length;

  const statusData = [
    { name: "Open", value: open },
    { name: "Progress", value: progress },
    { name: "Resolved", value: resolved },
    { name: "Closed", value: closed },
  ];

  const categoryCounts = tickets.reduce((acc, ticket) => {
    acc[ticket.category] = (acc[ticket.category] || 0) + 1;
    return acc;
  }, {});

  const topCategories = Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([name, count]) => ({ name, count }));

  const monthLabels = Array.from({ length: 6 }, (_, idx) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (5 - idx));
    return date.toLocaleString("default", { month: "short" });
  });

  const monthlyTrend = monthLabels.map((label, index) => {
    const targetMonth = new Date();
    targetMonth.setMonth(targetMonth.getMonth() - (5 - index));

    return {
      month: label,
      count: tickets.filter((ticket) => {
        const createdAt = new Date(ticket.createdAt);
        return (
          createdAt.getMonth() === targetMonth.getMonth() &&
          createdAt.getFullYear() === targetMonth.getFullYear()
        );
      }).length,
    };
  });

  const pieData = [
    { name: "Open", value: open, color: "#2563eb" },
    { name: "In Progress", value: progress, color: "#7c3aed" },
    { name: "Resolved", value: resolved, color: "#10b981" },
    { name: "Closed", value: closed, color: "#0ea5e9" },
  ];

  return (
    <section className="grid grid-cols-1 gap-6 xl:grid-cols-4">
      <div className="rounded-2xl bg-white p-6 shadow-lg dark:bg-slate-800 xl:col-span-2">
        <h3 className="mb-4 font-bold">Ticket Status</h3>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={statusData}>
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" radius={[8, 8, 0, 0]} fill="#7c3aed" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-lg dark:bg-slate-800">
        <h3 className="mb-4 font-bold">Status Summary</h3>

        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                innerRadius={45}
                outerRadius={70}
              >
                {pieData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-3 text-sm">
          {pieData.map((item) => (
            <div key={item.name} className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                {item.name}
              </span>
              <strong>{item.value}</strong>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-lg dark:bg-slate-800 xl:col-span-2">
        <h3 className="mb-4 font-bold">Business Insights</h3>

        <div className="grid gap-3 text-sm">
          <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
            <p className="text-slate-500">Avg. Resolution Time</p>
            <p className="mt-2 text-2xl font-semibold">{averageResolutionHours}h</p>
          </div>
          <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
            <p className="text-slate-500">Overdue Tickets</p>
            <p className="mt-2 text-2xl font-semibold">{overdueCount}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
            <p className="text-slate-500">Most Common Categories</p>
            <div className="mt-3 space-y-2">
              {topCategories.map((category) => (
                <div key={category.name} className="flex items-center justify-between">
                  <span>{category.name}</span>
                  <strong>{category.count}</strong>
                </div>
              ))}
              {!topCategories.length && <div>No categories yet</div>}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-lg dark:bg-slate-800 xl:col-span-4">
        <h3 className="mb-4 font-bold">Ticket Trend</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyTrend}>
              <XAxis dataKey="month" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#7c3aed" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}

export default TicketCharts;
