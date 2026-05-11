import { useState } from "react";
import { motion } from "framer-motion";

const MotionDiv = motion.div;

const questions = [
  "How often do you feel anxious?",
  "How is your sleep quality?",
  "Do you feel overwhelmed?",
  "Do you enjoy daily activities?",
  "Do you feel lonely?",
  "How are your energy levels?",
  "How is your focus level?",
  "How is your stress level?",
  "How is your motivation level?",
  "How emotionally stable do you feel?",
];

export default function AssessmentForm({ onSubmit, loading }) {
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState(Array(questions.length).fill(null));
  const progress = ((current + 1) / questions.length) * 100;
  const selected = answers[current];
  const isLast = current === questions.length - 1;

  const selectAnswer = (value) => {
    setAnswers((prev) => prev.map((answer, index) => (index === current ? value : answer)));
  };

  const next = () => {
    if (!isLast) setCurrent((value) => value + 1);
  };

  const submit = (event) => {
    event.preventDefault();
    if (answers.some((answer) => answer == null)) return;
    onSubmit(answers);
  };

  return (
    <form onSubmit={submit} className="rounded-2xl border border-white/5 bg-mc-card p-6 shadow-xl">
      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium text-white">Mental Health Assessment</span>
          <span className="text-mc-muted">{current + 1}/10</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-mc-accent transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <MotionDiv
        key={current}
        initial={{ opacity: 0, x: 18 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.22 }}
        className="space-y-5"
      >
        <h2 className="text-xl font-semibold text-white">{questions[current]}</h2>
        <div className="grid grid-cols-5 gap-2">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => selectAnswer(value)}
              className={`rounded-2xl border px-3 py-4 text-sm font-semibold transition ${
                selected === value
                  ? "border-mc-accent bg-mc-accent text-mc-bg shadow-lg"
                  : "border-white/10 bg-white/5 text-white hover:border-mc-accent/40"
              }`}
            >
              {value}
            </button>
          ))}
        </div>
        <div className="flex justify-between text-xs text-mc-muted">
          <span>Low</span>
          <span>High</span>
        </div>
      </MotionDiv>

      <div className="mt-8 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setCurrent((value) => Math.max(0, value - 1))}
          disabled={current === 0 || loading}
          className="rounded-xl border border-white/10 px-4 py-2 text-sm text-white transition hover:bg-white/5 disabled:opacity-40"
        >
          Back
        </button>
        {isLast ? (
          <button
            type="submit"
            disabled={loading || answers.some((answer) => answer == null)}
            className="rounded-xl bg-mc-accent px-5 py-2.5 text-sm font-semibold text-mc-bg transition hover:bg-green-400 disabled:opacity-50"
          >
            {loading ? "Calculating..." : "Submit Assessment"}
          </button>
        ) : (
          <button
            type="button"
            onClick={next}
            disabled={selected == null || loading}
            className="rounded-xl bg-mc-accent px-5 py-2.5 text-sm font-semibold text-mc-bg transition hover:bg-green-400 disabled:opacity-50"
          >
            Next
          </button>
        )}
      </div>
    </form>
  );
}
