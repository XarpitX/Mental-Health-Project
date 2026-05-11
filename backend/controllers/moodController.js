import { getDb, newId, nowIso, updateDb } from "../storage/fileDb.js";
import { inferMoodFromText } from "../utils/moodFromText.js";
import { buildModelSuggestion, NLP_MODEL_LABELS } from "../utils/nlpMoodMapper.js";
import { runNlpPredict } from "../utils/nlpPredict.js";

function hintWhenModelFails(raw) {
  if (!raw || raw.ok) return null;
  if (raw.error === "model_missing") {
    return "NLP model file is missing. From the repo root run: .\\.venv-ml\\Scripts\\python.exe backend\\ml\\train.py (or train after pip install -r backend/ml/requirements.txt).";
  }
  if (raw.error === "spawn_failed") {
    return "Python could not be started. Install Python 3 or set MOOD_NLP_PYTHON in backend/.env to your .venv-ml\\Scripts\\python.exe path.";
  }
  if (raw.error === "python_exit" || raw.error === "bad_output") {
    const tail = raw.stderr ? ` Details: ${String(raw.stderr).slice(0, 200)}` : "";
    return `The NLP script failed (${raw.error}). Use the same venv you trained with, or set MOOD_NLP_PYTHON.${tail}`;
  }
  if (raw.error === "timeout") {
    return "NLP analysis timed out. Try a shorter note or restart the backend.";
  }
  return raw.hint || null;
}

async function resolveJournalInference(noteTrimmed) {
  const raw = await runNlpPredict(noteTrimmed);
  if (raw.ok && raw.predicted_status != null) {
    const suggestion = buildModelSuggestion(
      raw.predicted_status,
      raw.confidence,
      raw.all_probabilities
    );
    return {
      suggestion,
      modelHint: null,
      modelRaw: raw,
    };
  }
  const inferred = inferMoodFromText(noteTrimmed);
  if (inferred) {
    return {
      suggestion: {
        moodType: inferred.moodType,
        score: inferred.score,
        flagsCrisis: false,
        nlp: {
          source: "keyword",
          predictedStatus: null,
          confidence: null,
          allProbabilities: null,
          nlpError: raw.error ?? null,
        },
      },
      modelHint: hintWhenModelFails(raw),
      modelRaw: raw,
    };
  }
  return {
    suggestion: null,
    modelHint: hintWhenModelFails(raw),
    modelRaw: raw,
  };
}

async function suggestFromJournalText(noteTrimmed) {
  const { suggestion } = await resolveJournalInference(noteTrimmed);
  return suggestion;
}

export async function analyzeMoodFromNote(req, res) {
  try {
    const note = typeof req.body?.note === "string" ? req.body.note.trim() : "";
    if (!note) {
      return res.status(400).json({ message: "note is required" });
    }
    const { suggestion, modelHint } = await resolveJournalInference(note);
    if (!suggestion) {
      return res.json({
        ok: true,
        suggestion: null,
        message:
          "Could not infer mood from text. Write a bit more detail or check that the NLP model is installed.",
        hint:
          modelHint ||
          "The ML model did not return a label and your text did not match simple keyword rules (words like anxious, stressed, sad, happy). Try a sentence closer to how you speak, or install/fix Python for the model.",
      });
    }
    res.json({ ok: true, suggestion });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Analysis failed" });
  }
}

