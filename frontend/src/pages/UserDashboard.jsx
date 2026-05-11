import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AssessmentForm from "../components/AssessmentForm.jsx";
import AssessmentResult from "../components/AssessmentResult.jsx";
import StatCard from "../components/StatCard.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { api } from "../utils/api.js";

function Pill({ children, tone = "neutral" }) {
  const cls =
    tone === "good"
      ? "bg-green-500/10 text-green-300 border-green-500/20"
      : tone === "critical"
        ? "bg-red-500/10 text-red-300 border-red-500/20"
        : tone === "medium"
          ? "bg-yellow-500/10 text-yellow-300 border-yellow-500/20"
          : "bg-white/5 text-mc-muted border-white/10";
  return <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${cls}`}>{children}</span>;
}

export default function UserDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [assessment, setAssessment] = useState(null);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [assessmentRes, historyRes, statsRes] = await Promise.all([
          api("/api/assessments/me/latest"),
          api("/api/assessments/me/history"),
          api("/api/moods/stats"),
        ]);
        if (!cancelled) {
          setAssessment(assessmentRes.assessment);
          setHistory(historyRes.history || []);
          setStats(statsRes);
        }
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

  const submitAssessment = async (answers) => {
    setSubmitting(true);
    setError("");
    try {
      const data = await api("/api/assessments", { method: "POST", body: { answers } });
      setAssessment(data.assessment);
      try {
        const historyRes = await api("/api/assessments/me/history");
        setHistory(historyRes.history || []);
      } catch {
        // History is optional; assessment result is still primary.
      }
      try {
        const refreshed = await api("/api/moods/stats");
        setStats(refreshed);
      } catch {
        // Stats are optional; assessment result is still primary.
      }
      if (data.assessment.status === "medium") {
        navigate("/exercise", { replace: true });
      }
      if (data.assessment.status === "critical") {
        window.alert("We recommend talking to a counsellor.");
        navigate("/counsellor-request", { replace: true });
      }
    } catch (err) {
      setError(err.message || "Could not submit assessment");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p className="text-mc-muted">Loading your dashboard...</p>;

  const assessmentTone = assessment?.status || "neutral";

  return (
    <div className="space-y-10">
      <header className="mc-gradient-border rounded-3xl">
        <div className="mc-glass-strong rounded-3xl px-6 py-6 sm:px-8 sm:py-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Pill>MindCare</Pill>
                {assessment?.status ? (
                  <Pill tone={assessmentTone}>Assessment: {assessment.status.toUpperCase()}</Pill>
                ) : (
                  <Pill>Assessment: Not started</Pill>
                )}
              </div>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white">
                Welcome back, <span className="text-mc-accent">{user?.name}</span>
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-mc-muted">
                Your wellness hub—track moods, build streaks, and get the next best step based on your assessment.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link to="/mood" className="mc-btn inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold">
                Log mood
              </Link>
              <Link
                to="/chat"
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Start chat
              </Link>
            </div>
          </div>
        </div>
      </header>

      {error && <div className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Daily streak" value={stats?.dailyStreak ?? 0} subtitle="Days with mood activity" icon="◆" />
        <StatCard
          title="Avg mood score"
          value={stats?.avgMoodScore != null ? `${stats.avgMoodScore} / 10` : "—"}
          subtitle="Across all logs"
          icon="○"
        />
        <StatCard title="Conversations" value={stats?.totalConversations ?? 0} subtitle="AI chat sessions" icon="◇" />
        <StatCard
          title="Assessment score"
          value={assessment?.score ?? "—"}
          subtitle={assessment?.status ? assessment.status.toUpperCase() : "Complete your first assessment"}
          icon="◎"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="mc-gradient-border rounded-3xl">
          <div className="mc-glass rounded-3xl p-6 sm:p-7">
            <h2 className="text-lg font-semibold text-white">Quick actions</h2>
            <p className="mt-1 text-sm text-mc-muted">Shortcuts to your most helpful tools.</p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Link
                to="/exercise"
                className="rounded-2xl border border-white/10 bg-black/20 p-5 transition hover:border-mc-accent/30 hover:bg-black/30"
              >
                <p className="text-sm font-semibold text-white">Exercises</p>
                <p className="mt-2 text-sm text-mc-muted">Breathing, mindfulness, journaling, CBT prompts.</p>
              </Link>
              <Link
                to="/resources"
                className="rounded-2xl border border-white/10 bg-black/20 p-5 transition hover:border-mc-accent/30 hover:bg-black/30"
              >
                <p className="text-sm font-semibold text-white">Wellness library</p>
                <p className="mt-2 text-sm text-mc-muted">Explore simple practices you can repeat daily.</p>
              </Link>
              <Link
                to="/read-up-on-it"
                className="rounded-2xl border border-white/10 bg-black/20 p-5 transition hover:border-mc-accent/30 hover:bg-black/30"
              >
                <p className="text-sm font-semibold text-white">Read Up On It</p>
                <p className="mt-2 text-sm text-mc-muted">Articles on conditions + motivational reads.</p>
              </Link>
              <Link
                to="/mood"
                className="rounded-2xl border border-white/10 bg-black/20 p-5 transition hover:border-mc-accent/30 hover:bg-black/30"
              >
                <p className="text-sm font-semibold text-white">Mood tracker</p>
                <p className="mt-2 text-sm text-mc-muted">Log your mood and build consistency over time.</p>
              </Link>
              <Link
                to="/counsellor-request"
                className="rounded-2xl border border-white/10 bg-black/20 p-5 transition hover:border-mc-accent/30 hover:bg-black/30"
              >
                <p className="text-sm font-semibold text-white">Counsellor request</p>
                <p className="mt-2 text-sm text-mc-muted">View your request status and next steps.</p>
              </Link>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          {!assessment ? (
            <>
              <div className="rounded-3xl border border-white/10 bg-black/20 p-6">
                <h2 className="text-lg font-semibold text-white">Start your first assessment</h2>
                <p className="mt-2 text-sm leading-relaxed text-mc-muted">
                  Answer 10 quick questions (1–5 scale). We’ll classify your score into GOOD / MEDIUM / CRITICAL and guide you instantly.
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <Pill>10 questions</Pill>
                  <Pill>1–5 scale</Pill>
                  <Pill>Instant result</Pill>
                </div>
              </div>
              <AssessmentForm onSubmit={submitAssessment} loading={submitting} />
            </>
          ) : (
            <>
              <AssessmentResult assessment={assessment} onRetake={() => setAssessment(null)} />
              <div className="rounded-3xl border border-white/10 bg-black/20 p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-white">Assessment history</h2>
                    <p className="mt-1 text-sm text-mc-muted">Your earlier attempts are saved here.</p>
                  </div>
                  <Pill>{history.length} total</Pill>
                </div>

                <div className="mt-5 space-y-3">
                  {history.slice(0, 6).map((a) => (
                    <div
                      key={a.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-semibold text-white">
                          Score {a.score} / 50{" "}
                          <span className="text-xs uppercase tracking-[0.2em] text-mc-muted">({a.status})</span>
                        </p>
                        <p className="mt-1 text-xs text-mc-muted">{new Date(a.date).toLocaleString()}</p>
                      </div>
                      <Pill tone={a.status}>{a.status.toUpperCase()}</Pill>
                    </div>
                  ))}
                  {history.length === 0 && <p className="text-sm text-mc-muted">No previous assessments yet.</p>}
                  {history.length > 6 && (
                    <p className="text-xs text-mc-muted">Showing latest 6. Your older attempts are still saved.</p>
                  )}
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
