import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ExerciseGuide from "./ExerciseGuide.jsx";

export default function ExerciseModal({ open, exercise, onClose }) {
  const [mode, setMode] = useState("details"); // details | guide

  useEffect(() => {
    if (!open) return;
    setMode("details");
  }, [open, exercise?.id]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const steps = useMemo(() => exercise?.steps || [], [exercise]);

  return (
    <AnimatePresence>
      {open && exercise && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button
            type="button"
            aria-label="Close exercise"
            className="absolute inset-0 bg-black/70"
            onClick={onClose}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            className="relative z-[61] w-full max-w-2xl overflow-hidden rounded-3xl border border-white/10 bg-mc-card shadow-[0_30px_120px_rgba(0,0,0,0.75)] backdrop-blur-xl"
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            <div className="flex items-start justify-between gap-3 border-b border-white/10 px-6 py-5">
              <div>
                <h2 className="text-xl font-semibold text-white">{exercise.title}</h2>
                <p className="mt-1 text-sm text-mc-muted">{exercise.description}</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white hover:bg-white/10"
              >
                ✕
              </button>
            </div>

            <div className="space-y-5 px-6 py-6">
              {mode === "guide" ? (
                <ExerciseGuide exercise={exercise} onExit={() => setMode("details")} autoAdvanceMs={7000} />
              ) : (
                <>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-mc-muted">
                      {exercise.category}
                    </span>
                    <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-mc-muted">
                      {exercise.duration}
                    </span>
                    <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-mc-muted">
                      {exercise.difficulty}
                    </span>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                    <h3 className="text-sm font-semibold text-white">Step-by-step</h3>
                    <ol className="mt-3 space-y-2 text-sm text-white/90">
                      {steps.map((s, i) => (
                        <li key={`${exercise.id}-${i}`} className="flex gap-3">
                          <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-mc-accent/15 text-xs font-semibold text-mc-accent">
                            {i + 1}
                          </span>
                          <span className="leading-relaxed">{s}</span>
                        </li>
                      ))}
                    </ol>
                  </div>

                  {exercise.tips && (
                    <div className="rounded-2xl border border-white/10 bg-[#14213D] p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-mc-muted/80">Tip</p>
                      <p className="mt-1 text-sm text-white/90">{exercise.tips}</p>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10"
                    >
                      Close
                    </button>
                    <button
                      type="button"
                      onClick={() => setMode("guide")}
                      className="mc-btn rounded-xl px-5 py-2.5 text-sm font-semibold"
                    >
                      Start exercise
                    </button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

