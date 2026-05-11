import { getDb, newId, nowIso, updateDb } from "../storage/fileDb.js";
import { inferMoodFromText } from "../utils/moodFromText.js";
import { getChatbotResponse } from "../utils/chatResponses.js";

export async function getChats(req, res) {
  try {
    const db = await getDb();
    const chats = db.chats
      .filter((c) => c.userId === req.userId)
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .slice(0, 50)
      .map((c) => ({
        id: c.id,
        title: c.title,
        messages: c.messages,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      }));
    res.json({ chats });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load chats" });
  }
}

export async function getChat(req, res) {
  try {
    const db = await getDb();
    const chat = db.chats.find((c) => c.id === req.params.id && c.userId === req.userId);
    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }
    res.json({ chat });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load chat" });
  }
}

export async function sendMessage(req, res) {
  try {
    const { message, chatId } = req.body;
    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ message: "Message is required" });
    }

    let chat;
    if (chatId) {
      const db = await getDb();
      chat = db.chats.find((c) => c.id === chatId && c.userId === req.userId);
      if (!chat) {
        return res.status(404).json({ message: "Chat not found" });
      }
    } else {
      const title = message.slice(0, 48) + (message.length > 48 ? "…" : "");
      chat = {
        id: newId("chat"),
        userId: req.userId,
        title: title || "New conversation",
        messages: [],
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      await updateDb((draft) => {
        draft.chats.push(chat);
        return draft;
      });
    }

    const userText = message.trim();
    const userMsg = { id: newId("msg"), role: "user", content: userText, createdAt: nowIso() };

    const inferred = inferMoodFromText(userText);
    if (inferred) {
      await updateDb((draft) => {
        draft.moods.push({
          id: newId("mood"),
          userId: req.userId,
          moodType: inferred.moodType,
          score: inferred.score,
          date: nowIso(),
          source: "chat",
          createdAt: nowIso(),
          updatedAt: nowIso(),
        });
        return draft;
      });
    }

    const recentAssistantReplies = (chat.messages || [])
      .filter((m) => m.role === "assistant")
      .slice(-3)
      .map((m) => m.content);

    const { reply, suggestion } = getChatbotResponse(userText, {
      chatId: chat.id,
      avoidReplies: recentAssistantReplies,
    });

    const assistantMsg = { id: newId("msg"), role: "assistant", content: reply, createdAt: nowIso() };
    await updateDb((draft) => {
      const idx = draft.chats.findIndex((c) => c.id === chat.id && c.userId === req.userId);
      if (idx < 0) return draft;
      draft.chats[idx].messages.push(userMsg, assistantMsg);
      draft.chats[idx].updatedAt = nowIso();
      return draft;
    });

    res.json({
      chatId: chat.id,
      reply,
      suggestion: suggestion || "",
      messages: [...(chat.messages || []), userMsg, assistantMsg],
      moodInferred: inferred,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || "Chat failed" });
  }
}
