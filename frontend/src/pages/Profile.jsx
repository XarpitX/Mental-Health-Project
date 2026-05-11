import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const initials = (user?.name || user?.email || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-semibold text-white">Profile</h1>
          <p className="mt-1 text-sm text-mc-muted">Your account details</p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-2.5 text-sm font-medium text-red-300 transition hover:bg-red-500/20"
        >
          Log out
        </button>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <section className="rounded-2xl border border-white/5 bg-mc-card p-6 shadow-lg">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-6">
            <div className="grid h-16 w-16 place-items-center rounded-2xl border border-white/10 bg-black/20 text-xl font-semibold text-white shadow-[0_18px_50px_rgba(0,0,0,0.35)]">
              {initials || "?"}
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-lg font-semibold text-white">{user?.name || "Your account"}</h2>
              <p className="mt-1 truncate text-sm text-mc-muted">{user?.email || "—"}</p>
            </div>
          </div>

          <dl className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3">
              <dt className="text-xs uppercase tracking-wide text-mc-muted">Name</dt>
              <dd className="mt-1 text-sm font-medium text-white">{user?.name || "—"}</dd>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3">
              <dt className="text-xs uppercase tracking-wide text-mc-muted">Email</dt>
              <dd className="mt-1 text-sm font-medium text-white">{user?.email || "—"}</dd>
            </div>
          </dl>
        </section>

        <aside className="rounded-2xl border border-white/5 bg-[#14213D] p-6 shadow-lg">
          <h3 className="text-sm font-semibold text-white">Account</h3>
          <p className="mt-2 text-sm leading-relaxed text-white/75">
            You’re signed in to MindCare. Use AI Chat, mood tracking, and exercises to build a calmer routine.
          </p>
          <div className="mt-5 rounded-xl border border-white/10 bg-black/20 px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-mc-muted">Signed in as</p>
            <p className="mt-1 truncate text-sm font-medium text-white">{user?.email || "—"}</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
