import { useMemo, useState } from "react";
import ThemedSelect from "./ThemedSelect";

const emptyForm = {
  name: "",
  email: "",
  password: "",
  role: "User",
  team: "Support",
  departmentId: "",
  hotelId: "",
  hotelAccess: [],
};

const activeRoles = ["GroupAdmin", "HotelAdmin", "Manager", "Agent", "User"];
const legacyRoles = new Set(["Admin", "RegionalManager"]);
const staffRoles = new Set(["GroupAdmin", "RegionalManager", "HotelAdmin", "Admin", "Manager", "Agent"]);
const multiHotelRoles = new Set(["GroupAdmin", "Admin", "RegionalManager", "HotelAdmin", "Manager"]);

function UserManagement({
  currentUser,
  departments = [],
  deletingUserId,
  onCreateUser,
  onDeleteUser,
  onUpdateUser,
  savingUser,
  users,
  hotels = [],
  selectedHotelId = "all",
}) {
  const [form, setForm] = useState(getEmptyUserForm(selectedHotelId));
  const [editingUserId, setEditingUserId] = useState(null);
  const [accountView, setAccountView] = useState("staff");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [hotelFilter, setHotelFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [setupFilter, setSetupFilter] = useState("all");
  const isEditing = Boolean(editingUserId);
  const isGroupAdmin = currentUser?.role === "GroupAdmin";
  const activeDepartments = departments.filter((department) => {
    if (department.active === false) return false;
    const departmentHotelId = department.hotelId?._id || department.hotelId || "";
    const formHotelId = form.hotelId || (selectedHotelId === "all" ? "" : selectedHotelId);
    return !formHotelId || String(departmentHotelId) === String(formHotelId);
  });
  const baseVisibleUsers = users.filter((user) =>
    accountView === "staff" ? staffRoles.has(user.role) : user.role === "User",
  );
  const accountStats = useMemo(
    () => buildAccountStats(users),
    [users],
  );
  const filteredUsers = useMemo(
    () =>
      baseVisibleUsers.filter((user) =>
        matchesUserFilters(user, {
          departmentFilter,
          hotelFilter,
          roleFilter,
          search,
          setupFilter,
        }),
      ),
    [baseVisibleUsers, departmentFilter, hotelFilter, roleFilter, search, setupFilter],
  );
  const roleOptions = useMemo(
    () => buildRoleFilterOptions(baseVisibleUsers),
    [baseVisibleUsers],
  );
  const departmentOptions = useMemo(
    () => buildDepartmentFilterOptions(baseVisibleUsers, departments),
    [baseVisibleUsers, departments],
  );
  const hotelOptions = useMemo(
    () => buildHotelFilterOptions(hotels),
    [hotels],
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    const normalizedHotelAccess = normalizeHotelAccess(
      form.hotelId,
      form.hotelAccess,
      form.role,
    );

    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      role: form.role,
      team: form.team,
      departmentId: form.departmentId || undefined,
      hotelId: form.hotelId || undefined,
      hotelAccess: normalizedHotelAccess,
    };

    if (form.password) {
      payload.password = form.password;
    }

    const success = isEditing
      ? await onUpdateUser(editingUserId, payload)
      : await onCreateUser({ ...payload, password: form.password });

    if (success) {
      setForm(getEmptyUserForm(selectedHotelId));
      setEditingUserId(null);
    }
  };

  const startEdit = (user) => {
    const primaryHotelId = getEntityId(user.hotelId);
    setEditingUserId(user._id || user.id);
    setForm({
      name: user.name || "",
      email: user.email || "",
      password: "",
      role: user.role || "User",
      team: user.team || "Support",
      departmentId: user.departmentId?._id || user.departmentId || "",
      hotelId: primaryHotelId,
      hotelAccess: normalizeHotelAccess(primaryHotelId, getHotelAccessIds(user), user.role || "User"),
    });
  };

  const cancelEdit = () => {
    setEditingUserId(null);
    setForm(getEmptyUserForm(selectedHotelId));
  };
  const handleAccountViewChange = (view) => {
    setAccountView(view);
    setRoleFilter("all");
    setDepartmentFilter("all");
    setSetupFilter("all");
  };

  return (
    <div className="space-y-6">
      {isGroupAdmin && (
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950 md:p-6">
          <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-600 dark:text-blue-300">
                Access control
              </p>
              <h3 className="mt-1 text-xl font-black text-slate-950 dark:text-white">
                Multi-hotel account control
              </h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Review staff, requesters, hotel access, and accounts that need setup attention.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            <AccountStat label="Staff" value={accountStats.staff} />
            <AccountStat label="Requesters" value={accountStats.requesters} />
            <AccountStat label="Multi-hotel" value={accountStats.multiHotel} />
            <AccountStat label="Needs review" tone="warning" value={accountStats.needsReview} />
            <AccountStat label="Legacy roles" tone="warning" value={accountStats.legacy} />
          </div>
        </section>
      )}

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950 md:p-6">
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
            <ThemedSelect
              value={form.role}
              disabled={savingUser}
              onChange={(value) =>
                setForm({
                  ...form,
                  role: value,
                  hotelAccess: normalizeHotelAccess(form.hotelId, form.hotelAccess, value),
                })
              }
              options={getRoleOptions(form.role)}
            />
            <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
              Manager and HotelAdmin can be given access to more than one hotel. Admin and RegionalManager are legacy roles and are hidden for new users.
            </p>
          </Field>

          <Field label="Team" className="lg:col-span-2">
            <input
              type="text"
              value={form.team}
              disabled={savingUser}
              onChange={(e) => setForm({ ...form, team: e.target.value })}
              className={inputClass}
              placeholder="Support"
            />
          </Field>

          <Field label="Department" className="lg:col-span-2">
            <ThemedSelect
              value={form.departmentId}
              disabled={savingUser}
              onChange={(value) => {
                const department = activeDepartments.find(
                  (item) => (item._id || item.id) === value,
                );
                setForm({
                  ...form,
                  departmentId: value,
                  team: department?.name || form.team,
                  hotelId: department?.hotelId?._id || department?.hotelId || form.hotelId,
                  hotelAccess: normalizeHotelAccess(
                    department?.hotelId?._id || department?.hotelId || form.hotelId,
                    form.hotelAccess,
                    form.role,
                  ),
                });
              }}
              options={[
                { value: "", label: "No department", prefix: "-" },
                ...activeDepartments.map((department) => ({
                  value: department._id || department.id,
                  label: department.name,
                  meta: department.code,
                  prefix: department.code || department.name.slice(0, 2).toUpperCase(),
                })),
              ]}
            />
          </Field>

          <Field label="Hotel" className="lg:col-span-2">
            <ThemedSelect
              value={form.hotelId}
              disabled={savingUser}
              onChange={(value) =>
                setForm({
                  ...form,
                  hotelId: value,
                  departmentId: "",
                  hotelAccess: normalizeHotelAccess(value, form.hotelAccess, form.role),
                })
              }
              options={[
                { value: "", label: "Default hotel", prefix: "-" },
                ...hotels.map((hotel) => ({
                  value: hotel._id || hotel.id,
                  label: `${hotel.code} / ${hotel.name}`,
                  meta: hotel.region || "Hotel",
                  prefix: String(hotel.code || "HT").slice(0, 2),
                })),
              ]}
            />
          </Field>

          {canUseMultiHotelAccess(form.role) && (
            <div className="lg:col-span-4">
              <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                Hotel Access
              </span>
              <div className="grid max-h-48 gap-2 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900 sm:grid-cols-2">
                {hotels.map((hotel) => {
                  const hotelId = getEntityId(hotel);
                  const selected = normalizeHotelAccess(
                    form.hotelId,
                    form.hotelAccess,
                    form.role,
                  ).includes(hotelId);
                  const isPrimary = hotelId && hotelId === form.hotelId;

                  return (
                    <label
                      key={hotelId}
                      className={`flex min-w-0 items-center gap-3 rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                        selected
                          ? "border-blue-200 bg-white text-blue-700 shadow-sm dark:border-blue-500/40 dark:bg-slate-950 dark:text-blue-200"
                          : "border-transparent bg-transparent text-slate-600 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-950"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        disabled={savingUser || isPrimary}
                        onChange={(event) => {
                          const nextAccess = event.target.checked
                            ? [...form.hotelAccess, hotelId]
                            : form.hotelAccess.filter((id) => String(id) !== hotelId);
                          setForm({
                            ...form,
                            hotelAccess: normalizeHotelAccess(form.hotelId, nextAccess, form.role),
                          });
                        }}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 disabled:opacity-60"
                      />
                      <span className="min-w-0 flex-1 truncate">
                        {getHotelLabel(hotel)}
                      </span>
                      {isPrimary && (
                        <span className="shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-blue-700 dark:bg-blue-500/20 dark:text-blue-200">
                          Primary
                        </span>
                      )}
                    </label>
                  );
                })}
                {!hotels.length && (
                  <div className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500 dark:border-slate-700">
                    No hotels available
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex items-end lg:col-span-2">
            <button
              type="submit"
              disabled={savingUser}
              className="w-full rounded-2xl bg-blue-600 px-5 py-3 font-black text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-blue-500 dark:shadow-slate-950/30 dark:hover:bg-blue-400"
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

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950 md:p-6">
        <div className="mb-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-xl font-black text-slate-950 dark:text-white">
                {accountView === "staff" ? "Staff Users" : "Requester Users"}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {filteredUsers.length} visible accounts in this view
              </p>
            </div>
            <div className="grid grid-cols-2 rounded-2xl border border-slate-200 bg-slate-50 p-1 text-sm font-bold dark:border-slate-800 dark:bg-slate-900">
              <button
                type="button"
                onClick={() => handleAccountViewChange("staff")}
                className={`rounded-xl px-4 py-2 transition ${
                  accountView === "staff"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-600 hover:text-blue-700 dark:text-slate-300"
                }`}
              >
                Staff
              </button>
              <button
                type="button"
                onClick={() => handleAccountViewChange("requester")}
                className={`rounded-xl px-4 py-2 transition ${
                  accountView === "requester"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-600 hover:text-blue-700 dark:text-slate-300"
                }`}
              >
                Requesters
              </button>
            </div>
          </div>
        </div>

        {isGroupAdmin && (
          <div className="mb-5 grid gap-3 lg:grid-cols-5">
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, email, team..."
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 lg:col-span-2"
            />
            <ThemedSelect
              size="sm"
              value={roleFilter}
              onChange={setRoleFilter}
              options={roleOptions}
            />
            <ThemedSelect
              size="sm"
              value={hotelFilter}
              onChange={setHotelFilter}
              options={hotelOptions}
            />
            <ThemedSelect
              size="sm"
              value={setupFilter}
              onChange={setSetupFilter}
              options={[
                { value: "all", label: "All setup states", prefix: "A" },
                { value: "needs-review", label: "Needs review", prefix: "!" },
                { value: "ready", label: "Ready", prefix: "R" },
                { value: "legacy", label: "Legacy roles", prefix: "L" },
              ]}
            />
            <div className="lg:col-span-2">
              <ThemedSelect
                size="sm"
                value={departmentFilter}
                onChange={setDepartmentFilter}
                options={departmentOptions}
              />
            </div>
          </div>
        )}

        <div className="grid gap-3 md:hidden">
          {filteredUsers.map((user) => {
            const userId = user._id || user.id;
            const isSelf = userId === currentUser?.id || userId === currentUser?._id;
            const setupIssues = getUserSetupIssues(user);

            return (
              <article
                key={userId}
                className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h4 className="break-words text-base font-black text-slate-950 dark:text-white">
                      {user.name}
                    </h4>
                    <p className="mt-1 break-words text-sm text-slate-500 dark:text-slate-400">
                      {user.email}
                    </p>
                  </div>
                  <RoleBadge role={user.role} />
                </div>

                <SetupBadges issues={setupIssues} />

                <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <MobileMeta label="Team" value={user.departmentId?.name || user.departmentName || user.team || "-"} />
                  <MobileMeta label="Primary Hotel" value={getHotelLabel(user.hotelId) || "-"} />
                  <MobileMeta label="Access" value={getAccessSummary(user, hotels)} />
                  <MobileMeta
                    label="Created"
                    value={user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "-"}
                  />
                  <MobileMeta label="Account" value={isSelf ? "Current user" : "Managed"} />
                </dl>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => startEdit(user)}
                    className="rounded-xl bg-slate-200 px-4 py-2.5 text-sm font-bold text-slate-800 transition hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    disabled={isSelf || deletingUserId === userId}
                    onClick={() => onDeleteUser(userId)}
                    className="rounded-xl bg-rose-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:bg-rose-300"
                  >
                    {deletingUserId === userId ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </article>
            );
          })}

          {!filteredUsers.length && (
            <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-700">
              No users found
            </div>
          )}
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <th className="py-3">User</th>
                <th>Role</th>
                <th>Team</th>
                <th>Primary Hotel</th>
                <th>Access</th>
                <th>Created</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => {
                const userId = user._id || user.id;
                const isSelf = userId === currentUser?.id || userId === currentUser?._id;
                const setupIssues = getUserSetupIssues(user);

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
                      <div className="space-y-2">
                        <RoleBadge role={user.role} />
                        <SetupBadges issues={setupIssues} compact />
                      </div>
                    </td>
                    <td className="text-slate-600 dark:text-slate-300">
                      {user.departmentId?.name || user.departmentName || user.team}
                    </td>
                    <td className="text-slate-600 dark:text-slate-300">
                      {getHotelLabel(user.hotelId) || "-"}
                    </td>
                    <td className="text-slate-600 dark:text-slate-300">
                      {getAccessSummary(user, hotels)}
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

              {!filteredUsers.length && (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-500">
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

function canUseMultiHotelAccess(role) {
  return multiHotelRoles.has(role);
}

function buildAccountStats(users) {
  return users.reduce(
    (stats, user) => {
      if (staffRoles.has(user.role)) stats.staff += 1;
      if (user.role === "User") stats.requesters += 1;
      if (getHotelAccessIds(user).length > 1) stats.multiHotel += 1;
      if (legacyRoles.has(user.role)) stats.legacy += 1;
      if (getUserSetupIssues(user).length > 0) stats.needsReview += 1;
      return stats;
    },
    { legacy: 0, multiHotel: 0, needsReview: 0, requesters: 0, staff: 0 },
  );
}

function matchesUserFilters(user, filters) {
  const keyword = filters.search.trim().toLowerCase();
  const hotelIds = [
    getEntityId(user.hotelId),
    ...getHotelAccessIds(user),
  ].filter(Boolean);
  const userDepartmentId = getEntityId(user.departmentId);
  const setupIssues = getUserSetupIssues(user);
  const text = [
    user.name,
    user.email,
    user.role,
    user.team,
    user.departmentName,
    user.departmentId?.name,
    getHotelLabel(user.hotelId),
  ]
    .join(" ")
    .toLowerCase();

  if (keyword && !text.includes(keyword)) return false;
  if (filters.roleFilter !== "all" && user.role !== filters.roleFilter) return false;
  if (filters.hotelFilter !== "all" && !hotelIds.includes(filters.hotelFilter)) return false;
  if (
    filters.departmentFilter !== "all" &&
    userDepartmentId !== filters.departmentFilter &&
    String(user.departmentName || user.team || "") !== filters.departmentFilter
  ) {
    return false;
  }
  if (filters.setupFilter === "needs-review" && setupIssues.length === 0) return false;
  if (filters.setupFilter === "ready" && setupIssues.length > 0) return false;
  if (filters.setupFilter === "legacy" && !legacyRoles.has(user.role)) return false;

  return true;
}

function buildRoleFilterOptions(users) {
  const roles = [...new Set(users.map((user) => user.role).filter(Boolean))];
  return [
    { value: "all", label: "All roles", prefix: "A" },
    ...roles.map((role) => ({
      value: role,
      label: role,
      prefix: role.slice(0, 2).toUpperCase(),
    })),
  ];
}

function buildDepartmentFilterOptions(users, departments) {
  const departmentLookup = new Map(
    departments.map((department) => [getEntityId(department), department]),
  );
  const options = new Map();

  users.forEach((user) => {
    const departmentId = getEntityId(user.departmentId);
    const department = departmentLookup.get(departmentId) || user.departmentId;
    const label = department?.name || user.departmentName || user.team;
    const value = departmentId || label;
    if (value && label) {
      options.set(String(value), {
        value: String(value),
        label,
        meta: department?.code || "Department",
        prefix: String(department?.code || label).slice(0, 2).toUpperCase(),
      });
    }
  });

  return [
    { value: "all", label: "All departments", prefix: "A" },
    ...Array.from(options.values()).sort((a, b) => a.label.localeCompare(b.label)),
  ];
}

function buildHotelFilterOptions(hotels) {
  return [
    { value: "all", label: "All hotels", prefix: "A" },
    ...hotels.map((hotel) => ({
      value: getEntityId(hotel),
      label: getHotelLabel(hotel),
      meta: hotel.region || "Hotel",
      prefix: String(hotel.code || hotel.name || "HT").slice(0, 2),
    })),
  ];
}

function getUserSetupIssues(user) {
  const issues = [];
  const primaryHotelId = getEntityId(user.hotelId);
  const accessIds = normalizeHotelAccess(primaryHotelId, getHotelAccessIds(user), user.role);
  const hasDepartment = Boolean(getEntityId(user.departmentId) || user.departmentName || user.team);

  if (user.active === false) issues.push({ label: "Inactive", tone: "neutral" });
  if (legacyRoles.has(user.role)) issues.push({ label: "Legacy role", tone: "warning" });
  if (!primaryHotelId) issues.push({ label: "No hotel", tone: "danger" });
  if (user.role === "User" && !hasDepartment) issues.push({ label: "No department", tone: "danger" });
  if (canUseMultiHotelAccess(user.role) && !accessIds.length) {
    issues.push({ label: "No access", tone: "danger" });
  }

  return issues;
}

function getRoleOptions(currentRole) {
  const options = activeRoles.map((role) => ({
    value: role,
    label: role,
    prefix: role.slice(0, 2).toUpperCase(),
  }));

  if (legacyRoles.has(currentRole)) {
    return [
      {
        value: currentRole,
        label: `${currentRole} (legacy)`,
        meta: "Change to GroupAdmin or Manager when possible",
        prefix: currentRole.slice(0, 2).toUpperCase(),
      },
      ...options,
    ];
  }

  return options;
}

function getEmptyUserForm(selectedHotelId) {
  const primaryHotelId = selectedHotelId === "all" ? "" : selectedHotelId;
  return {
    ...emptyForm,
    hotelId: primaryHotelId,
    hotelAccess: primaryHotelId ? [primaryHotelId] : [],
  };
}

function getEntityId(entity) {
  return String(entity?._id || entity?.id || entity || "");
}

function getHotelLabel(hotel) {
  if (!hotel) return "";
  if (typeof hotel === "string") return hotel;
  return [hotel.code, hotel.name].filter(Boolean).join(" / ") || getEntityId(hotel);
}

function getHotelAccessIds(user) {
  return Array.isArray(user?.hotelAccess)
    ? user.hotelAccess.map(getEntityId).filter(Boolean)
    : [];
}

function normalizeHotelAccess(primaryHotelId, accessIds, role) {
  const primaryId = String(primaryHotelId || "");
  const ids = canUseMultiHotelAccess(role)
    ? accessIds.map((id) => String(id?._id || id || "")).filter(Boolean)
    : [];
  return [...new Set([primaryId, ...ids].filter(Boolean))];
}

function getAccessSummary(user, hotels) {
  const primaryId = getEntityId(user.hotelId);
  const hotelLookup = new Map(hotels.map((hotel) => [getEntityId(hotel), hotel]));
  const accessIds = normalizeHotelAccess(primaryId, getHotelAccessIds(user), user.role);
  const otherHotels = accessIds
    .filter((id) => id !== primaryId)
    .map((id) => hotelLookup.get(id) || user.hotelAccess?.find((hotel) => getEntityId(hotel) === id))
    .filter(Boolean);
  const primaryHotel = user.hotelId || hotelLookup.get(primaryId);
  const primaryLabel = getHotelLabel(primaryHotel) || "-";

  return otherHotels.length ? `${primaryLabel} + ${otherHotels.length} more` : primaryLabel;
}

const inputClass =
  "w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-blue-400";

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

function AccountStat({ label, tone = "default", value }) {
  const toneClass =
    tone === "warning"
      ? "text-amber-700 dark:text-amber-200"
      : "text-slate-950 dark:text-white";

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
      <p className={`text-2xl font-black ${toneClass}`}>{value.toLocaleString()}</p>
      <p className="mt-1 text-xs font-bold text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  );
}

function SetupBadges({ compact = false, issues }) {
  if (!issues.length) {
    return (
      <div className={compact ? "flex flex-wrap gap-1" : "mt-3 flex flex-wrap gap-2"}>
        <SetupBadge label="Ready" tone="success" />
      </div>
    );
  }

  return (
    <div className={compact ? "flex flex-wrap gap-1" : "mt-3 flex flex-wrap gap-2"}>
      {issues.map((issue) => (
        <SetupBadge key={issue.label} {...issue} />
      ))}
    </div>
  );
}

function SetupBadge({ label, tone = "neutral" }) {
  const className = {
    danger: "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-500/15 dark:text-rose-200 dark:ring-rose-400/20",
    neutral: "bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700",
    success: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-200 dark:ring-emerald-400/20",
    warning: "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/15 dark:text-amber-200 dark:ring-amber-400/20",
  }[tone];

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-black ring-1 ${className}`}>
      {label}
    </span>
  );
}

function RoleBadge({ role }) {
  const isAdmin = ["GroupAdmin", "Admin", "HotelAdmin"].includes(role);
  const isLegacy = legacyRoles.has(role);

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-bold ${
        isLegacy
          ? "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-100"
          : isAdmin
          ? "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-200"
          : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
      }`}
    >
      {isLegacy ? `${role} legacy` : role}
    </span>
  );
}

function MobileMeta({ label, value }) {
  return (
    <div className="rounded-lg bg-white p-3 dark:bg-slate-950">
      <dt className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
        {label}
      </dt>
      <dd className="mt-1 break-words font-semibold text-slate-800 dark:text-slate-100">
        {value}
      </dd>
    </div>
  );
}

export default UserManagement;
