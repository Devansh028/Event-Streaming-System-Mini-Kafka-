import { useEffect, useRef } from "react";

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
      return `${key}: ${v.length > 48 ? `${v.slice(0, 48)}…` : v}`;
    }
  }
  const keys = Object.keys(payload);
  if (keys.length === 0) {
    return "{}";
  }
  const k = keys[0];
  const v = String(payload[k]);
  return `${k}: ${v.length > 48 ? `${v.slice(0, 48)}…` : v}`;
}

function formatTimestamp(event) {
  const raw = event.createdAt;
  if (raw == null) {
    return "—";
  }
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) {
    return String(raw).slice(0, 24);
  }
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function getBadge(event) {
  const typeU = (event.type || "").toUpperCase();
  const status = (event.status || "").toLowerCase();

  if (status === "failed" || typeU.includes("FAILED")) {
    return {
      label: "FAILED",
      className: "bg-red-900/90 text-red-100 ring-1 ring-red-600/50",
    };
  }
  if (typeU.includes("PROCESSING")) {
    return {
      label: "PROCESSING",
      className: "bg-yellow-900/90 text-yellow-100 ring-1 ring-yellow-600/50",
    };
  }
  if (typeU.includes("COMPLETED")) {
    return {
      label: "COMPLETED",
      className: "bg-emerald-900/90 text-emerald-100 ring-1 ring-emerald-600/50",
    };
  }
  if (typeU.includes("CREATED")) {
    return {
      label: "CREATED",
      className: "bg-blue-900/90 text-blue-100 ring-1 ring-blue-600/50",
    };
  }
  if (status === "processed") {
    return {
      label: "COMPLETED",
      className: "bg-emerald-900/90 text-emerald-100 ring-1 ring-emerald-600/50",
    };
  }
  return {
    label: (event.type || "EVENT").slice(0, 16),
    className: "bg-slate-700 text-slate-200 ring-1 ring-slate-600/50",
  };
}

function EventStream({ events }) {
  const listRef = useRef(null);

  useEffect(() => {
    const el = listRef.current;
    if (!el) {
      return;
    }
    // Newest events are first; keep scroll pinned to the top to show the latest.
    el.scrollTop = 0;
  }, [events]);

  return (
    <section className="rounded-lg border border-slate-800 bg-slate-900 p-4">
      <h2 className="mb-3 text-sm font-medium text-slate-300">Live Event Stream</h2>
      <div
        ref={listRef}
        className="h-80 space-y-2 overflow-y-auto scroll-smooth"
      >
        {events.length === 0 ? (
          <p className="text-sm text-slate-500">No events received yet.</p>
        ) : (
          events.map((event, index) => {
            const badge = getBadge(event);
            const topic = event.topic != null && String(event.topic).trim() !== "" ? event.topic : "default";
            const summary = payloadSummary(event.payload);

            return (
              <article
                key={`${event.createdAt ?? "evt"}-${index}-${event.type ?? ""}-${topic}`}
                className="rounded-md border border-slate-700 bg-slate-800/80 p-3 shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span
                    className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${badge.className}`}
                  >
                    {badge.label}
                  </span>
                  <time className="text-slate-500">{formatTimestamp(event)}</time>
                </div>
                <div className="mt-2 space-y-1 text-sm">
                  <p className="font-medium text-slate-100">{event.type || "UNKNOWN"}</p>
                  <p className="text-xs text-slate-400">
                    <span className="text-slate-500">Topic</span>{" "}
                    <span className="font-mono text-slate-300">{topic}</span>
                  </p>
                  <p className="text-xs text-slate-400">
                    <span className="text-slate-500">Summary</span>{" "}
                    <span className="font-mono text-slate-300">{summary}</span>
                  </p>
                </div>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}

export default EventStream;
