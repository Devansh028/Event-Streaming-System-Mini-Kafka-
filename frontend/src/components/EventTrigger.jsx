import { useState } from "react";
import { useDashPalette } from "../hooks/useDashPalette";
import api from "../services/api";

const TOPICS = [
  { value: "default", label: "default" },
  { value: "orders", label: "orders" },
  { value: "payments", label: "payments" },
];

function EventTrigger() {
  const p = useDashPalette();
  const [topic, setTopic] = useState("default");
  const [type, setType] = useState("FRONTEND_EVENT");

  const handlePublish = async () => {
    const payload = { msg: "Triggered from UI" };
    try {
      await api.post("/api/publish", {
        topic,
        type: type.trim() || "FRONTEND_EVENT",
        payload,
      });
    } catch (err) {
      console.log(err);
      alert("Failed to send event");
    }
  };

  return (
    <div className="flex flex-wrap items-end justify-end gap-3">
      <label className={`flex flex-col gap-1 text-xs font-medium uppercase tracking-wide ${p.label}`}>
        Topic
        <select
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className={`rounded-lg border px-2 py-1.5 text-sm ${p.input}`}
        >
          {TOPICS.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </label>
      <label className={`flex min-w-[10rem] flex-col gap-1 text-xs font-medium uppercase tracking-wide ${p.label}`}>
        Event type
        <input
          type="text"
          value={type}
          onChange={(e) => setType(e.target.value)}
          placeholder="ORDER_CREATED"
          className={`rounded-lg border px-2 py-1.5 text-sm ${p.input}`}
        />
      </label>
      <button
        type="button"
        onClick={handlePublish}
        className="rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:from-blue-400 hover:to-purple-500"
      >
        Publish event
      </button>
    </div>
  );
}

export default EventTrigger;
