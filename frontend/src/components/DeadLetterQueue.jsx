import { useEffect, useState } from "react";
import api, { fetchDLQ } from "../services/api";

function payloadSummary(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return "—";
  }
  const preferred = [
    "orderId",
    "order_id",
    "id",
    "userId",
    "msg",
    "message",
    "amount",
    "sku",
  ];
  for (const key of preferred) {
    if (payload[key] != null && payload[key] !== "") {
      const v = String(payload[key]);
      return `${key}: ${v.length > 40 ? `${v.slice(0, 40)}…` : v}`;
    }
  }
  const keys = Object.keys(payload);
  if (keys.length === 0) {
    return "{}";
  }
  const k = keys[0];
  const v = String(payload[k]);
  return `${k}: ${v.length > 40 ? `${v.slice(0, 40)}…` : v}`;
}

function DeadLetterQueue() {
  const [failedEvents, setFailedEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDlq = async () => {
      try {
        const response = await fetchDLQ();
        setFailedEvents(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.log(error);
        setFailedEvents([]);
      } finally {
        setLoading(false);
      }
    };

    loadDlq();
  }, []);

  const handleRetry = async (event) => {
    const messageId = event._id;
    if (!messageId) {
      alert("Missing message id; cannot retry.");
      return;
    }

    const snapshot = failedEvents;
    setFailedEvents((prev) => prev.filter((item) => item._id !== messageId));

    try {
      await api.post("/api/retry", { messageId });
    } catch (error) {
      console.log(error);
      setFailedEvents(snapshot);
      const msg = error.response?.data?.message || "Retry failed (admin JWT required?)";
      alert(msg);
    }
  };

  return (
    <section className="rounded-lg border border-slate-800 bg-slate-900 p-4">
      <h2 className="mb-3 text-sm font-medium text-slate-300">Dead Letter Queue</h2>
      {loading ? (
        <p className="text-sm text-slate-500">Loading failed events...</p>
      ) : failedEvents.length === 0 ? (
        <p className="text-sm text-slate-500">No failed events</p>
      ) : (
        <div className="space-y-2">
          {failedEvents.map((event, index) => {
            const topic =
              event.topic != null && String(event.topic).trim() !== ""
                ? event.topic
                : "default";
            const summary = payloadSummary(event.payload);

            return (
              <div
                key={event._id || `${event.type || "failed"}-${index}`}
                className="rounded-md border border-red-900/60 bg-red-950/30 p-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 flex-1 space-y-1 text-xs">
                    <p className="font-semibold text-red-100">{event.type || "UNKNOWN"}</p>
                    <p className="text-red-200/90">
                      <span className="text-red-300/80">Topic</span>{" "}
                      <span className="font-mono text-red-100">{topic}</span>
                    </p>
                    <p className="truncate text-red-200/90">
                      <span className="text-red-300/80">Summary</span>{" "}
                      <span className="font-mono text-red-50">{summary}</span>
                    </p>
                    {event.error ? (
                      <p className="break-words text-red-300/95">
                        <span className="text-red-400/90">Error</span> {String(event.error)}
                      </p>
                    ) : null}
                    {event.createdAt ? (
                      <p className="text-red-300/70">
                        <span className="text-red-400/80">At</span> {String(event.createdAt)}
                      </p>
                    ) : null}
                  </div>
                  <span className="shrink-0 rounded bg-red-500/20 px-2 py-0.5 text-[10px] font-medium uppercase text-red-200">
                    {event.status || "failed"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRetry(event)}
                  className="mt-3 rounded bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-500"
                >
                  Retry
                </button>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default DeadLetterQueue;
