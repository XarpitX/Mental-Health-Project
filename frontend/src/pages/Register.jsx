import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";

function dashboardPathForRole(role) {
  if (role === "admin") return "/admin-dashboard";
  if (role === "consultant") return "/counsellor-dashboard";
  return "/user-dashboard";
}

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [targetRole, setTargetRole] = useState("user");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await register(name, email, password, targetRole);
      navigate(dashboardPathForRole(user.role), { replace: true });
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-mc-bg px-4">
      <main className="mx-auto grid w-full max-w-5xl flex-1 items-center gap-6 py-10 md:grid-cols-2 md:gap-10 md:py-14">
        <section className="rounded-3xl border border-white/10 bg-[#14213D] p-8 shadow-[0_30px_110px_rgba(0,0,0,0.55)] md:p-10">
          <div className="mb-6 inline-flex items-center gap-2">
            <span className="text-2xl text-mc-accent">●</span>
            <span className="text-lg font-semibold tracking-tight text-white">MindCare</span>
          </div>
          <h1 className="text-3xl font-semibold leading-tight text-white">
            Build a healthier routine—one small step at a time.
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-white/80">
            Create an account to save your progress, keep your mood history, and follow guided exercises whenever you
            need a quick reset.
          </p>
          <div className="mt-6 grid gap-3 text-sm text-white/85">
            <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
              Personalized dashboard with mood trends
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
              Exercise library with step-by-step “Start” mode
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
              Private chat support with smart suggestions
            </div>
          </div>
        </section>

        <section className="w-full">
          <div className="w-full rounded-2xl border border-white/5 bg-mc-card p-8 shadow-xl">
            <div className="mb-8 text-center">
              <h2 className="text-2xl font-semibold text-white">Create account</h2>
              <p className="mt-2 text-sm text-mc-muted">Start your MindCare journey</p>
            </div>
            <form onSubmit={submit} className="space-y-4">
              {error && (
                <div className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</div>
              )}
              <div>
                <label className="mb-1 block text-xs font-medium text-mc-muted">Register as</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "user", label: "User" },
                    { id: "admin", label: "Admin" },
                    { id: "consultant", label: "Counsellor" },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setTargetRole(opt.id)}
                      className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                        targetRole === opt.id
                          ? "border-mc-accent bg-mc-accent text-mc-bg"
                          : "border-white/10 bg-mc-bg text-white hover:border-mc-accent/40"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-mc-muted">Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-mc-bg px-4 py-2.5 text-white outline-none ring-mc-accent focus:ring-2"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-mc-muted">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-mc-bg px-4 py-2.5 text-white outline-none ring-mc-accent focus:ring-2"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-mc-muted">Password (min 6)</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-mc-bg px-4 py-2.5 text-white outline-none ring-mc-accent focus:ring-2"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-mc-accent py-3 font-medium text-mc-bg transition hover:bg-green-400 disabled:opacity-50"
              >
                {loading ? "Creating…" : "Register"}
              </button>
            </form>
            <p className="mt-6 text-center text-sm text-mc-muted">
              Already have an account?{" "}
              <Link to="/login" className="font-medium text-mc-accent hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </section>
      </main>

      <footer className="mx-auto w-full max-w-5xl pb-8">
        <div className="rounded-2xl border border-white/10 bg-black/20 px-6 py-5">
          <h3 className="text-sm font-semibold text-white">About</h3>
          <p className="mt-2 text-sm leading-relaxed text-mc-muted">
            MindCare helps you build a calmer routine with mood tracking, guided exercises, and supportive AI chat.
            Your progress stays saved so you can come back anytime and continue.
          </p>
        </div>
      </footer>
    </div>
  );
}
