import { getDb, newId, nowIso, updateDb } from "../storage/fileDb.js";

function sanitizeMessage(text) {
  return String(text || "").trim().slice(0, 2000);
}

function ensureMessages(request) {
  if (!Array.isArray(request.messages)) request.messages = [];
}

export async function userGetMyRequestMessages(req, res) {
  try {
    const db = await getDb();
    const request =
      db.consultRequests
        .filter((r) => r.userId === req.userId)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0] || null;

    if (!request) return res.json({ requestId: null, messages: [] });
    res.json({ requestId: request.id, messages: request.messages || [] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not load messages" });
  }
}

export async function userSendMessage(req, res) {
  try {
    const { message } = req.body;
    const text = sanitizeMessage(message);
    if (!text) return res.status(400).json({ message: "Message is required" });

    let updated = null;
    await updateDb((draft) => {
      const idx = draft.consultRequests.findIndex((r) => r.id === req.params.id && r.userId === req.userId);
      if (idx < 0) return draft;
      ensureMessages(draft.consultRequests[idx]);
      draft.consultRequests[idx].messages.push({
        id: newId("crm"),
        senderRole: "user",
        senderId: req.userId,
        text,
        createdAt: nowIso(),
      });
      draft.consultRequests[idx].updatedAt = nowIso();
      updated = draft.consultRequests[idx];
      return draft;
    });

    if (!updated) return res.status(404).json({ message: "Request not found" });
    res.json({ messages: updated.messages || [] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not send message" });
  }
}

export async function consultantGetRequestMessages(req, res) {
  try {
    const db = await getDb();
    const request = db.consultRequests.find((r) => r.id === req.params.id);
    if (!request) return res.status(404).json({ message: "Request not found" });
    res.json({ requestId: request.id, messages: request.messages || [] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not load messages" });
  }
}

export async function consultantSendMessage(req, res) {
  try {
    const { message } = req.body;
    const text = sanitizeMessage(message);
    if (!text) return res.status(400).json({ message: "Message is required" });

    let updated = null;
    await updateDb((draft) => {
      const idx = draft.consultRequests.findIndex((r) => r.id === req.params.id);
      if (idx < 0) return draft;
      ensureMessages(draft.consultRequests[idx]);
      draft.consultRequests[idx].messages.push({
        id: newId("crm"),
        senderRole: "consultant",
        senderId: req.userId,
        text,
        createdAt: nowIso(),
      });
      draft.consultRequests[idx].updatedAt = nowIso();
      updated = draft.consultRequests[idx];
      return draft;
    });

    if (!updated) return res.status(404).json({ message: "Request not found" });
    res.json({ messages: updated.messages || [] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not send message" });
  }
}

