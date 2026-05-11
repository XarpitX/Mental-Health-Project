/**
 * Basic keyword-based mood inference from chat text.
 * Returns { moodType, score } or null if no strong signal.
 */
export function inferMoodFromText(text) {
  const lower = text.toLowerCase();
  const anxious =
    /\b(anxious|anxiety|panic|worried|nervous|on edge|restless)\b/.test(lower);
  const stressed =
    /\b(stressed|stress|overwhelmed|burnout|pressure|too much)\b/.test(lower);
  const sad =
    /\b(sad|depressed|hopeless|empty|lonely|cry|crying|grief)\b/.test(lower);
  const happy =
    /\b(happy|grateful|great|better|good mood|excited|relieved)\b/.test(lower);

  if (happy && !sad && !anxious && !stressed) {
    return { moodType: "happy", score: 8 };
  }
  if (anxious) {
    return { moodType: "anxious", score: 4 };
  }
  if (stressed) {
    return { moodType: "stressed", score: 4 };
  }
  if (sad) {
    return { moodType: "sad", score: 3 };
  }
  return null;
}
