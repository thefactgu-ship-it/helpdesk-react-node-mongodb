function StatCard({ title, value, gradient }) {
  return (
    <div className={`rounded-2xl bg-gradient-to-br ${gradient} p-5 text-white shadow-lg`}>
      <p className="text-sm opacity-90">{title}</p>

      <h3 className="mt-3 text-3xl font-bold">
        {value}
      </h3>

      <p className="mt-3 text-xs opacity-80">
        Updated from API
      </p>
    </div>
  );
}

export default StatCard;