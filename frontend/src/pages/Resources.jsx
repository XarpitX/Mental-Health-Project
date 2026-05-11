import exercises from "../data/exercises.json";
import { useMemo, useState } from "react";
import ExerciseModal from "../components/ExerciseModal.jsx";

const categoryLabel = {
  breathing: "Breathing",
  mindfulness: "Mindfulness",
  cognitive: "Cognitive",
  relaxation: "Relaxation",
  journaling: "Journaling",
};

export default function Resources() {
  const [selectedId, setSelectedId] = useState(null);

  const selected = useMemo(
    () => exercises.find((e) => e.id === selectedId) || null,
    [selectedId]
  );

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold text-white">CBT & wellness exercises</h1>
        <p className="text-sm text-mc-muted">Short practices you can try anytime.</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {exercises.map((ex) => (
          <article
            key={ex.id}
            role="button"
            tabIndex={0}
            onClick={() => setSelectedId(ex.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") setSelectedId(ex.id);
            }}
            className="flex cursor-pointer flex-col rounded-xl border border-white/5 bg-mc-card p-5 shadow-lg transition hover:border-mc-accent/30 hover:shadow-[0_20px_70px_rgba(0,0,0,0.55)] focus:outline-none focus:ring-2 focus:ring-mc-accent/60"
          >
            <div className="mb-3 flex items-start justify-between gap-2">
              <h2 className="text-lg font-semibold text-white">{ex.title}</h2>
              <span className="shrink-0 rounded-full bg-mc-accent/15 px-2 py-0.5 text-xs text-mc-accent">
                {categoryLabel[ex.category] || ex.category}
              </span>
            </div>
            <p className="flex-1 text-sm leading-relaxed text-mc-muted">{ex.description}</p>
            <div className="mt-4 flex gap-3 text-xs text-slate-400">
              <span>{ex.duration}</span>
              <span>·</span>
              <span>{ex.difficulty}</span>
            </div>
          </article>
        ))}
      </div>

      <ExerciseModal
        open={Boolean(selected)}
        exercise={selected}
        onClose={() => setSelectedId(null)}
      />
    </div>
  );
}
