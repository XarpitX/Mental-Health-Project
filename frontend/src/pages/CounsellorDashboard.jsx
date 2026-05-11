import { useEffect, useState } from "react";
import { api } from "../utils/api.js";

function Chip({ children, tone = "neutral" }) {
  const cls =
    tone === "pending"
      ? "bg-yellow-500/10 text-yellow-300 border-yellow-500/20"
      : tone === "accepted"
        ? "bg-indigo-500/10 text-indigo-300 border-indigo-500/20"
        : tone === "critical"
          ? "bg-red-500/10 text-red-300 border-red-500/20"
          : "bg-white/5 text-mc-muted border-white/10";
  return <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${cls}`}>{children}</span>;
}

export default function CounsellorDashboard() {
  const [requests, setRequests] = useState([]);
  const [selected, setSelected] = useState(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadRequests = async () => {
    const data = await api("/api/consultant/requests");
    setRequests(data.requests);
    setSelected((current) => data.requests.find((request) => request.id === current?.id) || data.requests[0] || null);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await api("/api/consultant/requests");
        if (!cancelled) {
          setRequests(data.requests);
          setSelected(data.requests[0] || null);
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

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!selected?.id) {
        setMessages([]);
        return;
      }
      try {
        const data = await api(`/api/consult/consultant/requests/${selected.id}/messages`);
        if (!cancelled) setMessages(data.messages || []);
      } catch {
        if (!cancelled) setMessages([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selected?.id]);

  const accept = async (id) => {
    await api(`/api/consultant/requests/${id}/accept`, { method: "PATCH" });
    await loadRequests();
  };

  const complete = async (id) => {
    await api(`/api/consultant/requests/${id}/complete`, { method: "PATCH" });
    await loadRequests();
  };

  const send = async () => {
    if (!selected?.id) return;
    const text = message.trim();
    if (!text) return;
    const data = await api(`/api/consult/consultant/requests/${selected.id}/messages`, {
      method: "POST",
      body: { message: text },
    });
    setMessages(data.messages || []);
    setMessage("");
  };

  if (loading) return <p className="text-mc-muted">Loading counsellor dashboard...</p>;

  const pendingCount = requests.filter((r) => r.status === "pending").length;
  const acceptedCount = requests.filter((r) => r.status === "accepted").length;
  const criticalCount = requests.filter((r) => r.assessment?.status === "critical").length;

  return (
    <div className="space-y-10">
      <header className="mc-gradient-border rounded-3xl">
        <div className="mc-glass-strong rounded-3xl px-6 py-6 sm:px-8 sm:py-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Chip>Counsellor</Chip>
                <Chip tone="pending">{pendingCount} pending</Chip>
                <Chip tone="accepted">{acceptedCount} accepted</Chip>
                <Chip tone="critical">{criticalCount} critical users</Chip>
              </div>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white">Counsellor dashboard</h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-mc-muted">
                Triage critical assessments, accept requests, and guide users toward calmer next steps.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 px-5 py-4">
              <p className="text-xs uppercase tracking-[0.22em] text-mc-muted">Response guide</p>
              <p className="mt-2 text-sm text-white/85">
                Start with validation → ask one clear question → suggest one small action.
              </p>
            </div>
          </div>
        </div>
      </header>

      {error && <div className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>}

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="overflow-hidden rounded-3xl border border-white/10 bg-black/20 shadow-xl">
          <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
            <div>
              <h2 className="text-sm font-semibold text-white">Requests</h2>
              <p className="mt-1 text-xs text-mc-muted">Critical users requiring follow-up</p>
            </div>
            <Chip>{requests.length} open</Chip>
          </div>
          <div className="divide-y divide-white/10">
            {requests.length === 0 && (
              <div className="px-6 py-10">
                <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 px-6 py-8 text-sm text-mc-muted">
                  No active critical requests right now.
                </div>
              </div>
            )}
            {requests.map((request) => {
              const isSelected = selected?.id === request.id;
              return (
                <button
                  key={request.id}
                  type="button"
                  onClick={() => setSelected(request)}
                  className={`block w-full px-6 py-5 text-left transition hover:bg-white/5 ${isSelected ? "bg-white/5" : ""}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className="truncate text-base font-semibold text-white">
                        {request.user?.name || "Unknown user"}
                      </h3>
                      <p className="mt-1 truncate text-xs text-mc-muted">{request.user?.email}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Chip tone={request.status === "pending" ? "pending" : "accepted"}>{request.status}</Chip>
                        <Chip tone="critical">score {request.assessment?.score ?? "-"}</Chip>
                        {request.status === "accepted" && (
                          <Chip tone="accepted">
                            Assigned: {request.consultant?.name ? request.consultant.name : "Counsellor"}
                          </Chip>
                        )}
                        <Chip>{new Date(request.createdAt).toLocaleString()}</Chip>
                      </div>
                    </div>
                    <div className="shrink-0 rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-right">
                      <p className="text-xs text-mc-muted">Online</p>
                      <p className={`mt-1 text-sm font-semibold ${request.user?.isOnline ? "text-green-300" : "text-slate-400"}`}>
                        {request.user?.isOnline ? "Yes" : "No"}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-black/20 p-6 shadow-xl">
          {selected ? (
            <>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold text-white">{selected.user?.name}</h2>
                  <p className="mt-1 text-sm text-mc-muted">
                    Score {selected.assessment?.score ?? "-"} · {selected.assessment?.status ?? "critical"}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Chip tone={selected.status === "pending" ? "pending" : "accepted"}>{selected.status}</Chip>
                    <Chip>{selected.user?.isOnline ? "User online" : "User offline"}</Chip>
                  </div>
                </div>
                <span className="text-xs text-mc-muted">{new Date(selected.createdAt).toLocaleString()}</span>
              </div>

              {Array.isArray(selected.assessment?.possibleIssues) && selected.assessment.possibleIssues.length > 0 && (
                <div className="mt-5 rounded-3xl border border-white/10 bg-white/5 p-4">
                  <h3 className="text-sm font-semibold text-white">Possible issues (hint)</h3>
                  <p className="mt-1 text-xs text-mc-muted">Educational hint from assessment answers (not a diagnosis).</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selected.assessment.possibleIssues.map((x) => (
                      <Chip key={x} tone="critical">
                        {x}
                      </Chip>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-5 flex flex-wrap gap-2">
                {selected.status === "pending" && (
                  <button
                    type="button"
                    onClick={() => accept(selected.id)}
                    className="mc-btn inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold"
                  >
                    Accept request
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => complete(selected.id)}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Mark completed
                </button>
              </div>

              <div className="mt-6 rounded-3xl border border-white/10 bg-black/20 p-5">
                <h3 className="text-sm font-semibold text-white">Support message (lightweight)</h3>
                <p className="mt-1 text-xs text-mc-muted">
                  Messages are saved to the request and shown to the user.
                </p>
                <div className="mt-4 max-h-56 space-y-2 overflow-y-auto rounded-2xl bg-mc-bg p-4 text-sm">
                  {messages.length === 0 ? (
                    <p className="text-mc-muted">
                      No messages yet. Try: “Thanks for sharing that—what’s been the hardest part of your day recently?”
                    </p>
                  ) : (
                    messages.map((m) => (
                      <div
                        key={m.id}
                        className={`w-fit max-w-[85%] rounded-2xl px-3 py-2 ${
                          m.senderRole === "consultant" ? "ml-auto bg-mc-accent/15 text-white" : "bg-white/10 text-white/90"
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
                    onChange={(event) => setMessage(event.target.value)}
                    placeholder="Type a message..."
                    className="min-w-0 flex-1 rounded-xl border border-white/10 bg-mc-bg px-4 py-2 text-sm text-white outline-none ring-mc-accent focus:ring-2"
                  />
                  <button type="button" onClick={send} className="mc-btn px-5 py-2.5 text-sm font-semibold">
                    Send
                  </button>
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-mc-muted">Select a request to view details.</p>
          )}
        </section>
      </div>
    </div>
  );
}
