import { useState } from "react";

const socialButtons = [
  { label: "Google", icon: GoogleIcon },
  { label: "GitHub", icon: GitHubIcon },
  { label: "Apple", icon: AppleIcon },
];

function LoginPage({ onLogin, onRegister }) {
  const [mode, setMode] = useState("login");
  const [loading, setLoading] = useState(false);
  const [loginForm, setLoginForm] = useState({
    email: "admin@test.com",
    password: "123456",
  });
  const [registerForm, setRegisterForm] = useState({
    name: "",
    email: "",
    password: "",
    team: "Support",
  });

  const isLogin = mode === "login";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        await onLogin(loginForm);
      } else {
        const registered = await onRegister(registerForm);

        if (registered) {
          setMode("login");
          setLoginForm({
            email: registerForm.email,
            password: "",
          });
          setRegisterForm({
            name: "",
            email: "",
            password: "",
            team: "Support",
          });
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-fuchsia-400 via-purple-500 to-violet-700 p-6">
      <div className="w-full max-w-md rounded-3xl bg-white/95 p-8 shadow-2xl backdrop-blur">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-600 text-lg font-bold text-white shadow-lg shadow-purple-200">
            H
          </div>
          <h1 className="text-3xl font-bold text-slate-900">
            {isLogin ? "Welcome back" : "Create account"}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {isLogin
              ? "Sign in to manage your helpdesk tickets"
              : "Register to start tracking support tickets"}
          </p>
        </div>

        <div className="mb-6 grid grid-cols-2 rounded-2xl bg-slate-100 p-1 text-sm font-semibold">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`rounded-xl py-2.5 transition ${
              isLogin
                ? "bg-white text-purple-700 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => setMode("register")}
            className={`rounded-xl py-2.5 transition ${
              !isLogin
                ? "bg-white text-purple-700 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                Name
              </span>
              <input
                type="text"
                placeholder="Your name"
                value={registerForm.name}
                disabled={loading}
                onChange={(e) =>
                  setRegisterForm({ ...registerForm, name: e.target.value })
                }
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-purple-500 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </label>
          )}

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">
              Email
            </span>
            <input
              type="email"
              placeholder="you@example.com"
              value={isLogin ? loginForm.email : registerForm.email}
              disabled={loading}
              onChange={(e) =>
                isLogin
                  ? setLoginForm({ ...loginForm, email: e.target.value })
                  : setRegisterForm({
                      ...registerForm,
                      email: e.target.value,
                    })
              }
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-purple-500 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </label>

          {!isLogin && (
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                Team
              </span>
              <select
                value={registerForm.team}
                disabled={loading}
                onChange={(e) =>
                  setRegisterForm({ ...registerForm, team: e.target.value })
                }
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-purple-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <option value="Support">Support</option>
                <option value="Operations">Operations</option>
                <option value="Sales">Sales</option>
                <option value="HR">HR</option>
              </select>
            </label>
          )}

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">
              Password
            </span>
            <input
              type="password"
              placeholder={isLogin ? "Enter password" : "Create password"}
              value={isLogin ? loginForm.password : registerForm.password}
              disabled={loading}
              onChange={(e) =>
                isLogin
                  ? setLoginForm({ ...loginForm, password: e.target.value })
                  : setRegisterForm({
                      ...registerForm,
                      password: e.target.value,
                    })
              }
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-purple-500 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </label>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-purple-600 py-3.5 font-semibold text-white shadow-lg shadow-purple-200 transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:bg-purple-400 disabled:shadow-none"
          >
            {loading
              ? isLogin
                ? "Signing in..."
                : "Creating account..."
              : isLogin
                ? "Login"
                : "Register"}
          </button>
        </form>

        <div className="my-6 flex items-center gap-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
          <span className="h-px flex-1 bg-slate-200" />
          or continue with
          <span className="h-px flex-1 bg-slate-200" />
        </div>

        <div className="grid grid-cols-3 gap-3">
          {socialButtons.map((button) => (
            <button
              key={button.label}
              type="button"
              className="flex h-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-purple-200 hover:bg-purple-50 hover:text-purple-700"
              aria-label={`${button.label} login placeholder`}
            >
              <button.icon />
            </button>
          ))}
        </div>

        <p className="mt-6 text-center text-sm text-slate-500">
          {isLogin ? "No account yet?" : "Already have an account?"}
          <button
            type="button"
            onClick={() => setMode(isLogin ? "register" : "login")}
            className="ml-2 font-semibold text-purple-700 hover:text-purple-800"
          >
            {isLogin ? "Create one" : "Back to login"}
          </button>
        </p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
      />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 .5C5.65.5.5 5.65.5 12c0 5.09 3.29 9.39 7.86 10.91.57.1.78-.25.78-.55v-2.02c-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.54-2.55-.29-5.23-1.28-5.23-5.68 0-1.25.45-2.28 1.19-3.08-.12-.29-.52-1.46.11-3.04 0 0 .97-.31 3.17 1.18A10.95 10.95 0 0 1 12 6.2c.98 0 1.96.13 2.88.39 2.2-1.49 3.16-1.18 3.16-1.18.63 1.58.23 2.75.11 3.04.74.8 1.19 1.83 1.19 3.08 0 4.42-2.69 5.39-5.25 5.67.41.36.78 1.06.78 2.14v3.02c0 .3.21.66.79.55A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5z"
      />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        fill="currentColor"
        d="M16.53 12.35c-.03-2.08 1.7-3.08 1.78-3.13-1-.15-2.2-1.07-2.98-1.07-1.27 0-2.19.75-2.75.75-.58 0-1.47-.73-2.42-.71-1.24.02-2.39.72-3.03 1.83-1.29 2.23-.33 5.54.93 7.35.61.89 1.34 1.88 2.3 1.85.92-.04 1.27-.6 2.39-.6 1.11 0 1.43.6 2.41.58.99-.02 1.62-.9 2.23-1.79.7-1.03.99-2.03 1.01-2.08-.02-.01-1.85-.71-1.87-2.98zM14.5 6.82c.51-.62.86-1.48.76-2.34-.74.03-1.64.49-2.17 1.11-.48.55-.89 1.43-.78 2.27.83.06 1.68-.42 2.19-1.04z"
      />
    </svg>
  );
}

export default LoginPage;
