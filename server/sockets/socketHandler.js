const { buildOutboundEnvelope } = require("../utils/eventEnvelope");

let io;

const initSocket = (server) => {
  const { Server } = require("socket.io");

  io = new Server(server, {
    cors: { origin: "*" }
  });

  io.on("connection", (socket) => {
    console.log("🔌 Client connected:", socket.id);
  });
};

const emitEvent = (event) => {
  if (!io) {
    return;
  }
  let data = event;
  if (typeof event === "string") {
    try {
      data = JSON.parse(event);
    } catch {
      data = {};
    }
  }
  io.emit("new-event", buildOutboundEnvelope(data));
};

module.exports = { initSocket, emitEvent };