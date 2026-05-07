import { useState } from "react";

const emptyForm = {
  name: "",
  email: "",
  password: "",
  role: "User",
  team: "Support",
};

const roles = ["Admin", "Manager", "Agent", "User"];
const teams = ["System", "Support", "IT", "Operations", "Finance", "HR", "Sales"];

function UserManagement({
  currentUser,
  deletingUserId,
  onCreateUser,
  onDeleteUser,
  onUpdateUser,
  savingUser,
  users,
}) {
  const [form, setForm] = useState(emptyForm);
  const [editingUserId, setEditingUserId] = useState(null);
  const isEditing = Boolean(editingUserId);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      role: form.role,
      team: form.team,
    };

    if (form.password) {
      payload.password = form.password;
    }

    const success = isEditing
      ? await onUpdateUser(editingUserId, payload)
      : await onCreateUser({ ...payload, password: form.password });

    if (success) {
      setForm(emptyForm);
      setEditingUserId(null);
    }
  };

  const startEdit = (user) => {
    setEditingUserId(user._id || user.id);
    setForm({
      name: user.name || "",
      email: user.email || "",
      password: "",
      role: user.role || "User",
      team: user.team || "Support",
    });
  };

  const cancelEdit = () => {
    setEditingUserId(null);
    setForm(emptyForm);
  };

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/70 dark:border-slate-800 dark:bg-slate-950 dark:shadow-slate-950/40">
        <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h3 className="text-xl font-black text-slate-950 dark:text-white">
              {isEditing ? "Edit User" : "Create User"}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Admins can create accounts and control access roles.
            </p>
          </div>

          {isEditing && (
            <button
              type="button"
              onClick={cancelEdit}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900"
            >
              Cancel edit
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 lg:grid-cols-6">
          <Field label="Name" className="lg:col-span-2">
            <input
              type="text"
              value={form.name}
              disabled={savingUser}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={inputClass}
              placeholder="Full name"
            />
          </Field>

          <Field label="Email" className="lg:col-span-2">
            <input
              type="email"
              value={form.email}
              disabled={savingUser}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className={inputClass}
              placeholder="name@example.com"
            />
          </Field>

          <Field label={isEditing ? "New Password" : "Password"} className="lg:col-span-2">
            <input
              type="password"
              value={form.password}
              disabled={savingUser}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className={inputClass}
              placeholder={isEditing ? "Leave blank to keep" : "Temporary password"}
            />
          </Field>

          <Field label="Role" className="lg:col-span-2">
            <select
              value={form.role}
              disabled={savingUser}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className={inputClass}
            >
              {roles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Team" className="lg:col-span-2">
            <select
              value={form.team}
              disabled={savingUser}
              onChange={(e) => setForm({ ...form, team: e.target.value })}
              className={inputClass}
            >
              {teams.map((team) => (
                <option key={team} value={team}>
                  {team}
                </option>
              ))}
            </select>
          </Field>

          <div className="flex items-end lg:col-span-2">
            <button
              type="submit"
              disabled={savingUser}
              className="w-full rounded-2xl bg-violet-600 px-5 py-3 font-black text-white shadow-lg shadow-violet-200 transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-violet-500 dark:shadow-violet-950/40 dark:hover:bg-violet-400"
            >
              {savingUser
                ? "Saving..."
                : isEditing
                  ? "Update User"
                  : "Create User"}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/70 dark:border-slate-800 dark:bg-slate-950 dark:shadow-slate-950/40">
        <div className="mb-5">
          <h3 className="text-xl font-black text-slate-950 dark:text-white">
            Users
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {users.length} accounts in this helpdesk system
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <th className="py-3">User</th>
                <th>Role</th>
                <th>Team</th>
                <th>Created</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const userId = user._id || user.id;
                const isSelf = userId === currentUser?.id || userId === currentUser?._id;

                return (
                  <tr
                    key={userId}
                    className="border-b border-slate-100 last:border-0 dark:border-slate-800"
                  >
                    <td className="py-4">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {user.name}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {user.email}
                      </div>
                    </td>
                    <td>
                      <RoleBadge role={user.role} />
                    </td>
                    <td className="text-slate-600 dark:text-slate-300">
                      {user.team}
                    </td>
                    <td className="text-slate-500 dark:text-slate-400">
                      {user.createdAt
                        ? new Date(user.createdAt).toLocaleDateString()
                        : "-"}
                    </td>
                    <td>
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(user)}
                          className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          disabled={isSelf || deletingUserId === userId}
                          onClick={() => onDeleteUser(userId)}
                          className="rounded-xl bg-rose-500 px-3 py-2 text-xs font-bold text-white transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:bg-rose-300"
                        >
                          {deletingUserId === userId ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {!users.length && (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-slate-500">
                    No users found
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

const inputClass =
  "w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-violet-500 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-violet-400";

function Field({ children, className = "", label }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
        {label}
      </span>
      {children}
    </label>
  );
}

function RoleBadge({ role }) {
  const isAdmin = role === "Admin";

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-bold ${
        isAdmin
          ? "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-200"
          : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
      }`}
    >
      {role}
    </span>
  );
}

export default UserManagement;
