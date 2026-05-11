import { getDb, nowIso, updateDb } from "../storage/fileDb.js";

function latestAssessmentFor(db, userId) {
  return (
    db.assessments
      .filter((a) => a.userId === userId)
      .sort((a, b) => new Date(b.date) - new Date(a.date))[0] || null
  );
}

function serializeRequest(db, request) {
  const user = db.users
    .map((u) => {
      const { password, ...rest } = u;
      return rest;
    })
    .find((u) => u.id === request.userId);

  const consultant =
    request.consultantId != null
      ? db.users
          .map((u) => {
            const { password, ...rest } = u;
            return rest;
          })
          .find((u) => u.id === request.consultantId && u.role === "consultant") || null
      : null;

  return {
    id: request.id,
    status: request.status,
    createdAt: request.createdAt,
    user: user || null,
    consultant,
    assessment: latestAssessmentFor(db, request.userId),
  };
}

export async function listConsultRequests(_req, res) {
  try {
    const db = await getDb();
    const requests = db.consultRequests
      .filter((r) => r.status === "pending" || r.status === "accepted")
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .map((r) => serializeRequest(db, r));

    res.json({ requests });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not load consultant requests" });
  }
}

export async function acceptConsultRequest(req, res) {
  try {
    let updated = null;
    await updateDb((draft) => {
      const idx = draft.consultRequests.findIndex((r) => r.id === req.params.id);
      if (idx < 0) return draft;

      // Enforce 1 consultant -> 1 user at a time (accepted request).
      const alreadyAssigned = draft.consultRequests.find(
        (r) => r.status === "accepted" && r.consultantId === req.userId && r.id !== req.params.id
      );
      if (alreadyAssigned) {
        const err = new Error("You are already assigned to another user request");
        err.code = "CONSULTANT_ALREADY_ASSIGNED";
        throw err;
      }

      // Only accept pending requests and do not override another consultant.
      if (draft.consultRequests[idx].status !== "pending") {
        const err = new Error("Only pending requests can be accepted");
        err.code = "REQUEST_NOT_PENDING";
        throw err;
      }
      if (
        draft.consultRequests[idx].consultantId != null &&
        draft.consultRequests[idx].consultantId !== req.userId
      ) {
        const err = new Error("This request is already assigned to another consultant");
        err.code = "REQUEST_ALREADY_ASSIGNED";
        throw err;
      }

      draft.consultRequests[idx].status = "accepted";
      draft.consultRequests[idx].consultantId = req.userId;
      draft.consultRequests[idx].updatedAt = nowIso();
      updated = draft.consultRequests[idx];
      return draft;
    });

    if (!updated) {
      return res.status(404).json({ message: "Request not found" });
    }

    const db = await getDb();
    res.json({ request: serializeRequest(db, updated) });
  } catch (err) {
    console.error(err);
    if (err.code === "CONSULTANT_ALREADY_ASSIGNED" || err.code === "REQUEST_NOT_PENDING" || err.code === "REQUEST_ALREADY_ASSIGNED") {
      return res.status(409).json({ message: err.message });
    }
    res.status(500).json({ message: "Could not accept request" });
  }
}

export async function completeConsultRequest(req, res) {
  try {
    let updated = null;
    await updateDb((draft) => {
      const idx = draft.consultRequests.findIndex((r) => r.id === req.params.id);
      if (idx < 0) return draft;
      draft.consultRequests[idx].status = "completed";
      draft.consultRequests[idx].consultantId = req.userId;
      draft.consultRequests[idx].updatedAt = nowIso();
      updated = draft.consultRequests[idx];
      return draft;
    });

    if (!updated) {
      return res.status(404).json({ message: "Request not found" });
    }

    const db = await getDb();
    res.json({ request: serializeRequest(db, updated) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not complete request" });
  }
}
