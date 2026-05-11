/**
 * NLP model outputs 7 dataset labels. We store that label as moodType (not happy/sad mapping).
 * Score is a fixed chart-friendly value per label only — not derived from confidence.
 */
export const NLP_MODEL_LABELS = [
  "Depression",
  "Suicidal",
  "Personality Disorder",
  "Stress",
  "Normal",
  "Bi-Polar",
  "Anxiety",
];

const LABEL_SCORE = {
  Normal: 8,
  Stress: 5,
  Anxiety: 4,
  Depression: 3,
  Suicidal: 2,
  "Bi-Polar": 5,
  "Personality Disorder": 4,
};

export function isNlpModelLabel(value) {
  return NLP_MODEL_LABELS.includes(value);
}

/** Fixed 1–10 score for charts/history from label only (no confidence). */
export function scoreForNlpLabel(predictedStatus) {
  const s = LABEL_SCORE[predictedStatus];
  return s != null ? s : 5;
}

export function buildModelSuggestion(predictedStatus, confidence, allProbabilities) {
  return {
    moodType: predictedStatus,
    score: scoreForNlpLabel(predictedStatus),
    flagsCrisis: predictedStatus === "Suicidal",
    nlp: {
      source: "model",
      predictedStatus,
      confidence,
      allProbabilities: allProbabilities ?? null,
    },
  };
}
