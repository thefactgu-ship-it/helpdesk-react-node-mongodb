import { useEffect, useRef, useState } from "react";

function ProfilePage({
  changingPassword,
  currentUser,
  initialSection = "profile",
  onChangePassword,
  onUpdateProfile,
  savingProfile,
}) {
  const passwordSectionRef = useRef(null);
  const [profileForm, setProfileForm] = useState(() => ({
    name: currentUser?.name || "",
    email: currentUser?.email || "",
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
    };

    if (payload.name.length < 2) {
      onUpdateProfile(null, "Name must be at least 2 characters");
      return;
    }
    if (!payload.email) {
      onUpdateProfile(null, "Email is required");
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
      <section className="ops-panel p-6">
        <p className="ops-section-label mb-2">
          Account
        </p>
        <h3 className="text-2xl font-black text-slate-950 dark:text-white">
          Update Profile
        </h3>
        <p className="mt-2 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
          Keep your account details current. Role and department are managed from User Management.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <div className="ops-panel p-6">
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

            <Field label="Role">
              <input
                type="text"
                value={currentUser?.role || "User"}
                disabled
                className={inputClass}
              />
            </Field>

            <Field label="Department">
              <input
                type="text"
                value={getDepartmentLabel(currentUser)}
                disabled
                className={inputClass}
              />
              <p className="mt-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                Department changes are handled by an admin in User Management.
              </p>
            </Field>

            <button
              type="submit"
              disabled={savingProfile}
              className="ops-button-primary w-full px-5 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-60"
            >
              {savingProfile ? "Saving..." : "Save Profile"}
            </button>
          </form>
        </div>

        <div
          ref={passwordSectionRef}
          className="ops-panel p-6"
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
              className="ops-button-primary w-full px-5 py-3 text-sm"
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
  "ops-input disabled:cursor-not-allowed disabled:opacity-60";

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

function getDepartmentLabel(user) {
  return user?.departmentId?.name || user?.departmentName || user?.team || "No department";
}

export default ProfilePage;
