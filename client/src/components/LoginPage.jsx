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
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-[#06181c] p-6">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_18%_0%,rgba(45,212,191,0.18),transparent_56%),radial-gradient(ellipse_58%_42%_at_100%_100%,rgba(51,65,85,0.22),transparent_52%),linear-gradient(155deg,#061417_0%,#0a1f23_42%,#123237_100%)]" />
      <div className="absolute inset-x-0 top-0 h-px bg-teal-100/20" />
      <div className="absolute inset-x-10 top-10 h-24 rounded-full bg-teal-100/8 blur-3xl" />

      <div className="relative w-full max-w-md rounded-xl border border-white/25 bg-white/90 p-8 shadow-[0_24px_70px_rgba(9,5,20,0.46)] backdrop-blur-xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-xl bg-[#0a1f23] text-teal-50 shadow-[0_12px_32px_rgba(6,24,28,0.38)] ring-1 ring-white/25">
            <ShieldCheck className="h-6 w-6" aria-hidden="true" />
          </div>
          <p className="mb-2 inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white/85 px-3 py-1 text-xs font-bold uppercase tracking-wide text-slate-700 shadow-sm backdrop-blur-sm">
            <Building2 className="h-3.5 w-3.5" aria-hidden="true" />
            Multi-Hotel Operations
          </p>
          <h1 className="text-3xl font-black tracking-tight text-slate-950">IT Help Desk</h1>
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
              className="ops-input"
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
              className="ops-input"
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="ops-button-primary w-full py-3.5"
          >
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>

        <div className="mt-5 text-center">
          <button
            type="button"
            onClick={() => setShowResetHelp((current) => !current)}
            className="text-sm font-semibold text-slate-700 transition hover:text-slate-950"
          >
            Forgot password?
          </button>
        </div>

        {showResetHelp && (
          <div className="mt-4 rounded-lg border border-slate-200 bg-slate-100/80 px-4 py-3 text-sm text-slate-700 shadow-sm">
            Please contact your administrator to reset your password. Admins can
            update temporary passwords from User Management.
          </div>
        )}
      </div>
    </div>
  );
}

export default LoginPage;
