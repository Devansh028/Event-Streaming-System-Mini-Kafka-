import { useEffect, useMemo, useRef, useState } from "react";
import { useDashPalette } from "../hooks/useDashPalette";
import { IconChevronDown } from "./icons";

const TOPIC_FILTERS = [
  { id: "all", label: "All Topics" },
  { id: "orders", label: "orders" },
  { id: "payments", label: "payments" },
  { id: "default", label: "default" },
];

function topicBadgeClass(topic) {
  const t = (topic || "default").toLowerCase();
  if (t === "orders") {
    return "border-emerald-500/35 bg-emerald-950/55 text-emerald-200";
  }
  if (t === "payments") {
    return "border-sky-500/35 bg-sky-950/50 text-sky-200";
  }
  return "border-purple-500/35 bg-purple-950/55 text-purple-200";
}

function statusBadgeClass(status) {
  const s = (status || "processed").toLowerCase();
  if (s === "failed") {
    return "border-red-500/50 bg-red-950/50 text-red-200";
  }
  if (s === "retrying") {
    return "border-amber-500/50 bg-amber-950/50 text-amber-200";
  }
  return "border-emerald-500/50 bg-emerald-950/50 text-emerald-200";
}

function formatTime(event) {
  const raw = event.createdAt;
  if (raw == null) {
    return "—";
  }
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) {
    return String(raw).slice(11, 19);
  }
  return d.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatRelative(raw) {
  if (raw == null) {
    return "";
  }
  const d = new Date(raw);
  const ms = Date.now() - d.getTime();
  if (Number.isNaN(ms)) {
    return "";
  }
  const sec = Math.floor(ms / 1000);
  if (sec < 0) {
    return "just now";
  }
  if (sec < 60) {
    return `${sec} sec ago`;
  }
  const min = Math.floor(sec / 60);
  if (min < 60) {
    return `${min} min ago`;
  }
  const hr = Math.floor(min / 60);
  if (hr < 48) {
    return `${hr} hr ago`;
  }
  return `${Math.floor(hr / 24)} d ago`;
}

function previewPayload(event) {
  try {
    const obj = event.payload != null ? event.payload : event;
    const s = JSON.stringify(obj);
    if (s.length <= 96) {
      return s;
    }
    return `${s.slice(0, 93)}…`;
  } catch {
    return "…";
  }
}

