import { Link } from "react-router-dom";

const content = {
  good: {
    title: "Your mental health looks good.",
    message: "Keep maintaining a healthy lifestyle and positive mindset.",
    lines: [
      "Small daily habits are building real resilience.",
      "Stay connected with people who make you feel supported.",
      "Keep making time for rest, movement, and reflection.",
    ],
    accent: "text-green-300",
  },
  medium: {
    title: "You might be experiencing some stress.",
    message: "We recommend trying some exercises.",
    lines: ["A few guided practices can help you reset.", "Start with a short breathing or mindfulness exercise."],
    accent: "text-yellow-300",
  },
  critical: {
    title: "We recommend talking to a counsellor.",
    message: "A request has been created so a counsellor can support you.",
    lines: ["You are not alone in this.", "A calm next step is already ready for you."],
    accent: "text-red-300",
  },
};

export default function AssessmentResult({ assessment, onRetake }) {
  if (!assessment) return null;
  const result = content[assessment.status] || content.medium;
  const possibleIssues = Array.isArray(assessment.possibleIssues) ? assessment.possibleIssues : [];

  return (
    <section className="rounded-2xl border border-white/5 bg-mc-card p-6 shadow-xl">
      <p className="text-sm text-mc-muted">Assessment score</p>
      <div className="mt-2 flex flex-wrap items-end gap-3">
        <span className={`text-5xl font-semibold ${result.accent}`}>{assessment.score}</span>
        <span className="pb-2 text-sm uppercase tracking-[0.25em] text-mc-muted">{assessment.status}</span>
      </div>
      <h2 className="mt-6 text-2xl font-semibold text-white">{result.title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-mc-muted">{result.message}</p>
      <div className="mt-5 grid gap-3">
        {result.lines.map((line) => (
          <p key={line} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/85">
            {line}
          </p>
        ))}
      </div>
      {assessment.status === "critical" && (
        <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-5">
          <h3 className="text-sm font-semibold text-white">You may be experiencing symptoms related to</h3>
          <p className="mt-2 text-xs leading-relaxed text-mc-muted">
            This is an educational hint (not a medical diagnosis). A counsellor can help you understand your situation better.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {(possibleIssues.length ? possibleIssues : ["Anxiety Disorders (GAD)", "Panic Disorder", "PTSD"]).map((x) => (
              <span key={x} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/85">
                {x}
              </span>
            ))}
          </div>
        </div>
      )}
      <div className="mt-6 flex flex-wrap items-center gap-2">
        {typeof onRetake === "function" && (
          <button
            type="button"
            onClick={onRetake}
            className="inline-flex rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Retake assessment
          </button>
        )}
      {assessment.status === "medium" && (
        <Link
          to="/exercise"
          className="inline-flex rounded-xl bg-mc-accent px-4 py-2 text-sm font-semibold text-mc-bg transition hover:bg-green-400"
        >
          Go to exercises
        </Link>
      )}
      {assessment.status === "critical" && (
        <Link
          to="/counsellor-request"
          className="inline-flex rounded-xl bg-mc-accent px-4 py-2 text-sm font-semibold text-mc-bg transition hover:bg-green-400"
        >
          View counsellor request
        </Link>
      )}
      </div>
    </section>
  );
}
