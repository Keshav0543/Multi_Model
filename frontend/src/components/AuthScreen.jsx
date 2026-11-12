import { useState } from "react";
import Icon from "./Icons.jsx";
import { loginUser, registerUser } from "../lib/api.js";

const modes = {
  login: {
    title: "Welcome back",
    subtitle: "Sign in to reach your documents and past sessions.",
    action: "Sign in",
    switchCopy: "New here?",
    switchAction: "Create an account",
  },
  register: {
    title: "Create your account",
    subtitle: "Your files, sessions and answers stay isolated to you.",
    action: "Create account",
    switchCopy: "Already registered?",
    switchAction: "Sign in",
  },
};

function Backdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
      <div className="absolute -top-40 left-[10%] h-[32rem] w-[32rem] rounded-full bg-violet-600/25 blur-[130px]" />
      <div className="absolute right-[-8rem] top-1/3 h-[26rem] w-[26rem] rounded-full bg-cyan-500/10 blur-[130px]" />
      <div className="absolute bottom-[-10rem] left-1/3 h-[26rem] w-[26rem] rounded-full bg-fuchsia-600/10 blur-[130px]" />
    </div>
  );
}

export default function AuthScreen({ onAuthenticated }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ userId: "", email: "", password: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const copy = modes[mode];

  function update(field, value) {
    setForm((previous) => ({ ...previous, [field]: value }));
  }

  function switchMode(next) {
    setMode(next);
    setError("");
  }

  async function submit(event) {
    event.preventDefault();
    if (busy) return;

    const userId = form.userId.trim();
    const email = form.email.trim();
    const password = form.password;

    if (!userId || !password || (mode === "register" && !email)) {
      setError("Fill in every field to continue.");
      return;
    }

    if (mode === "register" && !email.includes("@")) {
      setError("Enter a valid email address.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setBusy(true);
    setError("");

    try {
      const data =
        mode === "login"
          ? await loginUser({ userId, password })
          : await registerUser({ userId, email, password });

      if (!data?.user?.id || !data?.sessionId) {
        throw new Error("The server response was incomplete. Try again.");
      }

      onAuthenticated({ user: data.user, sessionId: data.sessionId });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-[#05070f] px-4 py-10 text-slate-100">
      <Backdrop />

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-6 flex items-center justify-center gap-2.5">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-900/40 ring-1 ring-white/20">
            <Icon name="sparkles" className="h-5 w-5 text-white" />
          </span>
          <div>
            <p className="text-base font-semibold tracking-tight text-white">Lumen</p>
            <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
              Multimodal RAG
            </p>
          </div>
        </div>

        <div className="animate-rise rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-2xl shadow-black/40 backdrop-blur-xl sm:p-8">
          <h1 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
            {copy.title}
          </h1>
          <p className="mt-1.5 text-xs leading-5 text-slate-400 sm:text-sm">
            {copy.subtitle}
          </p>

          <div className="mt-5 grid grid-cols-2 gap-1 rounded-xl border border-white/10 bg-slate-950/40 p-1">
            {[
              ["login", "Sign in"],
              ["register", "Register"],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => switchMode(value)}
                aria-pressed={mode === value}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  mode === value
                    ? "bg-white/10 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="mt-5 space-y-3.5">
            <label className="block">
              <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                User ID
              </span>
              <input
                value={form.userId}
                onChange={(event) => update("userId", event.target.value)}
                autoComplete="username"
                placeholder="keshav"
                spellCheck={false}
                className="w-full rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-violet-400/50 focus:outline-none focus:ring-4 focus:ring-violet-500/10"
              />
            </label>

            {mode === "register" && (
              <label className="block">
                <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Email
                </span>
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) => update("email", event.target.value)}
                  autoComplete="email"
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-violet-400/50 focus:outline-none focus:ring-4 focus:ring-violet-500/10"
                />
              </label>
            )}

            <label className="block">
              <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                Password
              </span>
              <input
                type="password"
                value={form.password}
                onChange={(event) => update("password", event.target.value)}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                placeholder="••••••••"
                className="w-full rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-violet-400/50 focus:outline-none focus:ring-4 focus:ring-violet-500/10"
              />
            </label>

            {error && (
              <div className="flex items-start gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-[11px] leading-5 text-rose-200">
                <Icon name="alert" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-950/50 transition hover:brightness-110 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <Icon name="sparkles" className="h-4 w-4" />
              )}
              {busy ? "Please wait…" : copy.action}
            </button>
          </form>

          <p className="mt-4 text-center text-[11px] text-slate-500">
            {copy.switchCopy}{" "}
            <button
              type="button"
              onClick={() => switchMode(mode === "login" ? "register" : "login")}
              className="font-medium text-violet-300 transition hover:text-violet-200"
            >
              {copy.switchAction}
            </button>
          </p>
        </div>

        <p className="mt-5 text-center text-[10px] text-slate-600">
          Gemini · MongoDB Atlas · Express
        </p>
      </div>
    </div>
  );
}
