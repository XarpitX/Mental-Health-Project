import { useEffect, useState } from "react";
import StatCard from "../components/StatCard.jsx";
import { api } from "../utils/api.js";

function Badge({ children, tone = "neutral" }) {
  const cls =
    tone === "online"
      ? "bg-green-500/10 text-green-300 border-green-500/20"
      : tone === "admin"
        ? "bg-mc-accent/15 text-mc-accent border-mc-accent/20"
        : tone === "consultant"
          ? "bg-indigo-500/10 text-indigo-300 border-indigo-500/20"
          : "bg-white/5 text-mc-muted border-white/10";
  return <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${cls}`}>{children}</span>;
}

function displayRole(role) {
  if (role === "consultant") return "counsellor";
  return role;
}

export default function AdminDashboard() {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await api("/api/admin/overview");
        if (!cancelled) setOverview(data);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <p className="text-mc-muted">Loading admin dashboard...</p>;
  if (error) return <p className="text-red-300">{error}</p>;

  const users = overview?.users || [];
  const roleCounts = users.reduce(
    (acc, u) => {
      acc[u.role] = (acc[u.role] || 0) + 1;
      return acc;
    },
    { user: 0, admin: 0, consultant: 0 }
  );
  const onlineUsers = users.filter((u) => u.isOnline);

  return (
    <div className="space-y-10">
      <header className="mc-gradient-border rounded-3xl">
        <div className="mc-glass-strong rounded-3xl px-6 py-6 sm:px-8 sm:py-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge>Admin</Badge>
                <Badge tone="online">{overview?.stats.activeUsers ?? 0} online</Badge>
                <Badge>{overview?.stats.criticalUsers ?? 0} critical</Badge>
              </div>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white">Admin dashboard</h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-mc-muted">
                Monitor users, roles, online presence, and assessment risk signals in one place.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 px-5 py-4">
              <p className="text-xs uppercase tracking-[0.22em] text-mc-muted">Role mix</p>
              <div className="mt-2 flex flex-wrap gap-2 text-sm font-semibold text-white">
                <Badge>Users: {roleCounts.user || 0}</Badge>
                <Badge tone="admin">Admins: {roleCounts.admin || 0}</Badge>
                <Badge tone="consultant">Counsellors: {roleCounts.consultant || 0}</Badge>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard title="Total Users" value={overview?.stats.totalUsers ?? 0} icon="◇" />
        <StatCard title="Active Users" value={overview?.stats.activeUsers ?? 0} icon="●" />
        <StatCard title="Critical Users" value={overview?.stats.criticalUsers ?? 0} icon="!" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_0.7fr]">
        <section className="overflow-hidden rounded-3xl border border-white/10 bg-black/20 shadow-xl">
          <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
            <div>
              <h2 className="text-sm font-semibold text-white">Users</h2>
              <p className="mt-1 text-xs text-mc-muted">Name · Email · Role · Presence</p>
            </div>
            <Badge>{users.length} total</Badge>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/10 text-left text-sm">
              <thead className="bg-white/5 text-xs uppercase tracking-[0.18em] text-mc-muted">
                <tr>
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">Email</th>
                  <th className="px-6 py-3">Role</th>
                  <th className="px-6 py-3">Assigned counsellor</th>
                  <th className="px-6 py-3">Presence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 text-white/90">
                {users.map((u) => (
                  <tr key={u.id} className="transition hover:bg-white/5">
                    <td className="px-6 py-4 font-semibold text-white">{u.name}</td>
                    <td className="px-6 py-4 text-mc-muted">{u.email}</td>
                    <td className="px-6 py-4">
                      <Badge tone={u.role === "admin" ? "admin" : u.role === "consultant" ? "consultant" : "neutral"}>
                        {displayRole(u.role)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      {u.consultAssignment?.consultant ? (
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-white">{u.consultAssignment.consultant.name}</p>
                          <p className="truncate text-xs text-mc-muted">{u.consultAssignment.requestStatus}</p>
                        </div>
                      ) : u.consultAssignment ? (
                        <span className="text-xs text-mc-muted">Pending (not assigned)</span>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {u.isOnline ? (
                        <Badge tone="online">Online</Badge>
                      ) : (
                        <span className="text-slate-400">
                          Last active {u.lastActive ? new Date(u.lastActive).toLocaleString() : "never"}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="rounded-3xl border border-white/10 bg-black/20 p-6 shadow-xl">
          <h2 className="text-sm font-semibold text-white">Active now</h2>
          <p className="mt-1 text-xs text-mc-muted">Currently online users</p>
          <div className="mt-5 space-y-3">
            {onlineUsers.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 px-4 py-6 text-sm text-mc-muted">
                No active sessions right now.
              </div>
            ) : (
              onlineUsers.slice(0, 8).map((u) => (
                <div key={u.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">{u.name}</p>
                    <p className="truncate text-xs text-mc-muted">{u.email}</p>
                  </div>
                  <Badge tone="online">Online</Badge>
                </div>
              ))
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
