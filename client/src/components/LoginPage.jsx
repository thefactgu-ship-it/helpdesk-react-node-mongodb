import { Building2, ShieldCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const GOOGLE_SCRIPT_SRC = "https://accounts.google.com/gsi/client";
let googleScriptPromise;

function loadGoogleScript() {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (googleScriptPromise) return googleScriptPromise;

  googleScriptPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector(`script[src="${GOOGLE_SCRIPT_SRC}"]`);
    if (existingScript) {
      existingScript.addEventListener("load", resolve, { once: true });
      existingScript.addEventListener("error", reject, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = GOOGLE_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });

  return googleScriptPromise;
}

function LoginPage({ onGoogleLogin, onLogin }) {
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState("");
  const [googleRendered, setGoogleRendered] = useState(false);
  const [showResetHelp, setShowResetHelp] = useState(false);
  const googleButtonRef = useRef(null);
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  });

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      if (!googleClientId) {
        setGoogleError("Google login is not configured yet.");
      } else {
        setGoogleError("");
      }
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [googleClientId]);

  useEffect(() => {
    if (!googleClientId || !onGoogleLogin) return undefined;

    let cancelled = false;

    loadGoogleScript()
      .then(() => {
        if (cancelled) return;

        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: async (response) => {
            if (!response?.credential) return;
            setGoogleLoading(true);
            try {
              await onGoogleLogin(response.credential);
            } finally {
              setGoogleLoading(false);
            }
          },
        });
        setGoogleError("");
        // Try to render the official Google button into our ref. If it fails,
        // we'll keep the visible fallback button that calls `prompt()`.
        try {
          if (googleButtonRef.current && window.google?.accounts?.id?.renderButton) {
            window.google.accounts.id.renderButton(googleButtonRef.current, {
              theme: "outline",
              size: "large",
              width: "100%",
              text: "signin_with",
            });
            setGoogleRendered(true);
          }
        } catch (err) {
          console.warn("Google renderButton failed", err);
        }
      })
      .catch((error) => {
        console.error("Failed to load Google Identity Services", error);
        setGoogleError("Google sign-in could not be loaded right now.");
      });

    return () => {
      cancelled = true;
    };
  }, [googleClientId, onGoogleLogin]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await onLogin(loginForm);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleButtonClick = () => {
    if (!googleClientId || !window.google?.accounts?.id) {
      setGoogleError("Google login is not configured yet.");
      return;
    }

    setGoogleError("");
    window.google.accounts.id.prompt();
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
            disabled={loading || googleLoading}
            className="ops-button-primary w-full py-3.5"
          >
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>

        <div className="mt-5">
          <div className="mb-4 flex items-center gap-3 text-xs font-bold uppercase tracking-wide text-slate-400">
            <span className="h-px flex-1 bg-slate-200" />
            or
            <span className="h-px flex-1 bg-slate-200" />
          </div>
          <div className="w-full">
            <div ref={googleButtonRef} className="w-full" />

            {/* Fallback visible button shown only when the SDK button hasn't rendered */}
            {!googleRendered && (
              <button
                type="button"
                onClick={handleGoogleButtonClick}
                disabled={loading || googleLoading}
                className="flex w-full items-center justify-center gap-3 rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="#4285F4"
                    d="M21.6 12.23c0-.82-.07-1.6-.2-2.35H12v4.45h5.38a4.6 4.6 0 0 1-2 3.02v2.49h3.24c1.9-1.75 2.98-4.33 2.98-7.61Z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 22c2.7 0 4.96-.9 6.62-2.43l-3.24-2.49c-.9.6-2.05.96-3.38.96-2.6 0-4.8-1.76-5.59-4.12H3.07v2.58A10 10 0 0 0 12 22Z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M6.41 12.92A5.99 5.99 0 0 1 6.41 9.08V6.5H3.07a10 10 0 0 0 0 12.84l3.34-2.42Z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 6.04c1.47 0 2.79.5 3.83 1.49l2.87-2.87A9.96 9.96 0 0 0 12 2a10 10 0 0 0-8.93 5.5l3.34 2.42C7.2 7.8 9.4 6.04 12 6.04Z"
                  />
                </svg>
                {googleLoading ? "Connecting..." : googleClientId ? "Continue with Google" : "Google login unavailable"}
              </button>
            )}
          </div>
          {googleError && <p className="mt-2 text-center text-sm text-amber-700">{googleError}</p>}
        </div>

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
