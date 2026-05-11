import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useAuth } from "../hooks/useAuth.js";
import { api } from "../utils/api.js";
import StatCard from "../components/StatCard.jsx";
import EmptyState from "../components/EmptyState.jsx";

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await api("/api/moods/stats");
        if (!cancelled) setStats(data);
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <p className="text-mc-muted">Loading dashboard…</p>;
  }

  if (error) {
    return <p className="text-red-300">{error}</p>;
  }

  const lineData = stats?.lineData || [];
  const barData = stats?.barData || [];
  const heatmap = stats?.heatmap || [];
  const hasMoodData = lineData.some((d) => d.score != null);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold text-white">
          Welcome back, <span className="text-mc-accent">{user?.name}</span>
        </h1>
        <p className="mt-1 text-sm text-mc-muted">Here is your wellness overview.</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Conversations"
          value={stats?.totalConversations ?? 0}
          icon="◇"
        />
        <StatCard
          title="Avg Mood Score"
          value={stats?.avgMoodScore != null ? `${stats.avgMoodScore} / 10` : "—"}
          subtitle="Across all logs"
          icon="○"
        />
        <StatCard title="Daily Streak" value={stats?.dailyStreak ?? 0} subtitle="Days with mood activity" icon="◆" />
        <StatCard
          title="Recent Mood"
          value={
            stats?.recentMood
              ? `${stats.recentMood.moodType} (${stats.recentMood.score})`
              : "No data"
          }
          subtitle={stats?.recentMood ? new Date(stats.recentMood.date).toLocaleDateString() : ""}
          icon="◎"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-white/5 bg-mc-card p-5 shadow-lg">
          <h2 className="mb-4 text-sm font-semibold text-white">Mood (last 30 days)</h2>
          {!hasMoodData ? (
            <EmptyState
              title="No mood data yet"
              description="Log your mood in Mood Tracker or chat with MindCare to see trends."
            />
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineData}>
                  <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                  <YAxis domain={[0, 10]} tick={{ fill: "#94a3b8", fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      background: "#0f2a1d",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "8px",
                    }}
                    labelStyle={{ color: "#e2e8f0" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#22c55e"
                    strokeWidth={2}
                    dot={false}
                    connectNulls
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-white/5 bg-mc-card p-5 shadow-lg">
          <h2 className="mb-4 text-sm font-semibold text-white">Mood by day of week</h2>
          {!hasMoodData ? (
            <EmptyState title="Not enough data" description="Log moods across the week to compare days." />
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                  <XAxis dataKey="day" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                  <YAxis domain={[0, 10]} tick={{ fill: "#94a3b8", fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      background: "#0f2a1d",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="avg" fill="#22c55e" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-white/5 bg-mc-card p-5 shadow-lg">
        <h2 className="mb-4 text-sm font-semibold text-white">Activity (14 days)</h2>
        <p className="mb-3 text-xs text-mc-muted">Darker = more mood logs / higher average intensity</p>
        <div className="flex flex-wrap gap-2">
          {heatmap.map((cell) => (
            <div
              key={cell.date}
              title={`${cell.date}: ${cell.count} logs`}
              className="h-10 w-10 rounded-lg border border-white/5 transition hover:ring-2 hover:ring-mc-accent/50"
              style={{
                background:
                  cell.intensity === 0
                    ? "rgba(34,197,94,0.08)"
                    : `rgba(34,197,94,${0.15 + cell.intensity * 0.18})`,
              }}
            />
          ))}
        </div>
        {heatmap.every((c) => c.count === 0) && (
          <p className="mt-4 text-sm text-mc-muted">No activity in the last two weeks. Start logging moods.</p>
        )}
      </div>
    </div>
  );
}
