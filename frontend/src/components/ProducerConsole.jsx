import { useMemo, useRef, useState } from "react";
import { useDashPalette } from "../hooks/useDashPalette";
import api from "../services/api";
import { IconBraces, IconSend } from "./icons";

const TOPICS = [
  { value: "default", label: "default", dot: "bg-purple-500 shadow-[0_0_8px_#a855f7]" },
  { value: "orders", label: "orders", dot: "bg-emerald-500 shadow-[0_0_8px_#34d399]" },
  { value: "payments", label: "payments", dot: "bg-sky-500 shadow-[0_0_8px_#38bdf8]" },
];

const defaultPayload = `{
  "orderId": "ORD-12345",
  "userId": "user_789",
  "amount": 99.99,
  "currency": "USD",
  "items": [
    { "sku": "SKU-001", "qty": 2, "price": 49.99 },
    { "sku": "SKU-002", "qty": 1, "price": 19.99 }
  ]
}`;

function ProducerConsole() {
  const p = useDashPalette();
  const [topic, setTopic] = useState("orders");
  const [type, setType] = useState("ORDER_CREATED");
  const [payloadText, setPayloadText] = useState(defaultPayload);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const lineRef = useRef(null);
  const textareaRef = useRef(null);

  const lines = useMemo(() => payloadText.split("\n"), [payloadText]);

  const showToast = (msg, ok) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  };

  const syncScroll = () => {
    if (lineRef.current && textareaRef.current) {
      lineRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  const handleFormatJson = () => {
    try {
      const parsed = JSON.parse(payloadText.trim() === "" ? "{}" : payloadText);
      setPayloadText(JSON.stringify(parsed, null, 2));
      showToast("JSON formatted", true);
    } catch {
      showToast("Invalid JSON — cannot format", false);
    }
  };

  const handlePublish = async (e) => {
    e.preventDefault();
    const trimmed = type.trim();
    if (!trimmed) {
      showToast("Event type is required", false);
      return;
    }
    let payload;
    try {
      payload = JSON.parse(payloadText.trim() === "" ? "{}" : payloadText);
    } catch {
      showToast("Invalid JSON payload", false);
      return;
    }
    if (payload === null || typeof payload !== "object" || Array.isArray(payload)) {
      showToast("Payload must be a JSON object", false);
      return;
    }

    setLoading(true);
    try {
      await api.post("/api/event", {
        topic,
        type: trimmed,
        payload,
      });
      showToast(`Published → ${topic} / ${trimmed}`, true);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Publish failed";
      showToast(msg, false);
    } finally {
      setLoading(false);
    }
  };

  const topicMeta = TOPICS.find((t) => t.value === topic) || TOPICS[0];

  return (
    <section className={p.panel}>
      <div className={`flex items-start justify-between gap-3 border-b px-5 py-4 ${p.panelHeaderBorder}`}>
        <div className="flex items-start gap-3">
          <div
            className={`mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl ring-1 ${p.iconBoxBlue}`}
          >
            <IconSend className={`h-5 w-5 ${p.iconBlue}`} />
          </div>
          <div>
            <h2 className={`text-lg font-semibold tracking-tight ${p.panelTitle}`}>Producer Console</h2>
            <p className={`text-[11px] ${p.panelMuted}`}>POST /api/event · publish to streams</p>
          </div>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-4 p-5 pt-4">
        {toast ? (
          <div
            className={`rounded-xl border px-3 py-2.5 text-sm ${toast.ok ? p.toastOk : p.toastErr}`}
          >
            {toast.msg}
          </div>
        ) : null}

        <form onSubmit={handlePublish} className="flex min-h-0 flex-1 flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={`block text-[11px] font-semibold uppercase tracking-wide ${p.label}`}>
              Topic
              <div className="relative mt-2">
                <span
                  className={`pointer-events-none absolute left-3 top-1/2 z-10 h-2 w-2 -translate-y-1/2 rounded-full ${topicMeta.dot}`}
                  aria-hidden
                />
                <select
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className={`mt-0 w-full appearance-none rounded-xl border py-2.5 pl-9 pr-3 text-sm font-medium transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${p.input}`}
                >
                  {TOPICS.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
            </label>
            <label className={`block text-[11px] font-semibold uppercase tracking-wide ${p.label}`}>
              Event type
              <input
                type="text"
                value={type}
                onChange={(e) => setType(e.target.value)}
                placeholder="ORDER_CREATED"
                className={`mt-2 w-full rounded-xl border px-3 py-2.5 text-sm font-medium transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${p.input}`}
              />
            </label>
          </div>

          <div className="flex min-h-0 flex-1 flex-col">
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className={`text-[11px] font-semibold uppercase tracking-wide ${p.label}`}>
                Payload (JSON)
              </span>
              <button
                type="button"
                onClick={handleFormatJson}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition ${p.formatBtn}`}
              >
                <IconBraces className="h-3.5 w-3.5" />
                Format
              </button>
            </div>
            <div className={`flex min-h-[220px] flex-1 overflow-hidden rounded-xl border ring-1 ring-black/5 ${p.inset}`}>
              <div
                ref={lineRef}
                className={`hide-scrollbar max-h-[380px] overflow-hidden overflow-y-scroll border-r py-3 pl-3 pr-2 font-mono text-[11px] leading-[1.55] select-none ${p.lineGutter}`}
              >
                {lines.map((_, i) => (
                  <div key={`ln-${i}`} className="text-right tabular-nums">
                    {i + 1}
                  </div>
                ))}
              </div>
              <textarea
                ref={textareaRef}
                value={payloadText}
                onChange={(e) => setPayloadText(e.target.value)}
                onScroll={syncScroll}
                spellCheck={false}
                className={`hide-scrollbar max-h-[380px] min-h-[220px] flex-1 resize-y overflow-y-scroll border-0 bg-transparent py-3 pr-3 pl-2 font-mono text-[13px] leading-[1.55] outline-none focus:ring-0 ${p.isLight ? "text-slate-900 placeholder:text-slate-400" : "text-gray-200 placeholder:text-gray-600"}`}
                aria-label="JSON payload"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-3.5 text-sm font-bold text-white shadow-[0_8px_30px_-8px_rgba(59,130,246,0.55)] transition hover:from-blue-400 hover:to-purple-500 hover:shadow-[0_12px_40px_-8px_rgba(139,92,246,0.45)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <IconSend className="h-4 w-4" />
            {loading ? "Publishing…" : "Publish Event"}
          </button>
        </form>
      </div>
    </section>
  );
}

export default ProducerConsole;
