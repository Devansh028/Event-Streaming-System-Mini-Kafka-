import { useState } from "react";
import { useDashPalette } from "../hooks/useDashPalette";
import api from "../services/api";

const TOPICS = [
  { value: "default", label: "default" },
  { value: "orders", label: "orders" },
  { value: "payments", label: "payments" },
];

const defaultPayload = '{\n  "msg": "Hello"\n}';

function ProducerPanel() {
  const p = useDashPalette();
  const [topic, setTopic] = useState("default");
  const [type, setType] = useState("");
  const [payloadText, setPayloadText] = useState(defaultPayload);
  const [parseError, setParseError] = useState("");
  const [requestError, setRequestError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setParseError("");
    setRequestError("");
    setSuccessMsg("");

    const trimmedType = type.trim();
    if (!trimmedType) {
      setParseError("Event type is required.");
      return;
    }

    let payload;
    try {
      payload = JSON.parse(payloadText.trim() === "" ? "{}" : payloadText);
    } catch {
      setParseError("Invalid JSON in payload. Fix the textarea and try again.");
      return;
    }

    if (payload === null || typeof payload !== "object" || Array.isArray(payload)) {
      setParseError('Payload must be a JSON object (e.g. { "key": "value" }).');
      return;
    }

    setSending(true);
    try {
      await api.post("/api/publish", {
        topic,
        type: trimmedType,
        payload,
      });
      const ok = `Published: ${topic} / ${trimmedType}`;
      setSuccessMsg(ok);
      setTimeout(() => setSuccessMsg(""), 5000);
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        "Request failed. Is the server running?";
      setRequestError(msg);
    } finally {
      setSending(false);
    }
  };

  return (
    <section className={p.card}>
      <h2 className={`mb-1 text-lg font-semibold ${p.panelTitle}`}>Producer panel</h2>
      <p className={`mb-4 text-xs ${p.panelMuted}`}>POST /api/publish</p>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className={`flex flex-col gap-1 text-xs font-medium uppercase tracking-wide ${p.label}`}>
            Topic
            <select
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className={`rounded-lg border px-2 py-2 text-sm ${p.input}`}
            >
              {TOPICS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
          <label className={`flex flex-col gap-1 text-xs font-medium uppercase tracking-wide ${p.label}`}>
            Event type
            <input
              type="text"
              value={type}
              onChange={(e) => setType(e.target.value)}
              placeholder="ORDER_CREATED"
              className={`rounded-lg border px-2 py-2 text-sm ${p.input}`}
            />
          </label>
        </div>
        <label className={`flex flex-col gap-1 text-xs font-medium uppercase tracking-wide ${p.label}`}>
          Payload (JSON object)
          <textarea
            value={payloadText}
            onChange={(e) => setPayloadText(e.target.value)}
            rows={6}
            spellCheck={false}
            className={`font-mono rounded-lg border px-2 py-2 text-sm ${p.inset}`}
          />
        </label>
        {parseError ? (
          <p className="text-sm text-red-500" role="alert">
            {parseError}
          </p>
        ) : null}
        {requestError ? (
          <p className="text-sm text-red-500" role="alert">
            {requestError}
          </p>
        ) : null}
        {successMsg ? (
          <p className={`text-sm ${p.isLight ? "text-emerald-700" : "text-emerald-400"}`} role="status">
            {successMsg}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={sending}
          className="rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:from-blue-400 hover:to-purple-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {sending ? "Sending…" : "Send"}
        </button>
      </form>
    </section>
  );
}

export default ProducerPanel;
