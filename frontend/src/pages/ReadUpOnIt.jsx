import { useMemo, useState } from "react";
import { readUpArticles } from "../data/readUpArticles.js";

function Chip({ children, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
        active ? "border-mc-accent bg-mc-accent text-mc-bg" : "border-white/10 bg-white/5 text-white hover:bg-white/10"
      }`}
    >
      {children}
    </button>
  );
}

function Modal({ open, onClose, article }) {
  if (!open || !article) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-3xl overflow-hidden rounded-3xl border border-white/10 bg-black/30 shadow-[0_30px_120px_rgba(0,0,0,0.7)]">
        <div className="border-b border-white/10 bg-black/40 px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-mc-muted">
                {article.type === "disease" ? "Mental health article" : "Self motivational"}
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-white">{article.title}</h2>
              <p className="mt-2 text-sm text-mc-muted">{article.tagline}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Close
            </button>
          </div>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-6 py-6">
          <div className="flex flex-wrap gap-2">
            {(article.topics || []).map((t) => (
              <span key={t} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/85">
                {t}
              </span>
            ))}
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/85">
              {article.readTime}
            </span>
          </div>
          <div className="mt-6 space-y-4 text-sm leading-relaxed text-white/85">
            {article.content.map((para) => (
              <p key={para} className="whitespace-pre-line">
                {para}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ReadUpOnIt() {
  const [tab, setTab] = useState("all"); // all | disease | motivation
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(null);

  const selected = useMemo(
    () => readUpArticles.find((a) => a.id === selectedId) || null,
    [selectedId]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return readUpArticles.filter((a) => {
      if (tab !== "all" && a.type !== tab) return false;
      if (!q) return true;
      const hay = `${a.title} ${a.tagline} ${(a.topics || []).join(" ")}`.toLowerCase();
      return hay.includes(q);
    });
  }, [query, tab]);

  const diseaseCount = readUpArticles.filter((a) => a.type === "disease").length;
  const motivationCount = readUpArticles.filter((a) => a.type === "motivation").length;

  return (
    <div className="space-y-10">
      <header className="mc-gradient-border rounded-3xl">
        <div className="mc-glass-strong rounded-3xl px-6 py-6 sm:px-8 sm:py-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-mc-muted">Read up on it</p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">
                Articles for clarity, awareness, and calm
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-mc-muted">
                Learn about common mental health conditions and read short motivational pieces to reset your mindset.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/85">
                  {diseaseCount} condition articles
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/85">
                  {motivationCount} motivational reads
                </span>
              </div>
            </div>
            <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-black/20 p-4">
              <label className="text-xs font-semibold uppercase tracking-[0.22em] text-mc-muted">Search</label>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Try: anxiety, OCD, sleep, habits..."
                className="mt-2 w-full rounded-xl border border-white/10 bg-mc-bg px-4 py-2.5 text-sm text-white outline-none ring-mc-accent focus:ring-2"
              />
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-wrap gap-2">
        <Chip active={tab === "all"} onClick={() => setTab("all")}>
          All
        </Chip>
        <Chip active={tab === "disease"} onClick={() => setTab("disease")}>
          Mental conditions
        </Chip>
        <Chip active={tab === "motivation"} onClick={() => setTab("motivation")}>
          Self‑motivational
        </Chip>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((article) => (
          <button
            key={article.id}
            type="button"
            onClick={() => setSelectedId(article.id)}
            className="group rounded-3xl border border-white/10 bg-black/20 p-6 text-left shadow-xl transition hover:border-mc-accent/30 hover:bg-black/30"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-mc-muted">
                  {article.type === "disease" ? "Condition" : "Motivation"} · {article.readTime}
                </p>
                <h2 className="mt-3 text-lg font-semibold text-white group-hover:text-mc-accent">{article.title}</h2>
              </div>
              <span
                className={`mt-1 inline-flex h-10 w-10 items-center justify-center rounded-2xl border text-sm font-semibold ${
                  article.type === "disease"
                    ? "border-red-500/20 bg-red-500/10 text-red-300"
                    : "border-mc-accent/20 bg-mc-accent/15 text-mc-accent"
                }`}
              >
                {article.type === "disease" ? "!" : "★"}
              </span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-mc-muted">{article.tagline}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {(article.topics || []).slice(0, 3).map((t) => (
                <span key={t} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/85">
                  {t}
                </span>
              ))}
              {(article.topics || []).length > 3 && (
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/85">
                  +{(article.topics || []).length - 3}
                </span>
              )}
            </div>
          </button>
        ))}
      </section>

      {filtered.length === 0 && (
        <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 px-6 py-12 text-center">
          <h3 className="text-lg font-semibold text-white">No matches</h3>
          <p className="mt-2 text-sm text-mc-muted">Try a different keyword like “panic”, “sleep”, or “habits”.</p>
        </div>
      )}

      <Modal open={Boolean(selected)} article={selected} onClose={() => setSelectedId(null)} />
    </div>
  );
}

