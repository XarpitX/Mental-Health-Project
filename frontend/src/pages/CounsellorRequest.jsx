import { useEffect, useState } from "react";
import { api } from "../utils/api.js";

export default function CounsellorRequest() {
  const [request, setRequest] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [reqRes, msgRes] = await Promise.all([
          api("/api/assessments/me/request"),
          api("/api/consult/user/me/messages"),
        ]);
        if (!cancelled) {
          setRequest(reqRes.request);
          setMessages(msgRes.messages || []);
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const send = async () => {
    if (!request?.id) return;
    const text = message.trim();
    if (!text) return;
    const data = await api(`/api/consult/user/requests/${request.id}/messages`, {
      method: "POST",
      body: { message: text },
    });
    setMessages(data.messages || []);
    setMessage("");
  };

  if (loading) return <p className="text-mc-muted">Loading counsellor request...</p>;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-white">Counsellor Request</h1>
        <p className="mt-1 text-sm text-mc-muted">Track the support request created from your assessment.</p>
      </header>

      {error && <div className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>}

      <section className="rounded-2xl border border-white/5 bg-mc-card p-6 shadow-xl">
        {request ? (
          <>
            <span className="rounded-full bg-mc-accent/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-mc-accent">
              {request.status}
            </span>
            <h2 className="mt-5 text-xl font-semibold text-white">
              {request.status === "pending" ? "A counsellor will review your request soon." : "Your request is being handled."}
            </h2>
            <p className="mt-2 text-sm text-mc-muted">
              Created {new Date(request.createdAt).toLocaleString()}. You can continue using exercises and chat while waiting for
              support.
            </p>

            <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-5">
              <h3 className="text-sm font-semibold text-white">Your counsellor</h3>
              {request.consultant ? (
                <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-base font-semibold text-white">{request.consultant.name}</p>
                  <p className="mt-2 text-sm leading-relaxed text-mc-muted">
                    {request.consultant.headline ||
                      "Certified mental wellness counsellor. Focused on calm routines, stress reduction, and practical coping skills."}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-mc-muted">
                    {request.consultant.about ||
                      "You can use the chat below to share what you’re feeling. Your counsellor will respond with supportive questions and next steps."}
                  </p>
                </div>
              ) : (
                <p className="mt-3 text-sm text-mc-muted">
                  No counsellor assigned yet. Once a counsellor accepts your request, their profile will appear here.
                </p>
              )}
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-5">
              <h3 className="text-sm font-semibold text-white">Chat with counsellor</h3>
              <p className="mt-1 text-xs text-mc-muted">If a counsellor sends you a message, it will appear here.</p>

              <div className="mt-4 max-h-56 space-y-2 overflow-y-auto rounded-2xl bg-mc-bg p-4 text-sm">
                {messages.length === 0 ? (
                  <p className="text-mc-muted">No messages yet.</p>
                ) : (
                  messages.map((m) => (
                    <div
                      key={m.id}
                      className={`w-fit max-w-[85%] rounded-2xl px-3 py-2 ${
                        m.senderRole === "user" ? "ml-auto bg-mc-accent/15 text-white" : "bg-white/10 text-white/90"
                      }`}
                    >
                      <p className="whitespace-pre-line">{m.text}</p>
                      <p className="mt-1 text-[10px] text-white/60">{new Date(m.createdAt).toLocaleString()}</p>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-3 flex gap-2">
                <input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Write a message..."
                  className="min-w-0 flex-1 rounded-xl border border-white/10 bg-mc-bg px-4 py-2 text-sm text-white outline-none ring-mc-accent focus:ring-2"
                />
                <button type="button" onClick={send} className="mc-btn px-5 py-2.5 text-sm font-semibold">
                  Send
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-xl font-semibold text-white">No counsellor request yet</h2>
            <p className="mt-2 text-sm text-mc-muted">
              A request is created automatically when an assessment result is critical.
            </p>
          </>
        )}
      </section>
    </div>
  );
}
