import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

export default function ExerciseGuide({
  exercise,
  onExit,
  autoAdvance = false,
  autoAdvanceMs = 7000,
}) {
  const steps = useMemo(() => exercise?.steps || [], [exercise]);
  const total = steps.length;
  const [idx, setIdx] = useState(0);
  const [running, setRunning] = useState(Boolean(autoAdvance));

  useEffect(() => {
    setIdx(0);
    setRunning(Boolean(autoAdvance));
  }, [exercise?.id, autoAdvance]);

  useEffect(() => {
    if (!running) return;
    if (total <= 1) return;
    if (idx >= total - 1) return;
    const t = setTimeout(() => setIdx((i) => clamp(i + 1, 0, total - 1)), autoAdvanceMs);
    return () => clearTimeout(t);
  }, [running, idx, total, autoAdvanceMs]);

  if (!exercise) return null;

  const current = steps[idx] || "";
  const progress = total ? Math.round(((idx + 1) / total) * 100) : 0;
  const done = total ? idx === total - 1 : true;

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-white">{exercise.title}</h3>
          <p className="mt-1 text-sm text-mc-muted">
            Step {total ? idx + 1 : 0}/{total || 0}
          </p>
        </div>
        <button
          type="button"
          onClick={onExit}
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white hover:bg-white/10"
        >
          Exit
        </button>
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-mc-accent transition-[width] duration-300" style={{ width: `${progress}%` }} />
      </div>

      <motion.div
        key={`${exercise.id}-${idx}`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        className="rounded-2xl border border-white/10 bg-black/20 p-5"
      >
        <p className="text-base leading-relaxed text-white">{current}</p>
      </motion.div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIdx((i) => clamp(i - 1, 0, total - 1))}
            disabled={idx === 0}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white disabled:opacity-40 hover:bg-white/10"
          >
            Back
          </button>
          <button
            type="button"
            onClick={() => {
              if (done) {
                onExit?.();
                return;
              }
              setIdx((i) => clamp(i + 1, 0, total - 1));
            }}
            className="rounded-xl bg-mc-accent px-4 py-2 text-sm font-medium text-mc-bg disabled:opacity-40 hover:bg-green-400"
          >
            {done ? "Done" : "Next step"}
          </button>
        </div>

        {total > 1 && (
          <div className="flex items-center gap-2">
            <label className="text-xs text-mc-muted">Auto-advance</label>
            <button
              type="button"
              onClick={() => setRunning((r) => !r)}
              className={`rounded-full border px-3 py-1 text-xs transition ${
                running
                  ? "border-mc-accent/50 bg-mc-accent/15 text-mc-accent"
                  : "border-white/10 bg-white/5 text-white hover:bg-white/10"
              }`}
            >
              {running ? `On (${Math.round(autoAdvanceMs / 1000)}s)` : "Off"}
            </button>
          </div>
        )}
      </div>

      {exercise.tips && (
        <div className="rounded-2xl border border-white/10 bg-[#14213D] p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-mc-muted/80">Tip</p>
          <p className="mt-1 text-sm text-white/90">{exercise.tips}</p>
        </div>
      )}
    </div>
  );
}

