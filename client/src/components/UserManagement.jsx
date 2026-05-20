import { useMemo, useState } from "react";
import { MoreVertical, X } from "lucide-react";
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
const pageSizeOptions = [10, 25, 50];
const roleRank = {
  User: 10,
  Agent: 20,
  Manager: 30,
  HotelAdmin: 40,
  RegionalManager: 45,
  Admin: 50,
  GroupAdmin: 60,
};

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
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [detailUser, setDetailUser] = useState(null);
  const [openActionUserId, setOpenActionUserId] = useState(null);
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
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pagedUsers = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, pageSize, safeCurrentPage]);
  const firstVisibleUser = filteredUsers.length ? (safeCurrentPage - 1) * pageSize + 1 : 0;
  const lastVisibleUser = Math.min(safeCurrentPage * pageSize, filteredUsers.length);
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
    setDetailUser(null);
    setOpenActionUserId(null);
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
    setCurrentPage(1);
    setOpenActionUserId(null);
  };

  const updateFilter = (setter, value) => {
    setter(value);
    setCurrentPage(1);
    setOpenActionUserId(null);
  };

  const handleDeleteUser = (userId) => {
    setOpenActionUserId(null);
    setDetailUser(null);
    onDeleteUser(userId);
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
          <div className="mb-5 grid min-w-0 gap-3 lg:grid-cols-5">
            <input
              type="text"
              value={search}
              onChange={(event) => updateFilter(setSearch, event.target.value)}
              placeholder="Search name, email, team..."
              className="min-w-0 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 lg:col-span-2"
            />
            <ThemedSelect
              size="sm"
              value={roleFilter}
              onChange={(value) => updateFilter(setRoleFilter, value)}
              options={roleOptions}
            />
            <ThemedSelect
              size="sm"
              value={hotelFilter}
              onChange={(value) => updateFilter(setHotelFilter, value)}
              options={hotelOptions}
            />
            <ThemedSelect
              size="sm"
              value={setupFilter}
              onChange={(value) => updateFilter(setSetupFilter, value)}
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
                onChange={(value) => updateFilter(setDepartmentFilter, value)}
                options={departmentOptions}
              />
            </div>
          </div>
        )}

        <div className="grid gap-3 md:hidden">
          {pagedUsers.map((user) => {
            const userId = user._id || user.id;
            const isSelf = userId === currentUser?.id || userId === currentUser?._id;
            const canManageThisUser = canManageUserRole(currentUser, user);
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
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <RoleBadge role={user.role} />
                    <StatusChips issues={setupIssues} compact />
                  </div>
                </div>

                <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <MobileMeta label="Team" value={user.departmentId?.name || user.departmentName || user.team || "-"} />
                  <MobileMeta label="Hotel scope" value={getAccessSummary(user, hotels)} />
                </dl>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setDetailUser(user)}
                    className="rounded-xl bg-slate-200 px-4 py-2.5 text-sm font-bold text-slate-800 transition hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                  >
                    Details
                  </button>
                  <button
                    type="button"
                    disabled={!canManageThisUser}
                    onClick={() => startEdit(user)}
                    className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 dark:disabled:bg-slate-700"
                  >
                    Edit
                  </button>
                </div>

                {!isSelf && canManageThisUser && (
                  <button
                    type="button"
                    disabled={deletingUserId === userId}
                    onClick={() => handleDeleteUser(userId)}
                    className="mt-3 w-full rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-sm font-bold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-rose-500/30 dark:bg-slate-950 dark:text-rose-200 dark:hover:bg-rose-500/10"
                  >
                    {deletingUserId === userId ? "Deleting..." : "Delete account"}
                  </button>
                )}
              </article>
            );
          })}

          {!filteredUsers.length && (
            <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-700">
              No users found
            </div>
          )}
        </div>

        <div className="hidden overflow-visible md:block">
          <table className="w-full table-fixed text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <th className="w-[31%] px-3 py-3">User</th>
                <th className="w-[21%] px-3">Role & status</th>
                <th className="w-[18%] px-3">Department</th>
                <th className="w-[22%] px-3">Hotel scope</th>
                <th className="w-[8%] px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pagedUsers.map((user) => {
                const userId = user._id || user.id;
                const isSelf = userId === currentUser?.id || userId === currentUser?._id;
                const canManageThisUser = canManageUserRole(currentUser, user);
                const setupIssues = getUserSetupIssues(user);

                return (
                  <tr
                    key={userId}
                    className="border-b border-slate-100 last:border-0 dark:border-slate-800"
                  >
                    <td className="px-3 py-4">
                      <div className="truncate font-bold text-slate-900 dark:text-white">
                        {user.name}
                      </div>
                      <div className="truncate text-xs text-slate-500 dark:text-slate-400">
                        {user.email}
                      </div>
                      {isSelf && (
                        <div className="mt-1 text-[11px] font-bold text-blue-600 dark:text-blue-300">
                          Current account
                        </div>
                      )}
                    </td>
                    <td className="px-3">
                      <div className="space-y-2">
                        <RoleBadge role={user.role} />
                        <StatusChips issues={setupIssues} compact />
                      </div>
                    </td>
                    <td className="truncate px-3 text-slate-600 dark:text-slate-300">
                      {user.departmentId?.name || user.departmentName || user.team}
                    </td>
                    <td className="truncate px-3 text-slate-600 dark:text-slate-300">
                      {getAccessSummary(user, hotels)}
                    </td>
                    <td className="relative px-3">
                      <UserActionMenu
                        deleting={deletingUserId === userId}
                        disabledDelete={isSelf || !canManageThisUser}
                        disabledEdit={!canManageThisUser}
                        open={openActionUserId === userId}
                        onDelete={() => handleDeleteUser(userId)}
                        onDetails={() => {
                          setDetailUser(user);
                          setOpenActionUserId(null);
                        }}
                        onEdit={() => startEdit(user)}
                        onToggle={() =>
                          setOpenActionUserId(openActionUserId === userId ? null : userId)
                        }
                      />
                    </td>
                  </tr>
                );
              })}

              {!filteredUsers.length && (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-slate-500">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {!!filteredUsers.length && (
          <PaginationControls
            currentPage={safeCurrentPage}
            firstItem={firstVisibleUser}
            lastItem={lastVisibleUser}
            onPageChange={setCurrentPage}
            onPageSizeChange={(value) => {
              setPageSize(value);
              setCurrentPage(1);
            }}
            pageSize={pageSize}
            totalItems={filteredUsers.length}
            totalPages={totalPages}
          />
        )}

        <UserDetailDrawer
          currentUser={currentUser}
          deleting={detailUser ? deletingUserId === (detailUser._id || detailUser.id) : false}
          hotels={hotels}
          onClose={() => setDetailUser(null)}
          onDelete={handleDeleteUser}
          onEdit={startEdit}
          user={detailUser}
        />
      </section>
    </div>
  );
}