export async function createMood(req, res) {
  try {
    const { moodType, score, date, note } = req.body;
    const hasText = typeof note === "string" && note.trim().length > 0;
    let resolvedMoodType = moodType;
    let resolvedScore = score;
    let nlpPredictedStatus = "";
    let nlpConfidence = null;
    let nlpSource = "";
    let nlpFlagsCrisis = false;

    if (hasText) {
      const suggestion = await suggestFromJournalText(note.trim());
      if (suggestion) {
        if (!resolvedMoodType || resolvedScore == null) {
          resolvedMoodType = resolvedMoodType || suggestion.moodType;
          resolvedScore = resolvedScore ?? suggestion.score;
        }
        nlpPredictedStatus = suggestion.nlp.predictedStatus || "";
        nlpConfidence = suggestion.nlp.confidence;
        nlpSource = suggestion.nlp.source;
        nlpFlagsCrisis = suggestion.flagsCrisis;
      }
    }

    if (!resolvedMoodType || resolvedScore == null) {
      return res.status(400).json({ message: "moodType and score are required (or provide note text)" });
    }
    const allowed = ["happy", "sad", "anxious", "stressed", ...NLP_MODEL_LABELS];
    if (!allowed.includes(resolvedMoodType)) {
      return res.status(400).json({ message: "Invalid moodType" });
    }
    const n = Number(resolvedScore);
    if (Number.isNaN(n) || n < 1 || n > 10) {
      return res.status(400).json({ message: "score must be 1–10" });
    }
    const mood = {
      id: newId("mood"),
      userId: req.userId,
      moodType: resolvedMoodType,
      score: n,
      date: date ? new Date(date).toISOString() : nowIso(),
      note: hasText ? note.trim().slice(0, 2000) : "",
      source: hasText ? "journal" : "manual",
      nlpPredictedStatus: nlpPredictedStatus || undefined,
      nlpConfidence: nlpConfidence != null ? nlpConfidence : undefined,
      nlpSource: nlpSource || undefined,
      nlpFlagsCrisis: nlpFlagsCrisis || undefined,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    await updateDb((draft) => {
      draft.moods.push(mood);
      return draft;
    });
    res.status(201).json({ mood });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not save mood" });
  }
}

export async function listMoods(req, res) {
  try {
    const db = await getDb();
    const moods = db.moods
      .filter((m) => m.userId === req.userId)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 200);
    res.json({ moods });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not load moods" });
  }
}

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function countConsecutiveDays(sortedDatesDesc) {
  if (!sortedDatesDesc.length) return 0;
  const set = new Set(sortedDatesDesc.map((d) => startOfDay(d).getTime()));
  let streak = 0;
  let cursor = startOfDay(new Date());
  while (set.has(cursor.getTime())) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export async function dashboardStats(req, res) {
  try {
    const userId = req.userId;
    const db = await getDb();
    const moods = db.moods
      .filter((m) => m.userId === userId)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    const chatCount = db.chats.filter((c) => c.userId === userId).length;

    const scores = moods.map((m) => m.score);
    const avgMood =
      scores.length > 0 ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 : null;

    const last30 = new Date();
    last30.setDate(last30.getDate() - 30);
    const moods30 = moods.filter((m) => new Date(m.date) >= last30);

    const byDay = [0, 0, 0, 0, 0, 0, 0];
    const counts = [0, 0, 0, 0, 0, 0, 0];
    for (const m of moods30) {
      const dow = new Date(m.date).getDay();
      const idx = dow === 0 ? 6 : dow - 1;
      byDay[idx] += m.score;
      counts[idx] += 1;
    }
    const barData = byDay.map((sum, i) => ({
      day: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i],
      avg: counts[i] ? Math.round((sum / counts[i]) * 10) / 10 : 0,
    }));

    const lineMap = new Map();
    for (const m of moods30) {
      const key = startOfDay(m.date).toISOString().slice(0, 10);
      if (!lineMap.has(key)) lineMap.set(key, []);
      lineMap.get(key).push(m.score);
    }
    const lineData = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = startOfDay(d).toISOString().slice(0, 10);
      const arr = lineMap.get(key);
      lineData.push({
        date: key,
        score: arr ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10 : null,
      });
    }

    const allDates = moods.map((m) => new Date(m.date));
    allDates.sort((a, b) => b - a);
    const streak = countConsecutiveDays(allDates);

    const recentMood = moods.length
      ? {
          moodType: moods[0].moodType,
          score: moods[0].score,
          date: moods[0].date,
        }
      : null;

    const activityDays = 14;
    const heatmap = [];
    for (let i = activityDays - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = startOfDay(d).toISOString().slice(0, 10);
      const dayMoods = moods30.filter((m) => startOfDay(m.date).toISOString().slice(0, 10) === key);
      const intensity =
        dayMoods.length === 0
          ? 0
          : Math.min(4, Math.ceil(dayMoods.reduce((s, m) => s + m.score, 0) / dayMoods.length / 2.5));
      heatmap.push({ date: key, intensity, count: dayMoods.length });
    }

    res.json({
      totalConversations: chatCount,
      avgMoodScore: avgMood,
      dailyStreak: streak,
      recentMood,
      lineData,
      barData,
      heatmap,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not load dashboard" });
  }
}