function LiveStream({ events, onClear }) {
  const p = useDashPalette();
  const [topicFilter, setTopicFilter] = useState("all");
  const [autoScroll, setAutoScroll] = useState(true);
  const [expanded, setExpanded] = useState({});
  const [, setTick] = useState(0);
  const listRef = useRef(null);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const filtered = useMemo(() => {
    if (topicFilter === "all") {
      return events;
    }
    return events.filter(
      (e) => (e.topic != null && String(e.topic).trim() !== "" ? e.topic : "default") === topicFilter
    );
  }, [events, topicFilter]);

  useEffect(() => {
    if (!autoScroll || !listRef.current) {
      return;
    }
    listRef.current.scrollTop = 0;
  }, [events, autoScroll, filtered.length, topicFilter]);

  const toggleExpand = (key) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const timeCls = p.isLight ? "text-slate-700" : "text-gray-300";

  return (
    <section className={p.panel}>
      <div className={`flex flex-wrap items-start justify-between gap-3 border-b px-5 py-4 ${p.panelHeaderBorder}`}>
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/25 ring-1 ring-cyan-500/25">
            <svg className="h-5 w-5 text-cyan-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <h2 className={`text-lg font-semibold tracking-tight ${p.panelTitle}`}>Live Event Stream</h2>
            <p className={`text-[11px] ${p.panelMuted}`}>WebSocket · new-event</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            role="switch"
            aria-checked={autoScroll}
            onClick={() => setAutoScroll((v) => !v)}
            className={`flex items-center gap-2 rounded-full border px-2 py-1.5 text-[11px] font-semibold transition hover:border-gray-600 ${p.pillInactiveSwitch}`}
          >
            <span
              className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors ${
                autoScroll ? "bg-blue-600" : p.switchOff
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                  autoScroll ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </span>
            Auto-scroll
          </button>
          <button
            type="button"
            onClick={onClear}
            className={`rounded-xl border px-3 py-1.5 text-[11px] font-semibold transition ${p.pillInactiveSwitch} hover:opacity-90`}
          >
            Clear
          </button>
        </div>
      </div>

      <div className={`border-b px-5 py-3 ${p.filterBarBorder}`}>
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Topic filter">
          {TOPIC_FILTERS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={topicFilter === tab.id}
              onClick={() => setTopicFilter(tab.id)}
              className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-all ${
                topicFilter === tab.id
                  ? "border-blue-500/60 bg-gradient-to-r from-blue-600/40 to-purple-600/30 text-white shadow-[0_0_16px_rgba(59,130,246,0.25)]"
                  : `${p.pillInactive} ${p.isLight ? "hover:text-slate-900" : "hover:text-white"}`
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div ref={listRef} className="hide-scrollbar min-h-[280px] flex-1 overflow-y-auto scroll-smooth px-5 py-2">
        {filtered.length === 0 ? (
          <p className={`py-16 text-center text-sm ${p.emptyState}`}>No events for this filter.</p>
        ) : (
          <div className="relative pl-2">
            <div
              className={`pointer-events-none absolute bottom-2 left-[11px] top-2 w-px bg-gradient-to-b ${p.timelineGradient} to-transparent`}
              aria-hidden
            />
            {filtered.map((event, index) => {
              const topic = event.topic != null && String(event.topic).trim() !== "" ? event.topic : "default";
              const key = `${event.createdAt ?? "e"}-${index}-${event.type ?? ""}`;
              const isOpen = !!expanded[key];

              return (
                <div
                  key={key}
                  className={`relative grid grid-cols-1 gap-2 border-b py-3 last:border-0 lg:grid-cols-[1fr_minmax(0,14rem)] lg:items-start lg:gap-4 ${p.subtleBorder}`}
                >
                  <div className="flex gap-3">
                    <div className="flex w-6 shrink-0 flex-col items-center pt-1">
                      <span
                        className={`z-10 h-3 w-3 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 shadow-[0_0_14px_rgba(34,211,238,0.55)] ring-2 ${p.dotRing}`}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
                        <time className={`font-mono text-[11px] font-medium ${timeCls}`}>{formatTime(event)}</time>
                        <span className={`text-[11px] ${p.panelMuted}`}>{formatRelative(event.createdAt)}</span>
                        <span
                          className={`rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${topicBadgeClass(topic)}`}
                        >
                          {topic}
                        </span>
                        <span className={`rounded-md border px-2 py-0.5 text-[10px] font-semibold ${p.typePill}`}>
                          {event.type || "UNKNOWN"}
                        </span>
                        <span
                          className={`rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase ${statusBadgeClass(event.status)}`}
                        >
                          {event.status || "processed"}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleExpand(key)}
                        className={`mt-2 inline-flex items-center gap-1 text-[11px] font-semibold transition ${p.linkAccent}`}
                      >
                        <IconChevronDown
                          className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
                        />
                        {isOpen ? "Hide payload" : "Expand JSON"}
                      </button>
                      {isOpen ? (
                        <pre
                          className={`mt-2 max-h-56 overflow-auto rounded-xl border p-3 text-left font-mono text-[11px] leading-relaxed ${p.jsonPre}`}
                        >
                          {JSON.stringify(event.payload ?? event, null, 2)}
                        </pre>
                      ) : (
                        <p className={`mt-2 break-all rounded-lg border px-2 py-1.5 font-mono text-[10px] leading-snug lg:hidden ${p.previewBox}`}>
                          {previewPayload(event)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="hidden min-w-0 pl-9 lg:block lg:pl-0">
                    <p className={`break-all rounded-lg border px-2 py-1.5 font-mono text-[10px] leading-snug ${p.previewBox}`}>
                      {previewPayload(event)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

export default LiveStream;
