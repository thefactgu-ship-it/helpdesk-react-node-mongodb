import { useEffect, useRef, useState } from "react";
import ThemedSelect from "../components/ThemedSelect";

function ProfilePage({
  changingPassword,
  currentUser,
  departments = [],
  initialSection = "profile",
  onChangePassword,
  onUpdateProfile,
  savingProfile,
}) {
  const passwordSectionRef = useRef(null);
  const [profileForm, setProfileForm] = useState(() => ({
    name: currentUser?.name || "",
    email: currentUser?.email || "",
    team: currentUser?.team || "Support",
    departmentId: currentUser?.departmentId?._id || currentUser?.departmentId || "",
  }));
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (initialSection === "password") {
      passwordSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [initialSection]);

  const submitProfile = async (event) => {
    event.preventDefault();

    const payload = {
      name: profileForm.name.trim(),
      email: profileForm.email.trim(),
      team: profileForm.team.trim(),
      departmentId: profileForm.departmentId || undefined,
    };

    if (payload.name.length < 2) {
      onUpdateProfile(null, "Name must be at least 2 characters");
      return;
    }
    if (!payload.email) {
      onUpdateProfile(null, "Email is required");
      return;
    }
    if (!payload.team) {
      onUpdateProfile(null, "Team is required");
      return;
    }

    await onUpdateProfile(payload);
  };

  const submitPassword = async (event) => {
    event.preventDefault();

    if (!passwordForm.currentPassword) {
      onChangePassword(null, "Current password is required");
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      onChangePassword(null, "New password must be at least 6 characters");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      onChangePassword(null, "New password and confirm password do not match");
      return;
    }

    const success = await onChangePassword({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
    });

    if (success) {
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    }
  };

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:shadow-slate-950/40">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-blue-600 dark:text-blue-300">
          Account
        </p>
        <h3 className="text-2xl font-black text-slate-950 dark:text-white">
          Update Profile
        </h3>
        <p className="mt-2 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
          Keep your account details current. Your role is managed by an admin.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:shadow-slate-950/40">
          <h4 className="text-lg font-black text-slate-950 dark:text-white">
            Profile Details
          </h4>

          <form onSubmit={submitProfile} className="mt-5 space-y-4">
            <Field label="Name">
              <input
                type="text"
                value={profileForm.name}
                disabled={savingProfile}
                onChange={(event) =>
                  setProfileForm({ ...profileForm, name: event.target.value })
                }
                className={inputClass}
                placeholder="Full name"
              />
            </Field>

            <Field label="Email">
              <input
                type="email"
                value={profileForm.email}
                disabled={savingProfile}
                onChange={(event) =>
                  setProfileForm({ ...profileForm, email: event.target.value })
                }
                className={inputClass}
                placeholder="name@example.com"
              />
            </Field>

            <Field label="Team">
              <input
                type="text"
                value={profileForm.team}
                disabled={savingProfile}
                onChange={(event) =>
                  setProfileForm({ ...profileForm, team: event.target.value })
                }
                className={inputClass}
                placeholder="Support"
              />
            </Field>

            <Field label="Department">
              <ThemedSelect
                value={profileForm.departmentId}
                disabled={savingProfile}
                onChange={(value) => {
                  const department = departments.find(
                    (item) => (item._id || item.id) === value,
                  );
                  setProfileForm({
                    ...profileForm,
                    departmentId: value,
                    team: department?.name || profileForm.team,
                  });
                }}
                options={[
                  { value: "", label: "No department", prefix: "-" },
                  ...departments
                    .filter((department) => department.active !== false)
                    .map((department) => ({
                      value: department._id || department.id,
                      label: department.name,
                      meta: department.code,
                      prefix: department.code || department.name.slice(0, 2).toUpperCase(),
                    })),
                ]}
              />
            </Field>

            <Field label="Role">
              <input
                type="text"
                value={currentUser?.role || "User"}
                disabled
                className={inputClass}
              />
            </Field>

            <button
              type="submit"
              disabled={savingProfile}
              className="w-full rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-blue-500 dark:shadow-slate-950/30 dark:hover:bg-blue-400"
            >
              {savingProfile ? "Saving..." : "Save Profile"}
            </button>
          </form>
        </div>

        <div
          ref={passwordSectionRef}
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:shadow-slate-950/40"
        >
          <h4 className="text-lg font-black text-slate-950 dark:text-white">
            Change Password
          </h4>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            You will be logged out after your password is updated.
          </p>

          <form onSubmit={submitPassword} className="mt-5 space-y-4">
            <Field label="Current Password">
              <input
                type="password"
                value={passwordForm.currentPassword}
                disabled={changingPassword}
                onChange={(event) =>
                  setPasswordForm({
                    ...passwordForm,
                    currentPassword: event.target.value,
                  })
                }
                className={inputClass}
                placeholder="Enter current password"
              />
            </Field>

            <Field label="New Password">
              <input
                type="password"
                value={passwordForm.newPassword}
                disabled={changingPassword}
                onChange={(event) =>
                  setPasswordForm({
                    ...passwordForm,
                    newPassword: event.target.value,
                  })
                }
                className={inputClass}
                placeholder="At least 6 characters"
              />
            </Field>

            <Field label="Confirm New Password">
              <input
                type="password"
                value={passwordForm.confirmPassword}
                disabled={changingPassword}
                onChange={(event) =>
                  setPasswordForm({
                    ...passwordForm,
                    confirmPassword: event.target.value,
                  })
                }
                className={inputClass}
                placeholder="Repeat new password"
              />
            </Field>

            <button
              type="submit"
              disabled={changingPassword}
              className="w-full rounded-2xl bg-slate-900 px-5 py-3 text-sm font-black text-white shadow-lg shadow-slate-200 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-950 dark:shadow-slate-950/40 dark:hover:bg-slate-200"
            >
              {changingPassword ? "Updating..." : "Update Password"}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}

const inputClass =
  "w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-blue-400";

function Field({ children, label }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
        {label}
      </span>
      {children}
    </label>
  );
}

export default ProfilePage;