function canUseMultiHotelAccess(role) {
  return multiHotelRoles.has(role);
}

function getRoleRank(role) {
  return roleRank[role] || 0;
}

function canManageUserRole(currentUser, targetUser) {
  return getRoleRank(currentUser?.role) >= getRoleRank(targetUser?.role);
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

function getAccessHotelLabels(user, hotels) {
  const primaryId = getEntityId(user.hotelId);
  const hotelLookup = new Map(hotels.map((hotel) => [getEntityId(hotel), hotel]));
  const accessIds = normalizeHotelAccess(primaryId, getHotelAccessIds(user), user.role);

  return accessIds
    .map((id) => {
      const hotel = hotelLookup.get(id) || user.hotelAccess?.find((item) => getEntityId(item) === id);
      const label = getHotelLabel(hotel) || id;
      return id === primaryId ? `${label} (Primary)` : label;
    })
    .filter(Boolean);
}

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString() : "-";
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

function StatusChips({ compact = false, issues }) {
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

function UserActionMenu({
  deleting,
  disabledDelete,
  disabledEdit,
  onDelete,
  onDetails,
  onEdit,
  onToggle,
  open,
}) {
  return (
    <div className="flex justify-end">
      <button
        type="button"
        aria-label="Open user actions"
        aria-expanded={open}
        onClick={onToggle}
        className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-slate-950 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        <MoreVertical size={17} strokeWidth={2.4} />
      </button>

      {open && (
        <div className="absolute right-3 top-10 z-20 w-40 overflow-hidden rounded-xl border border-slate-200 bg-white p-1 shadow-xl dark:border-slate-700 dark:bg-slate-900">
          <button
            type="button"
            onClick={onDetails}
            className="w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            View details
          </button>
          <button
            type="button"
            disabled={disabledEdit}
            onClick={onEdit}
            className="w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400 disabled:hover:bg-transparent dark:text-slate-200 dark:hover:bg-slate-800 dark:disabled:text-slate-600"
          >
            Edit user
          </button>
          <button
            type="button"
            disabled={disabledDelete || deleting}
            onClick={onDelete}
            className="w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-rose-600 hover:bg-rose-50 disabled:cursor-not-allowed disabled:text-slate-400 disabled:hover:bg-transparent dark:text-rose-300 dark:hover:bg-rose-500/10 dark:disabled:text-slate-600"
          >
            {deleting ? "Deleting..." : "Delete account"}
          </button>
        </div>
      )}
    </div>
  );
}

function PaginationControls({
  currentPage,
  firstItem,
  lastItem,
  onPageChange,
  onPageSizeChange,
  pageSize,
  totalItems,
  totalPages,
}) {
  return (
    <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-4 text-sm dark:border-slate-800 md:flex-row md:items-center md:justify-between">
      <div className="text-slate-500 dark:text-slate-400">
        Showing <span className="font-bold text-slate-700 dark:text-slate-200">{firstItem}-{lastItem}</span> of{" "}
        <span className="font-bold text-slate-700 dark:text-slate-200">{totalItems}</span>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
          Rows
          <select
            value={pageSize}
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 font-bold text-slate-700 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          >
            {pageSizeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
            className="rounded-xl border border-slate-200 px-3 py-2 font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900"
          >
            Previous
          </button>
          <span className="min-w-20 text-center font-bold text-slate-700 dark:text-slate-200">
            {currentPage} / {totalPages}
          </span>
          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(currentPage + 1)}
            className="rounded-xl border border-slate-200 px-3 py-2 font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

function UserDetailDrawer({
  currentUser,
  deleting,
  hotels,
  onClose,
  onDelete,
  onEdit,
  user,
}) {
  if (!user) return null;

  const userId = user._id || user.id;
  const isSelf = userId === currentUser?.id || userId === currentUser?._id;
  const canManageThisUser = canManageUserRole(currentUser, user);
  const issues = getUserSetupIssues(user);
  const accessHotels = getAccessHotelLabels(user, hotels);

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-slate-950/30 backdrop-blur-sm">
      <button
        type="button"
        aria-label="Close user details"
        className="absolute inset-0 h-full w-full cursor-default"
        onClick={onClose}
      />
      <aside className="relative flex h-full w-full max-w-xl flex-col bg-white shadow-2xl dark:bg-slate-950">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5 dark:border-slate-800">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-600 dark:text-blue-300">
              User details
            </p>
            <h3 className="mt-2 truncate text-2xl font-black text-slate-950 dark:text-white">
              {user.name}
            </h3>
            <p className="mt-1 break-words text-sm text-slate-500 dark:text-slate-400">
              {user.email}
            </p>
          </div>
          <button
            type="button"
            aria-label="Close user details"
            onClick={onClose}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-950 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900"
          >
            <X size={18} strokeWidth={2.4} />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5">
          <div className="flex flex-wrap items-center gap-2">
            <RoleBadge role={user.role} />
            <StatusChips issues={issues} compact />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <DetailItem label="Department" value={user.departmentId?.name || user.departmentName || user.team || "-"} />
            <DetailItem label="Primary Hotel" value={getHotelLabel(user.hotelId) || "-"} />
            <DetailItem label="Created" value={formatDate(user.createdAt)} />
            <DetailItem label="Updated" value={formatDate(user.updatedAt)} />
          </div>

          <section>
            <h4 className="text-sm font-black text-slate-900 dark:text-white">
              Hotel access
            </h4>
            <div className="mt-3 grid gap-2">
              {accessHotels.map((label) => (
                <div
                  key={label}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                >
                  {label}
                </div>
              ))}
              {!accessHotels.length && (
                <div className="rounded-xl border border-dashed border-slate-300 px-3 py-3 text-sm text-slate-500 dark:border-slate-700">
                  No hotel access configured
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="grid gap-3 border-t border-slate-200 p-5 dark:border-slate-800 sm:grid-cols-2">
          <button
            type="button"
            disabled={!canManageThisUser}
            onClick={() => onEdit(user)}
            className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-black text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 dark:disabled:bg-slate-700"
          >
            Edit user
          </button>
          <button
            type="button"
            disabled={isSelf || deleting || !canManageThisUser}
            onClick={() => onDelete(userId)}
            className="rounded-xl border border-rose-200 px-4 py-3 text-sm font-black text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400 disabled:hover:bg-transparent dark:border-rose-500/30 dark:text-rose-300 dark:hover:bg-rose-500/10 dark:disabled:border-slate-800 dark:disabled:text-slate-600"
          >
            {deleting ? "Deleting..." : "Delete account"}
          </button>
        </div>
      </aside>
    </div>
  );
}

function DetailItem({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
      <div className="text-[11px] font-black uppercase tracking-wide text-slate-400">
        {label}
      </div>
      <div className="mt-1 break-words text-sm font-semibold text-slate-800 dark:text-slate-100">
        {value}
      </div>
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
