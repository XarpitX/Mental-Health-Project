import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { api } from "../utils/api.js";
import EmptyState from "../components/EmptyState.jsx";

const SUGGESTIONS = [
  "I've been feeling anxious lately",
  "I'm having trouble sleeping",
  "I feel overwhelmed with work",
  "I want to try a breathing exercise",
];

function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="flex justify-start"
    >
      <div className="flex items-center gap-2 rounded-2xl rounded-bl-md border border-white/10 bg-[#14213D] px-4 py-3 text-sm text-mc-muted/90 shadow-[0_18px_50px_rgba(0,0,0,0.45)]">
        <span className="flex items-center gap-1.5" aria-label="MindCare is typing">
          <span className="mc-typing-dot" />
          <span className="mc-typing-dot" />
          <span className="mc-typing-dot" />
        </span>
        <span className="text-xs text-mc-muted/80">MindCare is thinking…</span>
      </div>
    </motion.div>
  );
}

function Bubble({ role, content }) {
  const isUser = role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-md transition duration-300 ease-out ${
          isUser
            ? "rounded-br-md bg-[#FCA311] text-black shadow-[0_16px_40px_rgba(252,163,17,0.22)]"
            : "rounded-bl-md bg-[#14213D] text-white shadow-[0_18px_50px_rgba(0,0,0,0.45)]"
        }`}
      >
        {content}
      </div>
    </motion.div>
  );
}

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [chatId, setChatId] = useState(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState("");
  const [chips, setChips] = useState(SUGGESTIONS);
  const [boot, setBoot] = useState(true);
  const bottomRef = useRef(null);
  const listRef = useRef(null);
  const shouldAutoScrollRef = useRef(true);

  const scrollDown = () => {
    const el = bottomRef.current;
    if (!el) return;
    requestAnimationFrame(() => el.scrollIntoView({ behavior: "smooth", block: "end" }));
  };

  const updateAutoScrollState = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    shouldAutoScrollRef.current = distanceFromBottom < 120;
  }, []);

  const loadLatest = useCallback(async () => {
    try {
      const { chats } = await api("/api/chat");
      if (chats?.length) {
        const latest = chats[0];
        setChatId(latest._id);
        setMessages(
          (latest.messages || []).map((m) => ({
            role: m.role,
            content: m.content,
          }))
        );
      }
    } catch {
      setMessages([]);
      setChatId(null);
    } finally {
      setBoot(false);
    }
  }, []);

  useEffect(() => {
    loadLatest();
  }, [loadLatest]);

  useEffect(() => {
    if (shouldAutoScrollRef.current) scrollDown();
  }, [messages, loading]);

  const send = async (text) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    setInput("");
    shouldAutoScrollRef.current = true;
    setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
    setSuggestion("");
    setLoading(true);
    try {
      const minTypingMs = 1200;
      const [data] = await Promise.all([
        api("/api/chat", {
          method: "POST",
          body: { message: trimmed, chatId },
        }),
        new Promise((r) => setTimeout(r, minTypingMs)),
      ]);
      setChatId(data.chatId);
      setSuggestion(data.suggestion || "");
      setChips((prev) => {
        const next = [...prev];
        if (data.suggestion && !next.includes(data.suggestion)) next.unshift(data.suggestion);
        return next.slice(0, 6);
      });
      setMessages(
        (data.messages || []).map((m) => ({
          role: m.role,
          content: m.content,
        }))
      );
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Sorry, something went wrong: ${e.message}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const newChat = () => {
    setChatId(null);
    setMessages([]);
    setInput("");
    setSuggestion("");
  };

  if (boot) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-mc-muted">Loading chat…</div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col">
      <header className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-white">AI Chat</h1>
          <p className="text-sm text-mc-muted/90">Supportive, private conversation</p>
        </div>
        <button
          type="button"
          onClick={newChat}
          className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white backdrop-blur-md transition duration-300 ease-out hover:bg-white/10"
        >
          New chat
        </button>
      </header>

      <div className="mc-glass-strong flex min-h-[72vh] flex-col overflow-hidden rounded-2xl">
        <div
          ref={listRef}
          onScroll={updateAutoScrollState}
          onWheel={updateAutoScrollState}
          onTouchMove={updateAutoScrollState}
          className="flex-1 space-y-4 overflow-y-auto px-5 py-6 md:px-8"
        >
          {messages.length === 0 && !loading ? (
            <EmptyState
              title="Start a conversation"
              description="Share how you are feeling. MindCare responds with empathy and practical ideas."
              action={
                <div className="flex flex-wrap justify-center gap-2">
                  {chips.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => send(s)}
                      className="rounded-full border border-mc-accent/40 bg-black/20 px-4 py-2 text-xs text-mc-accent transition duration-300 ease-out hover:bg-mc-accent/10 hover:shadow-[0_14px_40px_rgba(252,163,17,0.12)]"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              }
            />
          ) : (
            <>
              {messages.map((m, i) => (
                <Bubble key={`${i}-${m.role}`} role={m.role} content={m.content} />
              ))}
              {!loading && suggestion && (
                <div className="flex justify-start">
                  <button
                    type="button"
                    onClick={() => send(suggestion)}
                    className="rounded-full border border-mc-accent/40 bg-black/20 px-4 py-2 text-xs text-mc-accent transition duration-300 ease-out hover:bg-mc-accent/10 hover:shadow-[0_14px_40px_rgba(252,163,17,0.12)]"
                  >
                    Try: {suggestion}
                  </button>
                </div>
              )}
              {loading && <TypingIndicator />}
            </>
          )}
          <div ref={bottomRef} />
        </div>

        {messages.length > 0 && (
          <div className="flex flex-wrap gap-2 border-t border-white/10 px-4 py-3 md:px-6">
            {chips.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => send(s)}
                disabled={loading}
                className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-xs text-mc-muted/90 transition duration-300 ease-out hover:border-mc-accent/30 hover:text-mc-accent disabled:opacity-50"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <form
          className="flex gap-3 border-t border-white/10 p-4 md:p-6"
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type how you're feeling..."
            disabled={loading}
            className="flex-1 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none ring-mc-accent focus:ring-2 disabled:opacity-50"
          />
          <motion.button
            type="submit"
            disabled={loading || !input.trim()}
            whileTap={{ scale: 0.98 }}
            className="mc-btn px-6 py-3 text-sm font-semibold disabled:opacity-40"
          >
            Send
          </motion.button>
        </form>
      </div>
    </div>
  );
}
