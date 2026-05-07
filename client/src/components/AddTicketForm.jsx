function AddTicketForm({ form, setForm, handleSubmit, submitting }) {
  return (
    <section className="mt-6 rounded-2xl bg-white p-6 shadow-lg dark:bg-slate-800">
      <h3 className="mb-4 font-bold">Add New Ticket</h3>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 gap-4 lg:grid-cols-4"
      >
        <input
          type="text"
          placeholder="Ticket title"
          value={form.title}
          disabled={submitting}
          onChange={(e) =>
            setForm({ ...form, title: e.target.value })
          }
          className="rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-purple-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900"
        />

        <input
          type="text"
          placeholder="Description"
          value={form.description}
          disabled={submitting}
          onChange={(e) =>
            setForm({
              ...form,
              description: e.target.value,
            })
          }
          className="rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-purple-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900"
        />

        <select
          value={form.priority}
          disabled={submitting}
          onChange={(e) =>
            setForm({
              ...form,
              priority: e.target.value,
            })
          }
          className="rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-purple-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900"
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>

        <button
          type="submit"
          disabled={submitting}
          className="rounded-xl bg-purple-600 px-5 py-3 font-semibold text-white shadow-lg shadow-purple-200 transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:bg-purple-400 disabled:shadow-none dark:shadow-none"
        >
          {submitting ? "Adding..." : "Add Ticket"}
        </button>
      </form>
    </section>
  );
}

export default AddTicketForm;
