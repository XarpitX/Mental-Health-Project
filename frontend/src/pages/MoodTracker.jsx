import { useEffect, useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { api } from "../utils/api.js";
import EmptyState from "../components/EmptyState.jsx";

const TYPES = [
  { value: "happy", label: "Happy" },
  { value: "sad", label: "Sad" },
  { value: "anxious", label: "Anxious" },
  { value: "stressed", label: "Stressed" },
];

export default function MoodTracker() {
  const [moodType, setMoodType] = useState("happy");
  const [score, setScore] = useState(5);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");
  const [moods, setMoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [analysisErr, setAnalysisErr] = useState("");
  /** When journal has text, mood type may only come from NLP after Analyze. */
  const [nlpMoodReady, setNlpMoodReady] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api("/api/moods");
      setMoods(data.moods || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const chartData = useMemo(() => {
    const sorted = [...moods].sort((a, b) => new Date(a.date) - new Date(b.date));
    return sorted.slice(-30).map((m) => ({
      date: new Date(m.date).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      score: m.score,
      type: m.moodType,
    }));
  }, [moods]);

  const avg =
    moods.length > 0
      ? Math.round((moods.reduce((s, m) => s + m.score, 0) / moods.length) * 10) / 10
      : null;

  const moodLabel = TYPES.find((t) => t.value === moodType)?.label ?? moodType;

  const runNlpAnalyze = async () => {
    const trimmed = note.trim();
    if (!trimmed) {
      setAnalysisErr("Write something in the journal box first.");
      return;
    }
    setAnalyzing(true);
    setAnalysisErr("");
    setAnalysis(null);
    setNlpMoodReady(false);
    try {
      const data = await api("/api/moods/analyze", { method: "POST", body: { note: trimmed } });
      setAnalysis(data);
      if (data.suggestion) {
        setMoodType(data.suggestion.moodType);
        setScore(data.suggestion.score);
        setNlpMoodReady(true);
      }
      if (!data.suggestion && data.message) {
        const extra = data.hint ? ` ${data.hint}` : "";
        setAnalysisErr(`${data.message}${extra}`);
      }
    } catch (err) {
      setAnalysisErr(err.message || "Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    const trimmedNote = note.trim();
    if (trimmedNote && !nlpMoodReady) {
      setError("Analyze journal (NLP) first so mood and score come from your text.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await api("/api/moods", {
        method: "POST",
        body: { moodType, score: Number(score), date, note },
      });
      setNote("");
      setMoodType("happy");
      setScore(5);
      setAnalysis(null);
      setAnalysisErr("");
      setNlpMoodReady(false);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold text-white">Mood Tracker</h1>
        <p className="text-sm text-mc-muted">Log how you feel and see patterns over time.</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <form
          id="mood-tracker-form"
          onSubmit={submit}
          className="space-y-4 rounded-xl border border-white/5 bg-mc-card p-6 shadow-lg"
        >
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <h2 className="text-sm font-semibold text-white">How are you feeling?</h2>
            <p className="mt-1 text-xs text-mc-muted">
              Write freely, tap Analyze, and your mood and score update automatically — then save.
            </p>
            <textarea
              value={note}
              onChange={(e) => {
                const v = e.target.value;
                setNote(v);
                setAnalysis(null);
                setAnalysisErr("");
                setNlpMoodReady(false);
                if (!v.trim()) {
                  setMoodType("happy");
                  setScore(5);
                }
              }}
              rows={4}
              placeholder="Example: I feel anxious about exams… my heart feels heavy…"
              className="mt-3 w-full resize-none rounded-2xl border border-white/10 bg-mc-bg px-4 py-3 text-sm text-white outline-none ring-mc-accent focus:ring-2"
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={runNlpAnalyze}
                disabled={analyzing || !note.trim()}
                className="rounded-xl border border-mc-accent/40 bg-mc-accent/15 px-4 py-2 text-sm font-medium text-mc-accent hover:bg-mc-accent/25 disabled:opacity-40"
              >
                {analyzing ? "Analyzing…" : "Analyze journal (NLP)"}
              </button>
            </div>
            {analysisErr && <p className="mt-2 text-sm text-amber-200/90">{analysisErr}</p>}
            {analysis?.suggestion?.nlp?.source === "model" && (
              <div className="mt-3 rounded-xl border border-white/10 bg-mc-bg/80 px-3 py-2 text-xs text-mc-muted">
                <p className="font-semibold text-white/90">Model output</p>
                <p className="mt-1">
                  Label:{" "}
                  <span className="text-mc-accent">{analysis.suggestion.nlp.predictedStatus}</span>
                  {" · "}
                  Confidence: {analysis.suggestion.nlp.confidence}%
                </p>
                <p className="mt-1 text-mc-muted">
                  Tracker uses this <strong className="text-white/90">label</strong> as mood. Score{" "}
                  <span className="text-white">{analysis.suggestion.score}/10</span> is a fixed chart
                  value for that category (not from model confidence).
                </p>
              </div>
            )}
            {analysis?.suggestion?.nlp?.source === "keyword" && (
              <p className="mt-2 text-xs text-mc-muted">
                NLP model unavailable; used keyword hints instead
                {analysis.suggestion.nlp.nlpError ? ` (${analysis.suggestion.nlp.nlpError})` : ""}.
                Mood and score were updated automatically.
              </p>
            )}
            {analysis?.suggestion?.flagsCrisis && (
              <div className="mt-3 rounded-xl border border-red-400/30 bg-red-950/40 px-3 py-2 text-sm text-red-100">
                <p className="font-semibold">If you’re in immediate danger, contact local emergency
                services or a crisis line right away. You deserve support.</p>
              </div>
            )}
          </div>

          <h2 className="text-sm font-semibold text-white">Log mood</h2>
          {error && <p className="text-sm text-red-300">{error}</p>}
          <div className="rounded-xl border border-white/10 bg-mc-bg/50 px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-mc-muted">
              Mood and score (from NLP)
            </p>
            <div className="mt-3 flex flex-wrap gap-x-8 gap-y-2">
              <div>
                <p className="text-[11px] uppercase tracking-wide text-mc-muted">Mood</p>
                <p className="text-lg font-semibold text-white">
                  {note.trim()
                    ? nlpMoodReady
                      ? moodLabel
                      : "—"
                    : moodLabel}
                </p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wide text-mc-muted">Score</p>
                <p className="text-lg font-semibold text-mc-accent">
                  {note.trim()
                    ? nlpMoodReady
                      ? `${score} / 10`
                      : "—"
                    : `${score} / 10`}
                </p>
              </div>
            </div>
            <p className="mt-3 text-xs text-mc-muted">
              {note.trim()
                ? nlpMoodReady
                  ? "Mood is the model label (e.g. Anxiety, Normal). Edit the note and analyze again to change it, then Save mood below."
                  : "Write a journal note, then tap Analyze journal (NLP)."
                : "No journal text — saving uses a neutral placeholder (Happy · 5/10). Add a note and analyze for real NLP values."}
            </p>
          </div>
          <div>
            <label className="mb-1 block text-xs text-mc-muted">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-mc-bg px-4 py-2.5 text-white"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-xl bg-mc-accent py-3 font-medium text-mc-bg hover:bg-green-400 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save mood"}
          </button>
        </form>

        <div className="rounded-xl border border-white/5 bg-mc-card p-6 shadow-lg">
          <h2 className="text-sm font-semibold text-white">Summary</h2>
          <p className="mt-4 text-3xl font-semibold text-mc-accent">{avg != null ? `${avg} / 10` : "—"}</p>
          <p className="text-sm text-mc-muted">Average mood score</p>
          <p className="mt-4 text-sm text-mc-muted">{moods.length} total entries</p>
        </div>
      </div>

      <div className="rounded-xl border border-white/5 bg-mc-card p-6 shadow-lg">
        <h2 className="mb-4 text-sm font-semibold text-white">Mood history</h2>
        {loading ? (
          <p className="text-mc-muted">Loading…</p>
        ) : moods.length === 0 ? (
          <EmptyState title="No moods logged" description="Add your first entry using the form." />
        ) : (
          <div className="space-y-6">
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                  <YAxis domain={[0, 10]} tick={{ fill: "#94a3b8", fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      background: "#0f2a1d",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "8px",
                    }}
                  />
                  <Line type="monotone" dataKey="score" stroke="#22c55e" strokeWidth={2} dot />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
              <h3 className="text-sm font-semibold text-white">Recent notes</h3>
              <div className="mt-4 space-y-3">
                {moods
                  .filter((m) => m.note && String(m.note).trim())
                  .slice(0, 5)
                  .map((m) => (
                    <div key={m.id} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-mc-muted">
                          {new Date(m.date).toLocaleString()} · {m.moodType} · {m.score}/10
                        </p>
                        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/85">
                          {m.nlpSource === "model" ? "NLP model" : m.source || "manual"}
                        </span>
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-white/85">{m.note}</p>
                    </div>
                  ))}
                {moods.filter((m) => m.note && String(m.note).trim()).length === 0 && (
                  <p className="text-sm text-mc-muted">No notes yet. Write in “How are you feeling?” and save.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
