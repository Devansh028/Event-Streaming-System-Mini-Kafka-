const STATUSES = new Set(["pending", "processed", "failed", "retrying"]);

const toIso = (value) => {
  if (value == null) {
    return new Date().toISOString();
  }
  if (typeof value === "string") {
    const t = Date.parse(value);
    if (!Number.isNaN(t)) {
      return new Date(t).toISOString();
    }
  }
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString();
  }
  return new Date().toISOString();
};

/**
 * Normalizes any event-like object for WebSocket clients.
 */
function buildOutboundEnvelope(input) {
  if (!input || typeof input !== "object") {
    return {
      topic: "default",
      type: "UNKNOWN",
      payload: {},
      status: "processed",
      createdAt: new Date().toISOString(),
    };
  }
  const status = STATUSES.has(input.status) ? input.status : "processed";
  const payload =
    input.payload != null && typeof input.payload === "object" && !Array.isArray(input.payload)
      ? input.payload
      : {};
  return {
    topic:
      typeof input.topic === "string" && input.topic.trim() !== ""
        ? input.topic.trim()
        : "default",
    type: typeof input.type === "string" ? input.type : "UNKNOWN",
    payload,
    status,
    createdAt: toIso(input.createdAt),
  };
}

function buildPendingEnvelope({ topic, type, payload }) {
  const t = typeof topic === "string" && topic.trim() !== "" ? topic.trim() : "default";
  return {
    topic: t,
    type,
    payload: payload != null && typeof payload === "object" && !Array.isArray(payload) ? payload : {},
    status: "pending",
    createdAt: new Date().toISOString(),
  };
}

module.exports = { buildOutboundEnvelope, buildPendingEnvelope, toIso };
