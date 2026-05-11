import { getDb, newId, nowIso, updateDb } from "../storage/fileDb.js";

function classifyScore(score) {
  if (score >= 40) return "good";
  if (score >= 25) return "medium";
  return "critical";
}

function possibleIssuesFromAnswers(answers) {
  // IMPORTANT: This is NOT a diagnosis. It's a lightweight hint list for "critical" scores.
  // Assumption: scale 1-5 where higher = better wellbeing (since 40-50 is classified GOOD).
  const low = (idx) => answers[idx] != null && answers[idx] <= 2; // 0-based
  const issues = new Set();

  if (low(0) || low(7)) issues.add("Anxiety Disorders (GAD)");
  if (low(1) && low(0)) issues.add("Panic Disorder");
  if (low(9)) issues.add("Bipolar Disorder");
  if (low(7) && low(1)) issues.add("Post‑Traumatic Stress Disorder (PTSD)");
  if (low(6) && low(2)) issues.add("Obsessive‑Compulsive Disorder (OCD)");
  if (low(9) && low(6)) issues.add("Schizophrenia");
  if (low(5) && low(3)) issues.add("Eating Disorders");
  if (low(4) || low(9)) issues.add("Personality Disorders");
  if (low(5) && low(8)) issues.add("Substance Use Disorders");

  const ordered = [
    "Anxiety Disorders (GAD)",
    "Panic Disorder",
    "Bipolar Disorder",
    "Post‑Traumatic Stress Disorder (PTSD)",
    "Obsessive‑Compulsive Disorder (OCD)",
    "Schizophrenia",
    "Eating Disorders",
    "Personality Disorders",
    "Substance Use Disorders",
  ];

  return ordered.filter((x) => issues.has(x)).slice(0, 4);
}

export async function latestAssessment(req, res) {
  try {
    const db = await getDb();
    const assessment = db.assessments
      .filter((a) => a.userId === req.userId)
      .sort((a, b) => new Date(b.date) - new Date(a.date))[0] || null;
    res.json({ assessment });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not load assessment" });
  }
}

export async function assessmentHistory(req, res) {
  try {
    const db = await getDb();
    const history = db.assessments
      .filter((a) => a.userId === req.userId)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    res.json({ history });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not load assessment history" });
  }
}

export async function myConsultRequest(req, res) {
  try {
    const db = await getDb();
    const request =
      db.consultRequests
        .filter((r) => r.userId === req.userId)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0] || null;
    if (!request) {
      return res.json({ request: null });
    }

    const consultant =
      request.consultantId != null
        ? db.users
            .map((u) => {
              const { password, ...rest } = u;
              return rest;
            })
            .find((u) => u.id === request.consultantId && u.role === "consultant") || null
        : null;

    res.json({
      request: {
        ...request,
        consultant,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not load consultant request" });
  }
}

export async function submitAssessment(req, res) {
  try {
    const { answers } = req.body;
    if (!Array.isArray(answers) || answers.length !== 10) {
      return res.status(400).json({ message: "Exactly 10 answers are required" });
    }

    const normalized = answers.map(Number);
    const valid = normalized.every((answer) => Number.isInteger(answer) && answer >= 1 && answer <= 5);
    if (!valid) {
      return res.status(400).json({ message: "Each answer must be a number from 1 to 5" });
    }

    const score = normalized.reduce((total, answer) => total + answer, 0);
    const status = classifyScore(score);
    const possibleIssues = status === "critical" ? possibleIssuesFromAnswers(normalized) : [];
    const assessment = {
      id: newId("asm"),
      userId: req.userId,
      answers: normalized,
      score,
      status,
      possibleIssues,
      date: nowIso(),
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    await updateDb((draft) => {
      draft.assessments.push(assessment);
      return draft;
    });

    let consultRequest = null;
    if (status === "critical") {
      await updateDb((draft) => {
        const existing = draft.consultRequests.find(
          (r) => r.userId === req.userId && (r.status === "pending" || r.status === "accepted")
        );
        if (existing) {
          consultRequest = existing;
          return draft;
        }
        consultRequest = {
          id: newId("req"),
          userId: req.userId,
          status: "pending",
          consultantId: null,
          createdAt: nowIso(),
          updatedAt: nowIso(),
        };
        draft.consultRequests.push(consultRequest);
        return draft;
      });
    }

    res.status(201).json({ assessment, consultRequest });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not save assessment" });
  }
}
