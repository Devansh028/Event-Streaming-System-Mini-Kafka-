/**
 * Minimal client for the Event Streaming System publish API.
 *
 * @example
 * // CommonJS
 * const EventClient = require("./sdk");
 * const client = new EventClient("http://localhost:5000");
 *
 * async function main() {
 *   const result = await client.publish({
 *     topic: "orders",
 *     type: "ORDER_CREATED",
 *     payload: { orderId: "ord_123", amount: 99.5 },
 *   });
 *   console.log(result); // { success: true, topic: "orders", type: "ORDER_CREATED" }
 * }
 * main().catch(console.error);
 *
 * @example
 * // ESM (rename to index.mjs or use "type": "module" in package.json)
 * import EventClient from "./sdk/index.js";
 * const client = new EventClient("http://localhost:5000");
 * await client.publish({ topic: "payments", type: "PAYMENT_OK", payload: {} });
 */

class EventClient {
  constructor(baseURL) {
    this.baseURL = baseURL.replace(/\/$/, "");
  }

  /**
   * POST /api/publish — sends an event to `{topic}-stream`.
   * @param {{ topic: string, type: string, payload: object }} params
   * @returns {Promise<object>} Parsed JSON response (e.g. `{ success, topic, type }` or error body)
   */
  async publish({ topic, type, payload }) {
    const res = await fetch(`${this.baseURL}/api/publish`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ topic, type, payload }),
    });

    return res.json();
  }
}

module.exports = EventClient;
