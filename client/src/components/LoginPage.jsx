import { Building2, ShieldCheck } from "lucide-react";
import { useState } from "react";

function LoginPage({ onLogin }) {
  const [loading, setLoading] = useState(false);
  const [showResetHelp, setShowResetHelp] = useState(false);
  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await onLogin(loginForm);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 p-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.28),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(15,118,110,0.18),transparent_30%)]" />
      <div className="absolute inset-x-0 top-0 h-px bg-blue-400/40" />

      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-white p-8 shadow-xl shadow-slate-950/40">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-sm">
            <ShieldCheck className="h-6 w-6" aria-hidden="true" />
          </div>
          <p className="mb-2 inline-flex items-center justify-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-slate-500">
            <Building2 className="h-3.5 w-3.5" aria-hidden="true" />
            Multi-Hotel Operations
          </p>
          <h1 className="text-3xl font-bold text-slate-900">IT Help Desk</h1>
          <p className="mt-2 text-sm text-slate-500">
            Sign in with the account created by your administrator.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">
              Email
            </span>
            <input
              type="email"
              placeholder="you@example.com"
              value={loginForm.email}
              disabled={loading}
              onChange={(e) =>
                setLoginForm({ ...loginForm, email: e.target.value })
              }
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">
              Password
            </span>
            <input
              type="password"
              placeholder="Enter password"
              value={loginForm.password}
              disabled={loading}
              onChange={(e) =>
                setLoginForm({ ...loginForm, password: e.target.value })
              }
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-blue-600 py-3.5 font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400 disabled:shadow-none"
          >
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>

        <div className="mt-5 text-center">
          <button
            type="button"
            onClick={() => setShowResetHelp((current) => !current)}
            className="text-sm font-semibold text-blue-700 transition hover:text-blue-800"
          >
            Forgot password?
          </button>
        </div>

        {showResetHelp && (
          <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900">
            Please contact your administrator to reset your password. Admins can
            update temporary passwords from User Management.
          </div>
        )}
      </div>
    </div>
  );
}

export default LoginPage;
